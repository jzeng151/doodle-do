// Structural commands (Appendix B6): frame, layer, palette, and timing
// mutations, each one command with full before/after payloads.

import type { Command, DirtyRegion } from './commands';
import { resizePixels, type AnimationTag, type Doc, type Frame, type Layer } from './document';

const DOC_DIRTY: DirtyRegion = { frame: null, rect: null };
const PALETTE_DIRTY: DirtyRegion = { frame: null, rect: null, palette: true };

function frameBytes(frame: Frame): number {
	return frame.layers.reduce((sum, l) => sum + l.pixels.byteLength, 0) + 64;
}

function replaceDocument(doc: Doc, snapshot: Doc): void {
	const copy = structuredClone(snapshot);
	doc.meta = copy.meta;
	doc.palette = copy.palette;
	doc.frames = copy.frames;
}

const copyTags = (tags?: AnimationTag[]) => tags?.map((tag) => ({ ...tag }));

export class AnimationTagsCommand implements Command {
	readonly kind = 'animation-tags';
	readonly byteSize: number;
	constructor(private readonly before: AnimationTag[] | undefined, private readonly after: AnimationTag[] | undefined) {
		this.byteSize = JSON.stringify([before, after]).length + 64;
	}
	do(doc: Doc): void { doc.meta.tags = copyTags(this.after); }
	undo(doc: Doc): void { doc.meta.tags = copyTags(this.before); }
	serialize(): unknown { return { kind: this.kind, tags: this.after }; }
	dirty(): DirtyRegion { return { frame: null, rect: null, metadata: true }; }
}

function addFrameTags(tags: AnimationTag[] | undefined, index: number) {
	return tags?.map((tag) => ({ ...tag, from: tag.from >= index ? tag.from + 1 : tag.from, to: tag.to >= index ? tag.to + 1 : tag.to }));
}

function deleteFrameTags(tags: AnimationTag[] | undefined, index: number, last: number) {
	return tags?.map((tag) => {
		const from = tag.from > index ? tag.from - 1 : Math.min(tag.from, last);
		const to = tag.to >= index ? tag.to - 1 : tag.to;
		const safeFrom = Math.max(0, Math.min(from, last));
		return { ...tag, from: safeFrom, to: Math.max(safeFrom, Math.min(to, last)) };
	});
}

function reorderFrameTags(tags: AnimationTag[] | undefined, from: number, to: number) {
	const move = (index: number) => index === from ? to : from < to && index > from && index <= to ? index - 1 : from > to && index >= to && index < from ? index + 1 : index;
	return tags?.map((tag) => {
		const moved = Array.from({ length: tag.to - tag.from + 1 }, (_, index) => move(tag.from + index));
		return { ...tag, from: Math.min(...moved), to: Math.max(...moved) };
	});
}

export class DocumentReplaceCommand implements Command {
	readonly kind = 'document-replace';
	readonly byteSize: number;
	private readonly before: Doc;
	private readonly after: Doc;

	constructor(doc: Doc, replacement: Doc) {
		this.before = structuredClone(doc);
		this.after = structuredClone(replacement);
		this.byteSize = [...this.before.frames, ...this.after.frames].reduce(
			(sum, frame) => sum + frameBytes(frame),
			256
		);
	}

	do(doc: Doc): void {
		replaceDocument(doc, this.after);
	}
	undo(doc: Doc): void {
		replaceDocument(doc, this.before);
	}
	serialize(): unknown {
		return { kind: this.kind };
	}
	dirty(): DirtyRegion {
		return PALETTE_DIRTY;
	}
}

export class PaletteSortCommand implements Command {
	readonly kind = 'palette-sort';
	private readonly replacement: DocumentReplaceCommand;
	readonly byteSize: number;
	constructor(
		doc: Doc,
		after: Doc,
		readonly beforeColors: [number, number],
		readonly afterColors: [number, number]
	) {
		this.replacement = new DocumentReplaceCommand(doc, after);
		this.byteSize = this.replacement.byteSize;
	}
	do(doc: Doc): void { this.replacement.do(doc); }
	undo(doc: Doc): void { this.replacement.undo(doc); }
	serialize(): unknown { return { kind: this.kind }; }
	dirty(): DirtyRegion { return PALETTE_DIRTY; }
}

export class FrameAddCommand implements Command {
	readonly kind = 'frame-add';
	readonly byteSize: number;
	private beforeTags?: AnimationTag[];

	// covers blank add and duplicate — the caller builds the frame payload
	constructor(
		private readonly index: number,
		private readonly frame: Frame
	) {
		this.byteSize = frameBytes(frame);
	}

	do(doc: Doc): void {
		this.beforeTags = copyTags(doc.meta.tags);
		doc.frames.splice(this.index, 0, this.frame);
		doc.meta.tags = addFrameTags(this.beforeTags, this.index);
	}
	undo(doc: Doc): void {
		doc.frames.splice(this.index, 1);
		doc.meta.tags = copyTags(this.beforeTags);
	}
	serialize(): unknown {
		return { kind: this.kind, index: this.index };
	}
	dirty(): DirtyRegion {
		return DOC_DIRTY;
	}
}

export class LinkedFrameAddCommand implements Command {
	readonly kind = 'linked-frame-add';
	readonly byteSize = 256;
	private beforeTags?: AnimationTag[];
	private beforeIds: (string | undefined)[] = [];
	constructor(private readonly sourceIndex: number, private readonly index: number, private readonly linkIds: string[]) {}
	do(doc: Doc): void {
		this.beforeTags = copyTags(doc.meta.tags);
		const source = doc.frames[this.sourceIndex];
		this.beforeIds = source.layers.map((layer) => layer.linkId);
		const layers = source.layers.map((layer, i) => {
			layer.linkId = this.linkIds[i];
			return { ...layer, pixels: layer.pixels, linkId: this.linkIds[i] };
		});
		doc.frames.splice(this.index, 0, { layers, ...(source.durationMs !== undefined && { durationMs: source.durationMs }) });
		doc.meta.tags = addFrameTags(this.beforeTags, this.index);
	}
	undo(doc: Doc): void {
		doc.frames.splice(this.index, 1);
		const source = doc.frames[this.sourceIndex];
		for (let i = 0; i < source.layers.length; i++) {
			if (this.beforeIds[i]) source.layers[i].linkId = this.beforeIds[i];
			else delete source.layers[i].linkId;
		}
		doc.meta.tags = copyTags(this.beforeTags);
	}
	serialize(): unknown { return { kind: this.kind, source: this.sourceIndex, index: this.index }; }
	dirty(): DirtyRegion { return DOC_DIRTY; }
}

export class UnlinkFrameCommand implements Command {
	readonly kind = 'unlink-frame';
	readonly byteSize: number;
	private readonly before: { pixels: Uint8Array; linkId?: string }[];
	private readonly after: Uint8Array[];
	constructor(doc: Doc, private readonly frameIndex: number) {
		this.before = doc.frames[frameIndex].layers.map((layer) => ({ pixels: layer.pixels, ...(layer.linkId && { linkId: layer.linkId }) }));
		this.after = this.before.map(({ pixels }) => pixels.slice());
		this.byteSize = this.after.reduce((sum, pixels) => sum + pixels.byteLength, 128);
	}
	do(doc: Doc): void {
		doc.frames[this.frameIndex].layers.forEach((layer, i) => { layer.pixels = this.after[i]; delete layer.linkId; });
	}
	undo(doc: Doc): void {
		doc.frames[this.frameIndex].layers.forEach((layer, i) => {
			layer.pixels = this.before[i].pixels;
			if (this.before[i].linkId) layer.linkId = this.before[i].linkId;
		});
	}
	serialize(): unknown { return { kind: this.kind, frame: this.frameIndex }; }
	dirty(): DirtyRegion { return DOC_DIRTY; }
}

export class FrameDeleteCommand implements Command {
	readonly kind = 'frame-delete';
	readonly byteSize: number;
	private readonly frame: Frame;
	private readonly beforeTags?: AnimationTag[];

	constructor(
		doc: Doc,
		private readonly index: number
	) {
		if (doc.frames.length <= 1) throw new Error('cannot delete the last frame');
		this.frame = doc.frames[index];
		this.beforeTags = copyTags(doc.meta.tags);
		this.byteSize = frameBytes(this.frame);
	}

	do(doc: Doc): void {
		doc.frames.splice(this.index, 1);
		doc.meta.tags = deleteFrameTags(this.beforeTags, this.index, doc.frames.length - 1);
	}
	undo(doc: Doc): void {
		doc.frames.splice(this.index, 0, this.frame);
		doc.meta.tags = copyTags(this.beforeTags);
	}
	serialize(): unknown {
		return { kind: this.kind, index: this.index };
	}
	dirty(): DirtyRegion {
		return DOC_DIRTY;
	}
}

export class FrameReorderCommand implements Command {
	readonly kind = 'frame-reorder';
	readonly byteSize = 64;
	private beforeTags?: AnimationTag[];

	constructor(
		private readonly from: number,
		private readonly to: number
	) {}

	do(doc: Doc): void {
		this.beforeTags = copyTags(doc.meta.tags);
		const [frame] = doc.frames.splice(this.from, 1);
		doc.frames.splice(this.to, 0, frame);
		doc.meta.tags = reorderFrameTags(this.beforeTags, this.from, this.to);
	}
	undo(doc: Doc): void {
		const [frame] = doc.frames.splice(this.to, 1);
		doc.frames.splice(this.from, 0, frame);
		doc.meta.tags = copyTags(this.beforeTags);
	}
	serialize(): unknown {
		return { kind: this.kind, from: this.from, to: this.to };
	}
	dirty(): DirtyRegion {
		return DOC_DIRTY;
	}
}

export class FrameDurationCommand implements Command {
	readonly kind = 'frame-duration';
	readonly byteSize = 64;

	constructor(
		private readonly index: number,
		private readonly before: number | undefined,
		private readonly after: number | undefined
	) {}

	do(doc: Doc): void {
		doc.frames[this.index].durationMs = this.after;
	}
	undo(doc: Doc): void {
		doc.frames[this.index].durationMs = this.before;
	}
	serialize(): unknown {
		return { kind: this.kind, index: this.index, before: this.before, after: this.after };
	}
	dirty(): DirtyRegion {
		return { frame: this.index, rect: null };
	}
}

// Canvas resize (extends §4.1 canvas presets to the existing document). One
// command: replaces every layer's pixel buffer across all frames and updates
// meta dimensions. Undo restores the old buffers by reference (no copy). The
// before/after buffers are precomputed so do()/redo() is a straight swap, the
// same pattern PixelDiffCommand uses.
export class ResizeCanvasCommand implements Command {
	readonly kind = 'canvas-resize';
	readonly byteSize: number;
	private readonly before: Uint8Array[] = [];
	private readonly after: Uint8Array[] = [];

	constructor(
		doc: Doc,
		private readonly oldW: number,
		private readonly oldH: number,
		private readonly newW: number,
		private readonly newH: number,
		mode: 'crop' | 'scale' | 'scale2x'
	) {
		const resized = new Map<Uint8Array, Uint8Array>();
		for (const frame of doc.frames) {
			for (const layer of frame.layers) {
				this.before.push(layer.pixels);
				if (!resized.has(layer.pixels)) resized.set(layer.pixels, resizePixels(layer.pixels, oldW, oldH, newW, newH, mode));
				this.after.push(resized.get(layer.pixels)!);
			}
		}
		// both buffer sets are retained (after = live doc, before = for undo)
		this.byteSize = [...new Set([...this.before, ...this.after])].reduce((n, pixels) => n + pixels.byteLength, 128);
	}

	do(doc: Doc): void {
		doc.meta.width = this.newW;
		doc.meta.height = this.newH;
		let i = 0;
		for (const frame of doc.frames) for (const layer of frame.layers) layer.pixels = this.after[i++];
	}
	undo(doc: Doc): void {
		doc.meta.width = this.oldW;
		doc.meta.height = this.oldH;
		let i = 0;
		for (const frame of doc.frames) for (const layer of frame.layers) layer.pixels = this.before[i++];
	}
	serialize(): unknown {
		return { kind: this.kind, from: { w: this.oldW, h: this.oldH }, to: { w: this.newW, h: this.newH } };
	}
	dirty(): DirtyRegion {
		return DOC_DIRTY;
	}
}

export class FpsCommand implements Command {
	readonly kind = 'fps';
	readonly byteSize = 64;

	constructor(
		private readonly before: number,
		private readonly after: number
	) {}

	do(doc: Doc): void {
		doc.meta.fps = this.after;
	}
	undo(doc: Doc): void {
		doc.meta.fps = this.before;
	}
	serialize(): unknown {
		return { kind: this.kind, before: this.before, after: this.after };
	}
	dirty(): DirtyRegion {
		return DOC_DIRTY;
	}
}

export class LayerAddCommand implements Command {
	readonly kind = 'layer-add';
	readonly byteSize: number;

	constructor(
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly layer: Layer
	) {
		this.byteSize = layer.pixels.byteLength + 64;
	}

	do(doc: Doc): void {
		doc.frames[this.frameIndex].layers.splice(this.layerIndex, 0, this.layer);
	}
	undo(doc: Doc): void {
		doc.frames[this.frameIndex].layers.splice(this.layerIndex, 1);
	}
	serialize(): unknown {
		return { kind: this.kind, frame: this.frameIndex, layer: this.layerIndex };
	}
	dirty(): DirtyRegion {
		return { frame: this.frameIndex, rect: null };
	}
}

export class LayerDeleteCommand implements Command {
	readonly kind = 'layer-delete';
	readonly byteSize: number;
	private readonly layer: Layer;

	constructor(
		doc: Doc,
		private readonly frameIndex: number,
		private readonly layerIndex: number
	) {
		if (doc.frames[frameIndex].layers.length <= 1) {
			throw new Error('cannot delete the last layer');
		}
		this.layer = doc.frames[frameIndex].layers[layerIndex];
		this.byteSize = this.layer.pixels.byteLength + 64;
	}

	do(doc: Doc): void {
		doc.frames[this.frameIndex].layers.splice(this.layerIndex, 1);
	}
	undo(doc: Doc): void {
		doc.frames[this.frameIndex].layers.splice(this.layerIndex, 0, this.layer);
	}
	serialize(): unknown {
		return { kind: this.kind, frame: this.frameIndex, layer: this.layerIndex };
	}
	dirty(): DirtyRegion {
		return { frame: this.frameIndex, rect: null };
	}
}

export class LayerReorderCommand implements Command {
	readonly kind = 'layer-reorder';
	readonly byteSize = 64;

	constructor(
		private readonly frameIndex: number,
		private readonly from: number,
		private readonly to: number
	) {}

	do(doc: Doc): void {
		const layers = doc.frames[this.frameIndex].layers;
		const [layer] = layers.splice(this.from, 1);
		layers.splice(this.to, 0, layer);
	}
	undo(doc: Doc): void {
		const layers = doc.frames[this.frameIndex].layers;
		const [layer] = layers.splice(this.to, 1);
		layers.splice(this.from, 0, layer);
	}
	serialize(): unknown {
		return { kind: this.kind, frame: this.frameIndex, from: this.from, to: this.to };
	}
	dirty(): DirtyRegion {
		return { frame: this.frameIndex, rect: null };
	}
}

export class LayerVisibilityCommand implements Command {
	readonly kind = 'layer-visibility';
	readonly byteSize = 64;

	constructor(
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly visible: boolean
	) {}

	do(doc: Doc): void {
		doc.frames[this.frameIndex].layers[this.layerIndex].visible = this.visible;
	}
	undo(doc: Doc): void {
		doc.frames[this.frameIndex].layers[this.layerIndex].visible = !this.visible;
	}
	serialize(): unknown {
		return { kind: this.kind, frame: this.frameIndex, layer: this.layerIndex, visible: this.visible };
	}
	dirty(): DirtyRegion {
		return { frame: this.frameIndex, rect: null };
	}
}

export class LayerPropertyCommand implements Command {
	readonly kind: string;
	readonly byteSize = 64;

	constructor(
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly property: 'locked' | 'opacity',
		private readonly before: boolean | number | undefined,
		private readonly after: boolean | number | undefined
	) {
		this.kind = `layer-${property}`;
	}

	private set(doc: Doc, value: boolean | number | undefined): void {
		Object.assign(doc.frames[this.frameIndex].layers[this.layerIndex], { [this.property]: value });
	}

	do(doc: Doc): void { this.set(doc, this.after); }
	undo(doc: Doc): void { this.set(doc, this.before); }
	serialize(): unknown { return { kind: this.kind, frame: this.frameIndex, layer: this.layerIndex, value: this.after }; }
	dirty(): DirtyRegion { return { frame: this.frameIndex, rect: null }; }
}

export class PaletteAddCommand implements Command {
	readonly kind = 'palette-add';
	readonly byteSize = 64;

	constructor(private readonly color: string) {}

	do(doc: Doc): void {
		doc.palette.push(this.color);
	}
	undo(doc: Doc): void {
		doc.palette.pop();
	}
	serialize(): unknown {
		return { kind: this.kind, color: this.color };
	}
	dirty(): DirtyRegion {
		return PALETTE_DIRTY;
	}
}

export class PaletteReplaceCommand implements Command {
	readonly kind = 'palette-replace';
	readonly byteSize: number;
	constructor(private readonly before: string[], private readonly after: string[]) {
		this.byteSize = JSON.stringify([before, after]).length + 64;
	}
	do(doc: Doc): void { doc.palette = [...this.after]; }
	undo(doc: Doc): void { doc.palette = [...this.before]; }
	serialize(): unknown { return { kind: this.kind, palette: this.after }; }
	dirty(): DirtyRegion { return PALETTE_DIRTY; }
}

// Palette swap (§4.2): replacing an entry updates every pixel using it
// instantly — O(1) on the document, the compositor just rebuilds its LUT.
export class PaletteSwapCommand implements Command {
	readonly kind = 'palette-swap';
	readonly byteSize = 64;

	constructor(
		private readonly index: number,
		private readonly before: string,
		private readonly after: string
	) {}

	do(doc: Doc): void {
		doc.palette[this.index] = this.after;
	}
	undo(doc: Doc): void {
		doc.palette[this.index] = this.before;
	}
	serialize(): unknown {
		return { kind: this.kind, index: this.index, before: this.before, after: this.after };
	}
	dirty(): DirtyRegion {
		return PALETTE_DIRTY;
	}
}

// Palette removal (B6): removing entry k requires a remap target chosen by
// the user when the color is in use. The command stores the remapped pixel
// set (per B3); the index shift for values above k is a deterministic,
// self-inverting transform.
export class PaletteRemoveCommand implements Command {
	readonly kind = 'palette-remove';
	readonly byteSize: number;
	private readonly color: string;
	private readonly removedValue: number; // pixel value = palette index + 1
	private readonly targetValue: number; // in pre-removal numbering
	private readonly remap: { frame: number; layer: number; indices: Uint32Array }[] = [];

	constructor(doc: Doc, paletteIndex: number, targetPaletteIndex: number) {
		if (paletteIndex === targetPaletteIndex) throw new Error('remap target is the removed color');
		this.color = doc.palette[paletteIndex];
		this.removedValue = paletteIndex + 1;
		this.targetValue = targetPaletteIndex + 1;
		let count = 0;
		const seen = new Set<Uint8Array>();
		for (let f = 0; f < doc.frames.length; f++) {
			for (let l = 0; l < doc.frames[f].layers.length; l++) {
				const pixels = doc.frames[f].layers[l].pixels;
				if (seen.has(pixels)) continue;
				seen.add(pixels);
				const hits: number[] = [];
				for (let i = 0; i < pixels.length; i++) {
					if (pixels[i] === this.removedValue) hits.push(i);
				}
				if (hits.length) {
					this.remap.push({ frame: f, layer: l, indices: new Uint32Array(hits) });
					count += hits.length;
				}
			}
		}
		this.byteSize = count * 4 + 128;
	}

	do(doc: Doc): void {
		for (const { frame, layer, indices } of this.remap) {
			const pixels = doc.frames[frame].layers[layer].pixels;
			for (const i of indices) pixels[i] = this.targetValue;
		}
		const seen = new Set<Uint8Array>();
		for (const frame of doc.frames) {
			for (const layer of frame.layers) {
				const pixels = layer.pixels;
				if (seen.has(pixels)) continue;
				seen.add(pixels);
				for (let i = 0; i < pixels.length; i++) {
					if (pixels[i] > this.removedValue) pixels[i]--;
				}
			}
		}
		doc.palette.splice(this.removedValue - 1, 1);
	}

	undo(doc: Doc): void {
		doc.palette.splice(this.removedValue - 1, 0, this.color);
		const seen = new Set<Uint8Array>();
		for (const frame of doc.frames) {
			for (const layer of frame.layers) {
				const pixels = layer.pixels;
				if (seen.has(pixels)) continue;
				seen.add(pixels);
				for (let i = 0; i < pixels.length; i++) {
					if (pixels[i] >= this.removedValue) pixels[i]++;
				}
			}
		}
		for (const { frame, layer, indices } of this.remap) {
			const pixels = doc.frames[frame].layers[layer].pixels;
			for (const i of indices) pixels[i] = this.removedValue;
		}
	}

	serialize(): unknown {
		return {
			kind: this.kind,
			index: this.removedValue - 1,
			target: this.targetValue - 1,
			remap: this.remap.map((r) => ({ ...r, indices: Array.from(r.indices) }))
		};
	}
	dirty(): DirtyRegion {
		return PALETTE_DIRTY;
	}
}
