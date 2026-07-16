// Command bus (§6.2, Appendix B). Every mutation is a Command flowing
// through one bus feeding three consumers: undo stack, autosave debouncer,
// and (future) sync log. No code path mutates the document outside a command.

import type { Doc } from './document';

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

// Where a command touched the document, for dirty-rect invalidation.
// rect === null means "whole frame"; frame === null means "whole document"
// (structural change — cached frame indices may have shifted).
// palette means the color LUT itself changed.
export interface DirtyRegion {
	frame: number | null;
	rect: Rect | null;
	palette?: boolean;
}

export interface Command {
	readonly kind: string;
	readonly byteSize: number; // estimate for the B4 memory budget
	do(doc: Doc): void;
	undo(doc: Doc): void;
	serialize(): unknown;
	dirty(): DirtyRegion;
}

// B2/B3: pencil/eraser strokes and flood fills are one command storing the
// affected pixel set as (index, before, after) — never recomputed on undo.
export class PixelDiffCommand implements Command {
	readonly kind: string;
	readonly byteSize: number;
	private readonly bbox: Rect;

	constructor(
		kind: string,
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly indices: Uint32Array,
		private readonly before: Uint8Array,
		private readonly after: Uint8Array,
		docWidth: number
	) {
		if (indices.length !== before.length || indices.length !== after.length) {
			throw new Error('pixel diff arrays must have equal length');
		}
		this.kind = kind;
		this.byteSize = indices.byteLength + before.byteLength + after.byteLength + 64;
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (let i = 0; i < indices.length; i++) {
			const x = indices[i] % docWidth;
			const y = (indices[i] / docWidth) | 0;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		this.bbox =
			indices.length === 0
				? { x: 0, y: 0, w: 0, h: 0 }
				: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
	}

	get pixelCount(): number {
		return this.indices.length;
	}

	do(doc: Doc): void {
		const pixels = doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (let i = 0; i < this.indices.length; i++) pixels[this.indices[i]] = this.after[i];
	}

	undo(doc: Doc): void {
		const pixels = doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (let i = 0; i < this.indices.length; i++) pixels[this.indices[i]] = this.before[i];
	}

	serialize(): unknown {
		return {
			kind: this.kind,
			frame: this.frameIndex,
			layer: this.layerIndex,
			indices: Array.from(this.indices),
			before: Array.from(this.before),
			after: Array.from(this.after)
		};
	}

	dirty(): DirtyRegion {
		return { frame: this.frameIndex, rect: this.bbox };
	}
}

// Several mutations as ONE undo step (extract-to-layer, layer merge, ...):
// do runs children in order, undo in reverse.
export class CompositeCommand implements Command {
	readonly byteSize: number;

	constructor(
		readonly kind: string,
		private readonly commands: Command[]
	) {
		this.byteSize = commands.reduce((sum, c) => sum + c.byteSize, 0) + 64;
	}

	do(doc: Doc): void {
		for (const c of this.commands) c.do(doc);
	}

	undo(doc: Doc): void {
		for (let i = this.commands.length - 1; i >= 0; i--) this.commands[i].undo(doc);
	}

	serialize(): unknown {
		return { kind: this.kind, commands: this.commands.map((c) => c.serialize()) };
	}

	dirty(): DirtyRegion {
		// whole frame when children agree on one, whole document otherwise
		const regions = this.commands.map((c) => c.dirty());
		const palette = regions.some((r) => r.palette);
		const frame = regions.every((r) => r.frame === regions[0]?.frame) ? (regions[0]?.frame ?? null) : null;
		return { frame, rect: null, ...(palette && { palette: true }) };
	}
}

// B4: 200 commands or 8MB per document, whichever hits first; evict oldest.
export const UNDO_MAX_COMMANDS = 200;
export const UNDO_MAX_BYTES = 8 * 1024 * 1024;

export class CommandBus {
	private undoStack: Command[] = [];
	private redoStack: Command[] = [];
	private undoBytes = 0;
	private changeListeners: ((region: DirtyRegion) => void)[] = [];
	private commitListeners: ((cmd: Command) => void)[] = [];

	constructor(readonly doc: Doc) {}

	// applied: true when the tool already mutated the document optimistically
	// during the drag (B2) — the command is recorded without re-running do().
	dispatch(cmd: Command, opts: { applied?: boolean } = {}): void {
		if (!opts.applied) cmd.do(this.doc);
		this.undoStack.push(cmd);
		this.undoBytes += cmd.byteSize;
		while (
			this.undoStack.length > UNDO_MAX_COMMANDS ||
			(this.undoBytes > UNDO_MAX_BYTES && this.undoStack.length > 1)
		) {
			this.undoBytes -= this.undoStack.shift()!.byteSize;
		}
		this.redoStack = [];
		this.emitChange(cmd.dirty());
		for (const l of this.commitListeners) l(cmd);
	}

	undo(): boolean {
		const cmd = this.undoStack.pop();
		if (!cmd) return false;
		this.undoBytes -= cmd.byteSize;
		cmd.undo(this.doc);
		this.redoStack.push(cmd);
		this.emitChange(cmd.dirty());
		for (const l of this.commitListeners) l(cmd);
		return true;
	}

	redo(): boolean {
		const cmd = this.redoStack.pop();
		if (!cmd) return false;
		cmd.do(this.doc);
		this.undoStack.push(cmd);
		this.undoBytes += cmd.byteSize;
		this.emitChange(cmd.dirty());
		for (const l of this.commitListeners) l(cmd);
		return true;
	}

	get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	get undoDepth(): number {
		return this.undoStack.length;
	}

	get undoByteSize(): number {
		return this.undoBytes;
	}

	// Render invalidation. Tools also call this directly for optimistic
	// mid-drag repaints (the mutation is only *recorded* at pointer-up).
	emitChange(region: DirtyRegion): void {
		for (const l of this.changeListeners) l(region);
	}

	onChange(listener: (region: DirtyRegion) => void): () => void {
		this.changeListeners.push(listener);
		return () => {
			this.changeListeners = this.changeListeners.filter((l) => l !== listener);
		};
	}

	// Fires on every committed command (dispatch/undo/redo) — the autosave
	// debouncer and future sync log hook here (§4.7, B1).
	onCommit(listener: (cmd: Command) => void): () => void {
		this.commitListeners.push(listener);
		return () => {
			this.commitListeners = this.commitListeners.filter((l) => l !== listener);
		};
	}
}
