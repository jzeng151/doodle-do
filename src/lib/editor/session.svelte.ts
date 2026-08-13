// Editor session: one document + its command bus + compositor, plus the
// view state that is deliberately NOT undoable (Appendix B7). `version`
// bumps on every committed change so Svelte views can react to document
// mutations that live outside its reactivity (Uint8Arrays).

import { createDoc, createLayer, frameDurationMs, MAX_CANVAS, MAX_LAYERS, MAX_PALETTE, type AnimationTag, type Doc } from '../core/document';
import { CommandBus, CompositeCommand, type Rect } from '../core/commands';
import {
	AnimationTagsCommand,
	DocumentReplaceCommand,
	FpsCommand,
	FrameAddCommand,
	FrameDeleteCommand,
	FrameDurationCommand,
	FrameReorderCommand,
	LayerAddCommand,
	LayerDeleteCommand,
	LayerReorderCommand,
	LayerVisibilityCommand,
	PaletteAddCommand,
	PaletteRemoveCommand,
	PaletteReplaceCommand,
	PaletteSwapCommand,
	PaletteSortCommand,
	ResizeCanvasCommand
} from '../core/structural';
import { Compositor } from '../render/compositor';
import { floodFill, floodRegion } from '../tools/fill';
import { samplePixel } from '../tools/sample';
import { FlipLayerCommand } from '../tools/flip';
import { constrainLineEndpoint, StrokeBuilder } from '../tools/pencil';
import { ellipsePoints, rectanglePoints } from '../tools/shapes';
import { replaceColorCommand } from '../tools/replace';
import { flipStamp, rotateStamp, stampCommand, type Stamp } from '../tools/stamp';
import { combineMasks, FloatingSelection, maskFromPolygon, maskFromRects, mirrorMaskX, type SelectionMode } from '../tools/selection';
import { mergeDownCommand, sendLayerCommand } from '../tools/layers';
import { colorRamp, DEFAULT_PALETTE, sortPaletteRange, type PaletteSort } from '../core/palette';
import { tips } from '../learn/tips';
import { paletteFromArtwork } from '../io/palette';

export type Tool =
	| 'pencil'
	| 'line'
	| 'rectangle'
	| 'ellipse'
	| 'move'
	| 'stamp'
	| 'eraser'
	| 'fill'
	| 'eyedropper'
	| 'select'
	| 'lasso'
	| 'wand'
	| 'polygon';
export type Mode = 'focus' | 'grid' | 'loop' | 'compare';
export type ReplaceScope = 'selection' | 'layer' | 'frame' | 'frames' | 'animation';

// selection gestures stay in the editable single-canvas views (B5)
export const SELECT_TOOLS: readonly Tool[] = ['select', 'lasso', 'wand', 'polygon'];

export function createDefaultDoc(): Doc {
	// Smart defaults (§4.5): 32×32, 8 FPS, 2 frames, starter palette.
	return createDoc({ width: 32, height: 32, fps: 8, palette: DEFAULT_PALETTE });
}

export class EditorSession {
	readonly doc: Doc;
	readonly bus: CommandBus;
	readonly compositor: Compositor;

	version = $state(0);
	currentFrame = $state(0);
	currentLayer = $state(0);
	mode = $state<Mode>('focus'); // workspace mode is view state (B7), never document state
	tool = $state<Tool>('pencil');
	brushSize = $state(1);
	pixelPerfect = $state(false);
	ditherEnabled = $state(false);
	ditherSize = $state<2 | 4>(2);
	shapeFilled = $state(false);
	fillTolerance = $state(0);
	fillContiguous = $state(true);
	selectionMode = $state<SelectionMode>('replace');
	stamp = $state<Stamp | null>(null);
	mirrorX = $state(false);
	colorValue = $state(1);
	backgroundColorValue = $state(2);
	zoom = $state(12);
	fitCheckedDimensions = '';
	gridZoom: number; // grid-mode tile scale; separate so focus zoom persists across toggles (§4.4)
	showGrid = $state(false);
	paletteLocked = $state(false);
	onionEnabled = $state(true); // on by default (§4.5)
	onionPreviousEnabled = $state(true);
	onionNextEnabled = $state(true);
	onionOpacity = $state(0.35);
	autosavedAt = $state<Date | null>(null);
	// playback range (view state, B7): null = all frames; clamped on read
	loopRange = $state<{ start: number; end: number } | null>(null);
	loopPlaybackSpeed = $state(1);
	loopPlaybackMode = $state<'forward' | 'reverse' | 'ping-pong'>('forward');
	loopRepeatCount = $state(0);
	activeAnimationTagName = $state('');
	showPreviewBackground = $state(true);
	comparisonSession: EditorSession | null = null;
	comparisonVersion = $state(0);
	// bulk edit set: frame indices mutations fan out to; empty = just the
	// current frame. Sorted, and always includes currentFrame when non-empty.
	// Cleared by plain frame select, frame add/delete/reorder, mode switch.
	bulkFrames = $state<number[]>([]);

	// selection (B5): the baked mask, in-progress gesture previews, and the
	// floating buffer are view state until commit, when the whole move
	// becomes one command
	selectionMask = $state<Uint8Array | null>(null); // canvas-sized, 1 = selected
	private previousSelectionMask = $state<Uint8Array | null>(null);
	private gestureBaseMask: Uint8Array | null = null;
	private gestureSelectionMode: SelectionMode = 'replace';
	pendingRect = $state<Rect | null>(null); // rect-marquee drag preview
	lassoPath = $state<{ x: number; y: number }[] | null>(null);
	polygonVerts = $state<{ x: number; y: number }[] | null>(null);
	floating = $state<FloatingSelection | null>(null);
	// mirror-draw's twin, for selections: lifted from the mirrored mask when
	// Mirror is on, driven with mirrored transforms; commits with the main
	floatingTwin = $state<FloatingSelection | null>(null);
	// bulk edit: the same selection lifted on every other set frame; driven
	// in lockstep with the active frame's floats, committed in one composite
	private floatingPeers: { main: FloatingSelection; twin: FloatingSelection | null }[] = [];
	overlayVersion = $state(0); // bumps on selection/floating changes only

	// for the T15 save-to-disk reminder
	savedToDiskAt = $state<Date | null>(null);
	readonly startedAt = Date.now();
	unsavedCommits = $state(0);

	private strokes: { frame: number; builder: StrokeBuilder }[] = [];
	private lineOrigin: { x: number; y: number } | null = null;
	private shapeOrigin: { x: number; y: number } | null = null;
	private manualPaletteAdds = 0;
	private paletteRemovalColors = new WeakMap<PaletteRemoveCommand, { before: [number, number]; after: [number, number] }>();

	constructor(doc: Doc) {
		this.doc = doc;
		this.bus = new CommandBus(doc);
		this.compositor = new Compositor(doc);
		this.gridZoom = $state(Math.max(2, Math.floor(96 / Math.max(doc.meta.width, doc.meta.height))));
		this.backgroundColorValue = Math.min(2, doc.palette.length);
		this.bus.onChange((region) => {
			this.compositor.invalidate(region);
			this.currentFrame = Math.min(this.currentFrame, doc.frames.length - 1);
			this.currentLayer = Math.min(
				this.currentLayer,
				doc.frames[this.currentFrame].layers.length - 1
			);
			this.colorValue = Math.min(this.colorValue, doc.palette.length);
			this.backgroundColorValue = Math.min(this.backgroundColorValue, doc.palette.length);
			this.version++;
		});
		this.bus.onCommit((command, action) => {
			if (command instanceof PaletteSortCommand) {
				const map = action === 'undo' ? command.reverseColors : command.forwardColors;
				this.colorValue = map.get(this.colorValue) ?? this.colorValue;
				this.backgroundColorValue = map.get(this.backgroundColorValue) ?? this.backgroundColorValue;
			}
			if (command instanceof ResizeCanvasCommand) {
				this.selectionMask = null;
				this.previousSelectionMask = null;
				this.clearGestures();
				this.overlayVersion++;
			}
			const colors = command instanceof PaletteRemoveCommand ? this.paletteRemovalColors.get(command) : undefined;
			if (colors) [this.colorValue, this.backgroundColorValue] = action === 'undo' ? colors.before : colors.after;
			if (command instanceof PaletteRemoveCommand || command instanceof PaletteSortCommand) this.invalidateStamp();
			this.unsavedCommits++;
		});
	}

	private invalidateStamp(): void {
		this.stamp = null;
		if (this.tool === 'stamp') this.tool = 'pencil';
	}

	get frame() {
		return this.doc.frames[this.currentFrame];
	}

	// --- view transitions that must resolve a pending selection first (B5) ---

	setTool(tool: Tool): void {
		if (tool === this.tool) return;
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		this.selectionMask = null;
		this.clearGestures();
		this.overlayVersion++;
		this.tool = tool;
		if (tool === 'select') tips.fire('T17'); // lasso/wand/polygon exist
		if (tool === 'polygon') tips.fire('T18'); // how to close the shape
	}

	// Modes are pure views over this one session (§4.4): switching preserves
	// document, current frame, zoom, and palette because nothing is rebuilt.
	setMode(mode: Mode): void {
		if (mode === this.mode) return;
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating(); // B5: mode switch commits a pending selection
		this.selectionMask = null;
		this.clearGestures();
		this.bulkFrames = [];
		this.overlayVersion++;
		if (mode !== 'focus' && mode !== 'compare' && SELECT_TOOLS.includes(this.tool)) this.tool = 'pencil';
		if (mode === 'compare' && !this.comparisonSession) this.resetComparisonFork();
		this.mode = mode;
		if (mode === 'loop') tips.fire('T21'); // playback range
		if (mode === 'compare') tips.fire('T27'); // independent editable fork
	}

	resetComparisonFork(): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		this.comparisonSession = new EditorSession(structuredClone(this.doc));
		this.comparisonVersion++;
	}

	applyComparisonFork(): void {
		if (!this.comparisonSession) return;
		this.lineEnd();
		this.shapeEnd();
		this.comparisonSession.lineEnd();
		this.comparisonSession.shapeEnd();
		this.commitFloating();
		this.comparisonSession.commitFloating();
		this.selectionMask = null;
		this.previousSelectionMask = null;
		this.invalidateStamp();
		this.clearGestures();
		this.bulkFrames = [];
		this.overlayVersion++;
		this.bus.dispatch(new DocumentReplaceCommand(this.doc, this.comparisonSession.doc));
	}

	swapComparisonFork(): void {
		const fork = this.comparisonSession;
		if (!fork) return;
		this.lineEnd();
		this.shapeEnd();
		fork.lineEnd();
		fork.shapeEnd();
		this.commitFloating();
		fork.commitFloating();
		const currentDoc = structuredClone(this.doc);
		const forkDoc = structuredClone(fork.doc);
		this.selectionMask = fork.selectionMask = null;
		this.previousSelectionMask = fork.previousSelectionMask = null;
		this.invalidateStamp();
		fork.invalidateStamp();
		this.clearGestures();
		fork.clearGestures();
		this.bulkFrames = fork.bulkFrames = [];
		this.overlayVersion++;
		fork.overlayVersion++;
		this.bus.dispatch(new DocumentReplaceCommand(this.doc, forkDoc));
		fork.bus.dispatch(new DocumentReplaceCommand(fork.doc, currentDoc));
	}

	selectFrame(index: number): void {
		if (index !== this.currentFrame) {
			this.lineEnd();
			this.shapeEnd();
		}
		this.commitFloating(); // B5: frame change commits
		this.bulkFrames = []; // plain select exits bulk editing
		this.currentFrame = index;
		this.currentLayer = Math.min(this.currentLayer, this.frame.layers.length - 1);
		if (index === 1) tips.fire('T02');
		if (this.doc.frames.length >= 3) tips.fire('T25'); // bulk-edit discovery
	}

	// --- bulk edit set (Ctrl/Shift-click in the frame strip) ---

	// the frames a mutation applies to, skipping any whose layer stack is
	// shorter than the active layer
	private editTargets(): number[] {
		const frames = this.bulkFrames.length ? this.bulkFrames : [this.currentFrame];
		return frames.filter((f) => this.currentLayer < this.doc.frames[f].layers.length);
	}

	toggleBulkFrame(index: number): void {
		if (index < 0 || index >= this.doc.frames.length) return;
		this.commitFloating();
		const set = new Set(this.bulkFrames.length ? this.bulkFrames : [this.currentFrame]);
		if (index !== this.currentFrame) {
			if (set.has(index)) set.delete(index);
			else set.add(index);
		}
		const next = [...set].sort((a, b) => a - b);
		this.bulkFrames = next.length > 1 ? next : [];
		this.overlayVersion++;
		if (this.bulkFrames.length) tips.fire('T26');
	}

	selectBulkRange(index: number): void {
		if (index < 0 || index >= this.doc.frames.length) return;
		this.commitFloating();
		const lo = Math.min(this.currentFrame, index);
		const hi = Math.max(this.currentFrame, index);
		this.bulkFrames = hi > lo ? Array.from({ length: hi - lo + 1 }, (_, k) => lo + k) : [];
		this.overlayVersion++;
		if (this.bulkFrames.length) tips.fire('T26');
	}

	toggleOnion(): void {
		this.onionEnabled = !this.onionEnabled;
		if (!this.onionEnabled) tips.fire('T04');
	}

	toggleMirror(): void {
		this.mirrorX = !this.mirrorX;
		if (this.mirrorX) tips.fire('T13');
	}

	togglePaletteLock(): void {
		this.paletteLocked = !this.paletteLocked;
		if (this.paletteLocked) tips.fire('T07');
	}

	selectLayer(index: number): void {
		this.commitFloating(); // selection lives on the active layer
		this.currentLayer = index;
	}

	// --- selection (B5) ---

	// Shift temporarily selects Add; otherwise the explicit toolbar mode wins.
	private startGesture(additive: boolean): void {
		this.commitFloating();
		this.gestureSelectionMode = additive ? 'add' : this.selectionMode;
		this.gestureBaseMask = this.selectionMask?.slice() ?? null;
	}

	// Compose a gesture with the current selection using the active mode.
	private bakeMask(add: Uint8Array): void {
		this.selectionMask = combineMasks(this.selectionMask, add, this.gestureSelectionMode);
		this.previousSelectionMask = this.gestureBaseMask;
		this.gestureBaseMask = null;
		tips.fire('T16'); // shift-add + rotate handle
		tips.fire('T19'); // extract-to-layer (waits its turn behind T16)
	}

	selectAll(): void {
		this.commitFloating();
		this.clearGestures();
		this.previousSelectionMask = this.selectionMask?.slice() ?? null;
		this.selectionMask = new Uint8Array(this.doc.meta.width * this.doc.meta.height).fill(1);
		this.overlayVersion++;
	}

	deselect(): void {
		if (!this.selectionMask && !this.floating) return;
		this.commitFloating();
		this.previousSelectionMask = this.selectionMask?.slice() ?? null;
		this.selectionMask = null;
		this.clearGestures();
		this.overlayVersion++;
	}

	invertSelection(): void {
		const before = this.floating?.coverageMask() ?? this.selectionMask?.slice() ?? null;
		this.commitFloating();
		this.clearGestures();
		const length = this.doc.meta.width * this.doc.meta.height;
		const inverted = new Uint8Array(length);
		for (let i = 0; i < length; i++) inverted[i] = Number(!before?.[i]);
		this.selectionMask = inverted.some(Boolean) ? inverted : null;
		this.previousSelectionMask = before;
		this.overlayVersion++;
	}

	reselect(): void {
		if (!this.previousSelectionMask) return;
		this.commitFloating();
		this.clearGestures();
		const current = this.selectionMask?.slice() ?? null;
		this.selectionMask = this.previousSelectionMask;
		this.previousSelectionMask = current;
		this.overlayVersion++;
	}

	beginMarquee(x: number, y: number, additive = false): void {
		this.startGesture(additive);
		this.pendingRect = { x, y, w: 1, h: 1 };
		this.marqueeAnchor = { x, y };
		this.overlayVersion++;
	}

	private marqueeAnchor = { x: 0, y: 0 };

	updateMarquee(x: number, y: number): void {
		if (!this.pendingRect) return;
		const a = this.marqueeAnchor;
		this.pendingRect = {
			x: Math.min(a.x, x),
			y: Math.min(a.y, y),
			w: Math.abs(x - a.x) + 1,
			h: Math.abs(y - a.y) + 1
		};
		this.overlayVersion++;
	}

	endMarquee(): void {
		if (!this.pendingRect) return;
		this.bakeMask(maskFromRects([this.pendingRect], this.doc.meta.width, this.doc.meta.height));
		this.pendingRect = null;
		this.overlayVersion++;
	}

	// lasso: freehand path in float pixel coords, auto-closed on release
	beginLasso(x: number, y: number, additive = false): void {
		this.startGesture(additive);
		this.lassoPath = [{ x, y }];
		this.overlayVersion++;
	}

	updateLasso(x: number, y: number): void {
		if (!this.lassoPath) return;
		this.lassoPath = [...this.lassoPath, { x, y }];
		this.overlayVersion++;
	}

	endLasso(): void {
		if (!this.lassoPath) return;
		this.bakeMask(maskFromPolygon(this.lassoPath, this.doc.meta.width, this.doc.meta.height));
		this.lassoPath = null;
		this.overlayVersion++;
	}

	// wand: the 4-connected same-color region on the active layer
	wandSelect(x: number, y: number, additive = false): void {
		this.startGesture(additive);
		const { width, height } = this.doc.meta;
		const pixels = this.doc.frames[this.currentFrame].layers[this.currentLayer].pixels;
		const region = floodRegion(pixels, width, height, x, y);
		const mask = new Uint8Array(width * height);
		for (const i of region) mask[i] = 1;
		this.bakeMask(mask);
		this.overlayVersion++;
	}

	// polygon: click places vertices; close by clicking the first vertex
	// (canvas-side) or pressing Enter; Escape discards
	polygonAdd(x: number, y: number, additive = false): void {
		if (!this.polygonVerts) {
			this.startGesture(additive);
			this.polygonVerts = [{ x, y }];
		} else {
			this.polygonVerts = [...this.polygonVerts, { x, y }];
		}
		this.overlayVersion++;
	}

	closePolygon(): void {
		if (!this.polygonVerts) return;
		if (this.polygonVerts.length >= 3) {
			this.bakeMask(maskFromPolygon(this.polygonVerts, this.doc.meta.width, this.doc.meta.height));
		}
		this.polygonVerts = null;
		this.overlayVersion++;
	}

	private clearGestures(): void {
		this.pendingRect = null;
		this.lassoPath = null;
		this.polygonVerts = null;
		this.gestureBaseMask = null;
	}

	selectionContains(x: number, y: number): boolean {
		return !!this.selectionMask?.[y * this.doc.meta.width + x];
	}

	// mask extents, for the rotate handle before the selection lifts
	selectionBounds(): Rect | null {
		const mask = this.selectionMask;
		if (!mask) return null;
		const { width, height } = this.doc.meta;
		let minX = width,
			minY = height,
			maxX = -1,
			maxY = -1;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (!mask[y * width + x]) continue;
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
		return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
	}

	// Starting a move lifts the mask into a floating buffer — the source
	// pixels clear and a pending command begins.
	liftSelection(mirrored = this.mirrorX): void {
		if (this.floating || !this.selectionMask) return;
		const mask = this.selectionMask;
		const { width, height } = this.doc.meta;
		const mirroredMask = mirrored ? mirrorMaskX(mask, width, height) : null;
		// per frame, the main lifts FIRST: its snapshot is the pristine layer
		// that pair commit/cancel run against
		const liftOn = (frame: number) => ({
			main: new FloatingSelection(this.doc, frame, this.currentLayer, mask),
			twin: mirroredMask ? new FloatingSelection(this.doc, frame, this.currentLayer, mirroredMask) : null
		});
		const active = liftOn(this.currentFrame);
		this.floating = active.main;
		this.floatingTwin = active.twin;
		this.floatingPeers = this.editTargets()
			.filter((f) => f !== this.currentFrame)
			.map(liftOn);
		if (mirroredMask) tips.fire('T24');
		this.selectionMask = null;
		this.overlayVersion++;
		this.bus.emitChange({
			frame: this.currentFrame,
			rect: this.floatingTwin ? null : this.floating.rect // twin: whole frame
		});
		for (const p of this.floatingPeers) {
			this.bus.emitChange({ frame: p.main.frameIndex, rect: null }); // lifted holes
		}
		tips.fire('T20'); // arrow-key nudge
	}

	beginLayerMove(): void {
		if (this.floating || !this.frame.layers[this.currentLayer]) return;
		this.selectionMask = new Uint8Array(this.doc.meta.width * this.doc.meta.height).fill(1);
		this.liftSelection(false);
	}

	floatingSelections(frame: number): FloatingSelection[] {
		const active = frame === this.currentFrame ? [this.floatingTwin, this.floating] : [];
		const peer = this.floatingPeers.find((entry) => entry.main.frameIndex === frame);
		return [...active, peer?.twin, peer?.main].filter((selection): selection is FloatingSelection => !!selection);
	}

	endLayerMove(): void {
		this.commitFloating();
	}

	captureSelectionStamp(): void {
		if (!this.selectionMask) return;
		const bounds = this.selectionBounds();
		if (!bounds) return;
		const source = this.frame.layers[this.currentLayer].pixels;
		const pixels = new Uint8Array(bounds.w * bounds.h);
		for (let y = 0; y < bounds.h; y++) for (let x = 0; x < bounds.w; x++) {
			const index = (bounds.y + y) * this.doc.meta.width + bounds.x + x;
			if (this.selectionMask[index]) pixels[y * bounds.w + x] = source[index];
		}
		if (!pixels.some(Boolean)) return;
		this.stamp = { width: bounds.w, height: bounds.h, pixels };
		this.setTool('stamp');
	}

	placeStamp(x: number, y: number): void {
		if (!this.stamp || this.floating) return;
		const cmds = this.editTargets().map((frame) => stampCommand(this.doc, frame, this.currentLayer, this.stamp!, x, y)).filter((cmd): cmd is NonNullable<typeof cmd> => cmd !== null);
		if (cmds.length === 1) this.bus.dispatch(cmds[0]);
		else if (cmds.length) this.bus.dispatch(new CompositeCommand('bulk-selection-stamp', cmds));
	}

	flipStamp(): void { if (this.stamp) this.stamp = flipStamp(this.stamp); }
	rotateStamp(): void { if (this.stamp) this.stamp = rotateStamp(this.stamp); }

	moveFloatingBy(dx: number, dy: number): void {
		if (!this.floating || (dx === 0 && dy === 0)) return;
		this.floating.moveBy(dx, dy);
		this.floatingTwin?.moveBy(-dx, dy); // mirrored motion
		for (const p of this.floatingPeers) {
			p.main.moveBy(dx, dy);
			p.twin?.moveBy(-dx, dy);
		}
		this.overlayVersion++;
		tips.fire('T14');
	}

	rotateFloating(angleRad: number): void {
		if (!this.floating || angleRad === this.floating.angle) return;
		this.floating.rotateTo(angleRad);
		this.floatingTwin?.rotateTo(-angleRad); // mirrored rotation
		for (const p of this.floatingPeers) {
			p.main.rotateTo(angleRad);
			p.twin?.rotateTo(-angleRad);
		}
		this.overlayVersion++;
	}

	rotateSelectionBy(deltaRad: number): void {
		if (this.selectionMask && !this.floating) this.liftSelection();
		if (this.floating) this.rotateFloating(this.floating.angle + deltaRad);
	}

	// arrow-key nudge: a bare mask lifts first, like flip()
	nudgeSelection(dx: number, dy: number): void {
		if (this.selectionMask && !this.floating) this.liftSelection();
		this.moveFloatingBy(dx, dy);
	}

	get hasSelection(): boolean {
		return this.floating !== null || this.selectionMask !== null;
	}

	get canReselect(): boolean {
		return this.previousSelectionMask !== null;
	}

	commitFloating(): void {
		if (!this.floating) return;
		const sel = this.floating;
		const twin = this.floatingTwin;
		const peers = this.floatingPeers;
		this.floating = null;
		this.floatingTwin = null;
		this.floatingPeers = [];
		this.selectionMask = null;
		this.clearGestures();
		this.overlayVersion++;
		const cmds = [
			twin ? sel.commitPair(twin) : sel.commit(),
			...peers.map((p) => (p.twin ? p.main.commitPair(p.twin) : p.main.commit()))
		].filter((c): c is NonNullable<typeof c> => c !== null);
		if (cmds.length === 1) this.bus.dispatch(cmds[0], { applied: true });
		else if (cmds.length) {
			this.bus.dispatch(new CompositeCommand('bulk-selection-move', cmds), { applied: true });
		} else this.bus.emitChange({ frame: sel.frameIndex, rect: null });
	}

	cancelFloating(): void {
		const restoreGesture = !!(this.pendingRect || this.lassoPath || this.polygonVerts);
		const gestureBase = this.gestureBaseMask?.slice() ?? null;
		if (this.floating) {
			const sel = this.floating;
			this.floating = null;
			this.floatingTwin = null; // main's snapshot predates the twin's lift
			sel.cancel();
			this.bus.emitChange({ frame: sel.frameIndex, rect: null });
			for (const p of this.floatingPeers) {
				p.main.cancel();
				this.bus.emitChange({ frame: p.main.frameIndex, rect: null });
			}
			this.floatingPeers = [];
		}
		this.selectionMask = restoreGesture ? gestureBase : null;
		this.clearGestures();
		this.overlayVersion++;
	}

	// --- strokes (B2: one command per drag, finalized on pointer-up) ---

	strokeBegin(x: number, y: number, colorValue = this.colorValue, secondaryColorValue = this.backgroundColorValue): void {
		if (this.floating) return; // B5: drawing disabled while floating
		const value = this.tool === 'eraser' ? 0 : colorValue;
		// one builder per bulk-edit frame, driven in lockstep
		this.strokes = this.editTargets().map((frame) => ({
			frame,
			builder: new StrokeBuilder(
				this.doc,
				frame,
				this.currentLayer,
				value,
				this.brushSize,
				this.mirrorX,
				undefined,
				this.tool === 'pencil' && this.pixelPerfect,
				this.ditherEnabled && this.tool !== 'eraser' ? secondaryColorValue : undefined,
				this.ditherEnabled && this.tool !== 'eraser' ? this.ditherSize : 0
			)
		}));
		for (const s of this.strokes) {
			const rect = s.builder.begin(x, y);
			if (rect) this.bus.emitChange({ frame: s.frame, rect });
		}
	}

	strokeMove(x: number, y: number): void {
		for (const s of this.strokes) {
			const rect = s.builder.moveTo(x, y);
			if (rect) this.bus.emitChange({ frame: s.frame, rect });
		}
	}

	strokeEnd(): void {
		if (!this.strokes.length) return;
		const cmds = this.strokes
			.map((s) => s.builder.end())
			.filter((c): c is NonNullable<typeof c> => c !== null);
		this.strokes = [];
		if (cmds.length === 1) this.bus.dispatch(cmds[0], { applied: true });
		else if (cmds.length) this.bus.dispatch(new CompositeCommand('bulk-stroke', cmds), { applied: true });
	}

	lineBegin(x: number, y: number, colorValue = this.colorValue, secondaryColorValue = this.backgroundColorValue): void {
		if (this.floating) return;
		this.lineEnd();
		this.lineOrigin = { x, y };
		this.strokes = this.editTargets().map((frame) => ({
			frame,
			builder: new StrokeBuilder(
				this.doc,
				frame,
				this.currentLayer,
				colorValue,
				this.brushSize,
				this.mirrorX,
				'line',
				false,
				this.ditherEnabled ? secondaryColorValue : undefined,
				this.ditherEnabled ? this.ditherSize : 0
			)
		}));
		for (const s of this.strokes) {
			const rect = s.builder.begin(x, y);
			if (rect) this.bus.emitChange({ frame: s.frame, rect });
		}
	}

	lineMove(x: number, y: number, constrained = false): void {
		if (!this.lineOrigin) return;
		const end = constrained
			? constrainLineEndpoint(this.lineOrigin.x, this.lineOrigin.y, x, y)
			: { x, y };
		for (const s of this.strokes) {
			const rect = s.builder.previewLineTo(end.x, end.y);
			if (rect) this.bus.emitChange({ frame: s.frame, rect });
		}
	}

	lineEnd(): void {
		this.lineOrigin = null;
		this.strokeEnd();
	}

	shapeBegin(x: number, y: number, colorValue = this.colorValue, secondaryColorValue = this.backgroundColorValue): void {
		if (this.floating || (this.tool !== 'rectangle' && this.tool !== 'ellipse')) return;
		this.shapeEnd();
		this.shapeOrigin = { x, y };
		this.strokes = this.editTargets().map((frame) => ({
			frame,
			builder: new StrokeBuilder(
				this.doc,
				frame,
				this.currentLayer,
				colorValue,
				this.brushSize,
				this.mirrorX,
				this.tool,
				false,
				this.ditherEnabled ? secondaryColorValue : undefined,
				this.ditherEnabled ? this.ditherSize : 0
			)
		}));
		this.shapeMove(x, y);
	}

	shapeMove(x: number, y: number): void {
		if (!this.shapeOrigin) return;
		const bounds = this.doc.meta;
		const points = this.tool === 'ellipse'
			? ellipsePoints(this.shapeOrigin, { x, y }, this.shapeFilled, bounds)
			: rectanglePoints(this.shapeOrigin, { x, y }, this.shapeFilled, bounds);
		for (const s of this.strokes) {
			const rect = s.builder.previewPoints(points);
			if (rect) this.bus.emitChange({ frame: s.frame, rect });
		}
	}

	shapeEnd(): void {
		this.shapeOrigin = null;
		this.strokeEnd();
	}

	cancelLine(): void {
		for (const stroke of this.strokes) {
			const rect = stroke.builder.cancel();
			if (rect) this.bus.emitChange({ frame: stroke.frame, rect });
		}
		this.strokes = [];
		this.lineOrigin = null;
		this.shapeOrigin = null;
	}

	get strokeActive(): boolean {
		return this.strokes.length > 0;
	}

	get lineActive(): boolean {
		return this.lineOrigin !== null;
	}

	get shapeActive(): boolean {
		return this.shapeOrigin !== null;
	}

	// --- other tools ---

	fill(x: number, y: number, colorValue = this.colorValue, secondaryColorValue = this.backgroundColorValue): void {
		this.lineEnd();
		this.shapeEnd();
		if (this.floating) return; // B5: drawing disabled while floating
		const cmds = this.editTargets()
			.map((f) => floodFill(
				this.doc,
				f,
				this.currentLayer,
				x,
				y,
				colorValue,
				Math.max(0, Math.min(255, this.fillTolerance || 0)),
				this.fillContiguous,
				this.ditherEnabled ? secondaryColorValue : undefined,
				this.ditherEnabled ? this.ditherSize : 0
			))
			.filter((c): c is NonNullable<typeof c> => c !== null);
		if (!cmds.length) return;
		if (cmds.length === 1) {
			this.bus.dispatch(cmds[0]);
			if (cmds[0].pixelCount < 4) tips.fire('T05');
		} else {
			this.bus.dispatch(new CompositeCommand('bulk-fill', cmds));
		}
	}

	eyedrop(x: number, y: number, background = false): void {
		const value = samplePixel(this.doc, this.currentFrame, x, y);
		if (value !== 0) {
			if (background) this.backgroundColorValue = value;
			else this.colorValue = value;
		}
	}

	swapActiveColors(): void {
		[this.colorValue, this.backgroundColorValue] = [this.backgroundColorValue, this.colorValue];
	}

	// B5: flips apply to the floating buffer when a selection is active
	// (a bare marquee lifts first, keeping the one-command guarantee),
	// else to the whole active layer.
	flip(axis: 'horizontal' | 'vertical'): void {
		this.lineEnd();
		this.shapeEnd();
		if (this.selectionMask && !this.floating) this.liftSelection();
		if (this.floating) {
			this.floating.flip(axis);
			this.floatingTwin?.flip(axis); // each half flips in place
			for (const p of this.floatingPeers) {
				p.main.flip(axis);
				p.twin?.flip(axis);
			}
			this.overlayVersion++;
			return;
		}
		const cmds = this.editTargets().map((f) => new FlipLayerCommand(f, this.currentLayer, axis));
		if (!cmds.length) return;
		this.bus.dispatch(cmds.length === 1 ? cmds[0] : new CompositeCommand('bulk-flip', cmds));
	}

	// --- frames ---

	addFrame(duplicate: boolean): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		this.bulkFrames = []; // indices shift; the edit set doesn't survive
		const src = this.frame;
		const layers = duplicate
			? src.layers.map((l) => ({ name: l.name, visible: l.visible, pixels: l.pixels.slice() }))
			: src.layers.map((l) => createLayer(this.doc, l.name));
		const index = this.currentFrame + 1;
		this.bus.dispatch(
			new FrameAddCommand(index, {
				layers,
				...(duplicate && src.durationMs !== undefined && { durationMs: src.durationMs })
			})
		);
		this.currentFrame = index;
		if (duplicate) tips.fire('T03');
		if (this.doc.frames.length === 6) tips.fire('T10');
	}

	deleteFrame(): void {
		if (this.doc.frames.length <= 1) return;
		this.lineEnd();
		this.shapeEnd();
		this.cancelFloating(); // the frame under the selection is going away
		this.bulkFrames = []; // indices shift; the edit set doesn't survive
		this.bus.dispatch(new FrameDeleteCommand(this.doc, this.currentFrame));
	}

	moveFrame(delta: -1 | 1): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const to = this.currentFrame + delta;
		if (to < 0 || to >= this.doc.frames.length) return;
		this.bulkFrames = []; // indices shift; the edit set doesn't survive
		this.bus.dispatch(new FrameReorderCommand(this.currentFrame, to));
		this.currentFrame = to;
	}

	setFps(fps: number): void {
		this.lineEnd();
		this.shapeEnd();
		const next = Math.round(Math.min(24, Math.max(1, fps)));
		if (next !== this.doc.meta.fps) {
			this.bus.dispatch(new FpsCommand(this.doc.meta.fps, next));
			if (next > 12) tips.fire('T09');
		}
	}

	setFrameDuration(ms: number | undefined): void {
		this.lineEnd();
		this.shapeEnd();
		const before = this.frame.durationMs;
		const after = ms === undefined ? undefined : Math.max(20, Math.round(ms));
		if (before !== after) {
			this.bus.dispatch(new FrameDurationCommand(this.currentFrame, before, after));
		}
	}

	currentFrameDurationMs(): number {
		return frameDurationMs(this.doc, this.currentFrame);
	}

	// --- playback range ---

	// inclusive, clamped against the current frame count
	effectiveLoopRange(): { start: number; end: number } {
		const last = this.doc.frames.length - 1;
		const range = this.loopRange;
		if (!range) return { start: 0, end: last };
		const start = Math.max(0, Math.min(range.start, last));
		return { start, end: Math.max(start, Math.min(range.end, last)) };
	}

	setLoopRange(start: number, end: number): void {
		const last = this.doc.frames.length - 1;
		const s = Math.max(0, Math.min(Math.min(start, end), last));
		const e = Math.max(s, Math.min(Math.max(start, end), last));
		this.loopRange = s === 0 && e === last ? null : { start: s, end: e };
	}

	addAnimationTag(tag: AnimationTag): void {
		const name = tag.name.trim();
		if (!name) return;
		const repeats = Math.max(0, Math.min(99, Math.round(tag.repeats || 0)));
		const before = this.doc.meta.tags;
		const after = [...(before ?? []).filter((item) => item.name !== name), { ...tag, name, repeats }];
		this.bus.dispatch(new AnimationTagsCommand(before, after));
		this.selectAnimationTag(name);
	}

	deleteAnimationTag(name: string): void {
		const before = this.doc.meta.tags;
		const after = (before ?? []).filter((tag) => tag.name !== name);
		if (after.length === before?.length) return;
		this.bus.dispatch(new AnimationTagsCommand(before, after));
		if (this.activeAnimationTagName === name) this.selectAnimationTag('');
	}

	selectAnimationTag(name: string): void {
		this.activeAnimationTagName = name;
		if (!name) {
			this.loopRange = null;
			this.loopPlaybackMode = 'forward';
			this.loopRepeatCount = 0;
			return;
		}
		const tag = this.doc.meta.tags?.find((item) => item.name === name);
		if (tag) {
			this.setLoopRange(tag.from, tag.to);
			this.loopPlaybackMode = tag.direction;
			this.loopRepeatCount = tag.repeats;
		}
	}

	// --- layers (per-frame, cap 8) ---

	addLayer(): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const layers = this.frame.layers;
		if (layers.length >= MAX_LAYERS) return;
		const index = this.currentLayer + 1;
		this.bus.dispatch(
			new LayerAddCommand(this.currentFrame, index, createLayer(this.doc, `Layer ${layers.length + 1}`))
		);
		this.currentLayer = index;
		tips.fire('T22'); // merge-down exists once there are two layers
		if (this.doc.frames.length > 1) tips.fire('T23'); // send-to-frame (queues behind T22)
	}

	// Extract the selection onto a new layer above the current one: clear the
	// source pixels + add the layer, as ONE composite command. A bare mask
	// lifts first, so any pending move/rotate lands on the new layer.
	extractSelectionToLayer(): void {
		if (this.bulkFrames.length) return; // layer-structure edits stay single-frame
		if (this.frame.layers.length >= MAX_LAYERS) return;
		if (this.selectionMask && !this.floating) this.liftSelection();
		const sel = this.floating;
		if (!sel) return;
		const twin = this.floatingTwin;
		const { layerPixels, sourceDiff } = twin ? sel.extractPair(twin) : sel.extract();
		if (!sourceDiff) return; // only transparent pixels selected
		this.floating = null;
		this.floatingTwin = null;
		this.overlayVersion++;
		sel.cancel(); // restore the source; the composite re-applies the clear
		const index = this.currentLayer + 1;
		this.bus.dispatch(
			new CompositeCommand('extract-layer', [
				sourceDiff,
				new LayerAddCommand(this.currentFrame, index, {
					name: `Layer ${this.frame.layers.length + 1}`,
					visible: true,
					pixels: layerPixels
				})
			])
		);
		this.currentLayer = index;
	}

	deleteLayer(): void {
		if (this.frame.layers.length <= 1) return;
		this.lineEnd();
		this.shapeEnd();
		this.cancelFloating(); // the layer under the selection is going away
		this.bus.dispatch(new LayerDeleteCommand(this.doc, this.currentFrame, this.currentLayer));
	}

	// Flatten the active layer into the one below it, as ONE composite command.
	mergeLayerDown(): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const cmd = mergeDownCommand(this.doc, this.currentFrame, this.currentLayer);
		if (!cmd) return;
		this.bus.dispatch(cmd);
		this.currentLayer -= 1; // the merged layer stays active
	}

	// Copy (or move) the active layer onto the top of another frame's stack,
	// as ONE composite command.
	sendLayerToFrame(targetFrame: number, move: boolean): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const cmd = sendLayerCommand(this.doc, this.currentFrame, this.currentLayer, targetFrame, move);
		if (!cmd) return;
		this.bus.dispatch(cmd);
	}

	moveLayer(delta: -1 | 1): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const to = this.currentLayer + delta;
		if (to < 0 || to >= this.frame.layers.length) return;
		this.bus.dispatch(new LayerReorderCommand(this.currentFrame, this.currentLayer, to));
		this.currentLayer = to;
	}

	toggleLayerVisible(index: number): void {
		this.lineEnd();
		this.shapeEnd();
		this.bus.dispatch(
			new LayerVisibilityCommand(this.currentFrame, index, !this.frame.layers[index].visible)
		);
	}

	// --- palette ---

	addPaletteColor(hex: string): void {
		this.lineEnd();
		this.shapeEnd();
		if (this.paletteLocked || this.doc.palette.length >= MAX_PALETTE) return;
		this.bus.dispatch(new PaletteAddCommand(hex));
		this.colorValue = this.doc.palette.length;
		if (++this.manualPaletteAdds >= 10) tips.fire('T06');
	}

	swapPaletteColor(index: number, hex: string): void {
		if (this.paletteLocked || this.doc.palette[index] === hex) return;
		this.bus.dispatch(new PaletteSwapCommand(index, this.doc.palette[index], hex));
		tips.fire('T08');
	}

	removePaletteColor(index: number, remapTo?: number): boolean {
		this.lineEnd();
		this.shapeEnd();
		if (this.paletteLocked || this.doc.palette.length <= 1 || index === remapTo) return false;
		this.commitFloating();
		const value = index + 1;
		const inUse = this.doc.frames.some((frame) =>
			frame.layers.some((layer) => layer.pixels.includes(value))
		);
		if (inUse && remapTo === undefined) return false;
		const target = remapTo ?? (index === 0 ? 1 : index - 1);
		const before: [number, number] = [this.colorValue, this.backgroundColorValue];
		const removedValue = index + 1;
		const remapped = target < index ? target + 1 : target;
		const after: [number, number] = [remapped, before[1] === removedValue ? remapped : before[1] > removedValue ? before[1] - 1 : before[1]];
		const command = new PaletteRemoveCommand(this.doc, index, target);
		this.paletteRemovalColors.set(command, { before, after });
		this.bus.dispatch(command);
		return true;
	}

	importPalette(colors: string[]): void {
		if (this.paletteLocked || !colors.length || colors.length > MAX_PALETTE) return;
		this.commitFloating();
		const highestUsed = this.doc.frames.reduce(
			(max, frame) => Math.max(max, ...frame.layers.map((layer) => layer.pixels.reduce((a, b) => Math.max(a, b), 0))),
			0
		);
		if (colors.length < highestUsed) throw new Error(`This artwork uses palette index ${highestUsed}; import at least ${highestUsed} colors.`);
		this.invalidateStamp();
		this.bus.dispatch(new PaletteReplaceCommand(this.doc.palette, colors));
		this.colorValue = Math.min(this.colorValue, colors.length);
		this.backgroundColorValue = Math.min(this.backgroundColorValue, colors.length);
	}

	createPaletteFromArtwork(): void {
		if (this.paletteLocked) return;
		this.commitFloating();
		const compacted = paletteFromArtwork(this.doc);
		if (!compacted) return;
		this.invalidateStamp();
		const foreground = this.colorValue;
		const background = this.backgroundColorValue;
		this.bus.dispatch(new DocumentReplaceCommand(this.doc, compacted.doc));
		this.colorValue = compacted.map.get(foreground) ?? Math.min(foreground, compacted.doc.palette.length);
		this.backgroundColorValue = compacted.map.get(background) ?? Math.min(background, compacted.doc.palette.length);
	}

	generatePaletteRamp(start: number, end: number): void {
		if (this.paletteLocked || start === end || !Number.isInteger(start) || !Number.isInteger(end)) return;
		if (start < 0 || end < 0 || start >= this.doc.palette.length || end >= this.doc.palette.length) return;
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const lo = Math.min(start, end);
		const hi = Math.max(start, end);
		const colors = colorRamp(this.doc.palette[lo], this.doc.palette[hi], hi - lo + 1);
		const cmds = colors
			.map((color, offset) => ({ index: lo + offset, color }))
			.filter(({ index, color }) => this.doc.palette[index] !== color)
			.map(({ index, color }) => new PaletteSwapCommand(index, this.doc.palette[index], color));
		if (cmds.length === 1) this.bus.dispatch(cmds[0]);
		else if (cmds.length) this.bus.dispatch(new CompositeCommand('palette-ramp', cmds));
	}

	sortPalette(start: number, end: number, sort: PaletteSort): void {
		if (this.paletteLocked || start === end || !Number.isInteger(start) || !Number.isInteger(end)) return;
		if (start < 0 || end < 0 || start >= this.doc.palette.length || end >= this.doc.palette.length) return;
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const sorted = sortPaletteRange(this.doc, start, end, sort);
		if (!sorted.moved) return;
		this.bus.dispatch(new PaletteSortCommand(this.doc, sorted.doc, sorted.map));
	}

	replaceColor(from: number, to: number, scope: ReplaceScope): void {
		if (from === to || from < 1 || to < 1 || from > this.doc.palette.length || to > this.doc.palette.length) return;
		if (scope === 'selection' && !this.hasSelection) return;
		this.lineEnd();
		this.shapeEnd();
		const selection = this.floating?.coverageMask() ?? this.selectionMask?.slice() ?? null;
		this.commitFloating();
		const targets: { frame: number; layer: number; mask?: Uint8Array | null }[] = [];
		if (scope === 'selection') {
			if (!selection) return;
			targets.push({ frame: this.currentFrame, layer: this.currentLayer, mask: selection });
		} else if (scope === 'layer') {
			targets.push({ frame: this.currentFrame, layer: this.currentLayer });
		} else {
			const frames = scope === 'frame'
				? [this.currentFrame]
				: scope === 'frames'
					? (this.bulkFrames.length ? this.bulkFrames : [this.currentFrame])
					: this.doc.frames.map((_, index) => index);
			for (const frame of frames) {
				for (let layer = 0; layer < this.doc.frames[frame].layers.length; layer++) targets.push({ frame, layer });
			}
		}
		const cmds = targets
			.map(({ frame, layer, mask }) => replaceColorCommand(this.doc, frame, layer, from, to, mask))
			.filter((cmd): cmd is NonNullable<typeof cmd> => cmd !== null);
		if (cmds.length === 1) this.bus.dispatch(cmds[0]);
		else if (cmds.length) this.bus.dispatch(new CompositeCommand('replace-color-scope', cmds));
	}

	// --- canvas ---

	// Resize the canvas of the existing document (extends §4.1 beyond
	// creation-time). 'crop' keeps the art in place; 'scale' resamples it.
	resizeCanvas(width: number, height: number, mode: 'crop' | 'scale'): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		const w = Math.min(MAX_CANVAS, Math.max(1, Math.round(width)));
		const h = Math.min(MAX_CANVAS, Math.max(1, Math.round(height)));
		if (w === this.doc.meta.width && h === this.doc.meta.height) return;
		this.bus.dispatch(
			new ResizeCanvasCommand(this.doc, this.doc.meta.width, this.doc.meta.height, w, h, mode)
		);
		this.selectionMask = null;
		this.previousSelectionMask = null;
		this.clearGestures();
		this.overlayVersion++;
	}

	// --- history ---

	// T14/B5: undo removes the whole move in one step — a pending selection
	// commits first, so the very next undo reverts it entirely.
	undo(): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		this.bus.undo();
	}

	redo(): void {
		this.lineEnd();
		this.shapeEnd();
		this.commitFloating();
		this.bus.redo();
	}
}
