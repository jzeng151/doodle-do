// Editor session: one document + its command bus + compositor, plus the
// view state that is deliberately NOT undoable (Appendix B7). `version`
// bumps on every committed change so Svelte views can react to document
// mutations that live outside its reactivity (Uint8Arrays).

import { createDoc, createLayer, frameDurationMs, MAX_CANVAS, MAX_LAYERS, MAX_PALETTE, type Doc } from '../core/document';
import { CommandBus, type Rect } from '../core/commands';
import {
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
	PaletteSwapCommand,
	ResizeCanvasCommand
} from '../core/structural';
import { Compositor } from '../render/compositor';
import { floodFill } from '../tools/fill';
import { samplePixel } from '../tools/sample';
import { FlipLayerCommand } from '../tools/flip';
import { StrokeBuilder } from '../tools/pencil';
import { FloatingSelection, clampRect } from '../tools/selection';
import { DEFAULT_PALETTE } from '../core/palette';
import { tips } from '../learn/tips';

export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'select';
export type Mode = 'focus' | 'grid' | 'loop';

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
	mirrorX = $state(false);
	colorValue = $state(1);
	zoom = $state(12);
	gridZoom: number; // grid-mode tile scale; separate so focus zoom persists across toggles (§4.4)
	showGrid = $state(false);
	paletteLocked = $state(false);
	onionEnabled = $state(true); // on by default (§4.5)
	onionOpacity = $state(0.35);
	autosavedAt = $state<Date | null>(null);

	// selection (B5): marquee and floating buffer are view state until
	// commit, when the whole move becomes one command
	marquee = $state<Rect | null>(null);
	floating = $state<FloatingSelection | null>(null);
	overlayVersion = $state(0); // bumps on marquee/floating changes only

	// for the T15 save-to-disk reminder
	savedToDiskAt = $state<Date | null>(null);
	readonly startedAt = Date.now();
	unsavedCommits = $state(0);

	private stroke: StrokeBuilder | null = null;
	private manualPaletteAdds = 0;

	constructor(doc: Doc) {
		this.doc = doc;
		this.bus = new CommandBus(doc);
		this.compositor = new Compositor(doc);
		this.gridZoom = $state(Math.max(2, Math.floor(96 / Math.max(doc.meta.width, doc.meta.height))));
		this.bus.onChange((region) => {
			this.compositor.invalidate(region);
			this.currentFrame = Math.min(this.currentFrame, doc.frames.length - 1);
			this.currentLayer = Math.min(
				this.currentLayer,
				doc.frames[this.currentFrame].layers.length - 1
			);
			this.colorValue = Math.min(this.colorValue, doc.palette.length);
			this.version++;
		});
		this.bus.onCommit(() => this.unsavedCommits++);
	}

	get frame() {
		return this.doc.frames[this.currentFrame];
	}

	// --- view transitions that must resolve a pending selection first (B5) ---

	setTool(tool: Tool): void {
		if (tool === this.tool) return;
		this.commitFloating();
		this.marquee = null;
		this.overlayVersion++;
		this.tool = tool;
	}

	// Modes are pure views over this one session (§4.4): switching preserves
	// document, current frame, zoom, and palette because nothing is rebuilt.
	setMode(mode: Mode): void {
		if (mode === this.mode) return;
		this.commitFloating(); // B5: mode switch commits a pending selection
		this.marquee = null;
		this.overlayVersion++;
		if (mode !== 'focus' && this.tool === 'select') this.tool = 'pencil'; // selection is focus-only
		this.mode = mode;
	}

	selectFrame(index: number): void {
		this.commitFloating(); // B5: frame change commits
		this.currentFrame = index;
		if (index === 1) tips.fire('T02');
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

	beginMarquee(x: number, y: number): void {
		this.commitFloating();
		this.marquee = { x, y, w: 1, h: 1 };
		this.marqueeAnchor = { x, y };
		this.overlayVersion++;
	}

	private marqueeAnchor = { x: 0, y: 0 };

	updateMarquee(x: number, y: number): void {
		if (!this.marquee) return;
		const a = this.marqueeAnchor;
		this.marquee = {
			x: Math.min(a.x, x),
			y: Math.min(a.y, y),
			w: Math.abs(x - a.x) + 1,
			h: Math.abs(y - a.y) + 1
		};
		this.overlayVersion++;
	}

	endMarquee(): void {
		if (!this.marquee) return;
		this.marquee = clampRect(this.marquee, this.doc.meta.width, this.doc.meta.height);
		this.overlayVersion++;
	}

	// Starting a move lifts the marquee into a floating buffer — the source
	// pixels clear and a pending command begins.
	liftSelection(): void {
		if (this.floating || !this.marquee) return;
		this.floating = new FloatingSelection(
			this.doc,
			this.currentFrame,
			this.currentLayer,
			this.marquee
		);
		this.marquee = null;
		this.overlayVersion++;
		this.bus.emitChange({ frame: this.currentFrame, rect: this.floating.rect });
	}

	moveFloatingBy(dx: number, dy: number): void {
		if (!this.floating || (dx === 0 && dy === 0)) return;
		this.floating.moveBy(dx, dy);
		this.overlayVersion++;
		tips.fire('T14');
	}

	commitFloating(): void {
		if (!this.floating) return;
		const sel = this.floating;
		this.floating = null;
		this.marquee = null;
		this.overlayVersion++;
		const cmd = sel.commit();
		if (cmd) this.bus.dispatch(cmd, { applied: true });
		else this.bus.emitChange({ frame: sel.frameIndex, rect: null });
	}

	cancelFloating(): void {
		if (this.floating) {
			const sel = this.floating;
			this.floating = null;
			sel.cancel();
			this.bus.emitChange({ frame: sel.frameIndex, rect: null });
		}
		this.marquee = null;
		this.overlayVersion++;
	}

	// --- strokes (B2: one command per drag, finalized on pointer-up) ---

	strokeBegin(x: number, y: number): void {
		if (this.floating) return; // B5: drawing disabled while floating
		const value = this.tool === 'eraser' ? 0 : this.colorValue;
		this.stroke = new StrokeBuilder(
			this.doc,
			this.currentFrame,
			this.currentLayer,
			value,
			this.brushSize,
			this.mirrorX
		);
		const rect = this.stroke.begin(x, y);
		if (rect) this.bus.emitChange({ frame: this.currentFrame, rect });
	}

	strokeMove(x: number, y: number): void {
		if (!this.stroke) return;
		const rect = this.stroke.moveTo(x, y);
		if (rect) this.bus.emitChange({ frame: this.currentFrame, rect });
	}

	strokeEnd(): void {
		if (!this.stroke) return;
		const cmd = this.stroke.end();
		this.stroke = null;
		if (cmd) this.bus.dispatch(cmd, { applied: true });
	}

	get strokeActive(): boolean {
		return this.stroke !== null;
	}

	// --- other tools ---

	fill(x: number, y: number): void {
		if (this.floating) return; // B5: drawing disabled while floating
		const cmd = floodFill(this.doc, this.currentFrame, this.currentLayer, x, y, this.colorValue);
		if (cmd) {
			this.bus.dispatch(cmd);
			if (cmd.pixelCount < 4) tips.fire('T05');
		}
	}

	eyedrop(x: number, y: number): void {
		const value = samplePixel(this.doc, this.currentFrame, x, y);
		if (value !== 0) this.colorValue = value;
	}

	// B5: flips apply to the floating buffer when a selection is active
	// (a bare marquee lifts first, keeping the one-command guarantee),
	// else to the whole active layer.
	flip(axis: 'horizontal' | 'vertical'): void {
		if (this.marquee && !this.floating) this.liftSelection();
		if (this.floating) {
			this.floating.flip(axis);
			this.overlayVersion++;
			return;
		}
		this.bus.dispatch(new FlipLayerCommand(this.currentFrame, this.currentLayer, axis));
	}

	// --- frames ---

	addFrame(duplicate: boolean): void {
		this.commitFloating();
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
		this.cancelFloating(); // the frame under the selection is going away
		this.bus.dispatch(new FrameDeleteCommand(this.doc, this.currentFrame));
	}

	moveFrame(delta: -1 | 1): void {
		this.commitFloating();
		const to = this.currentFrame + delta;
		if (to < 0 || to >= this.doc.frames.length) return;
		this.bus.dispatch(new FrameReorderCommand(this.currentFrame, to));
		this.currentFrame = to;
	}

	setFps(fps: number): void {
		const next = Math.round(Math.min(24, Math.max(1, fps)));
		if (next !== this.doc.meta.fps) {
			this.bus.dispatch(new FpsCommand(this.doc.meta.fps, next));
			if (next > 12) tips.fire('T09');
		}
	}

	setFrameDuration(ms: number | undefined): void {
		const before = this.frame.durationMs;
		const after = ms === undefined ? undefined : Math.max(20, Math.round(ms));
		if (before !== after) {
			this.bus.dispatch(new FrameDurationCommand(this.currentFrame, before, after));
		}
	}

	currentFrameDurationMs(): number {
		return frameDurationMs(this.doc, this.currentFrame);
	}

	// --- layers (per-frame, cap 8) ---

	addLayer(): void {
		this.commitFloating();
		const layers = this.frame.layers;
		if (layers.length >= MAX_LAYERS) return;
		const index = this.currentLayer + 1;
		this.bus.dispatch(
			new LayerAddCommand(this.currentFrame, index, createLayer(this.doc, `Layer ${layers.length + 1}`))
		);
		this.currentLayer = index;
	}

	deleteLayer(): void {
		if (this.frame.layers.length <= 1) return;
		this.cancelFloating(); // the layer under the selection is going away
		this.bus.dispatch(new LayerDeleteCommand(this.doc, this.currentFrame, this.currentLayer));
	}

	moveLayer(delta: -1 | 1): void {
		this.commitFloating();
		const to = this.currentLayer + delta;
		if (to < 0 || to >= this.frame.layers.length) return;
		this.bus.dispatch(new LayerReorderCommand(this.currentFrame, this.currentLayer, to));
		this.currentLayer = to;
	}

	toggleLayerVisible(index: number): void {
		this.bus.dispatch(
			new LayerVisibilityCommand(this.currentFrame, index, !this.frame.layers[index].visible)
		);
	}

	// --- palette ---

	addPaletteColor(hex: string): void {
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

	removePaletteColor(index: number, remapTo: number): void {
		if (this.paletteLocked || this.doc.palette.length <= 1 || index === remapTo) return;
		this.bus.dispatch(new PaletteRemoveCommand(this.doc, index, remapTo));
	}

	// --- canvas ---

	// Resize the canvas of the existing document (extends §4.1 beyond
	// creation-time). 'crop' keeps the art in place; 'scale' resamples it.
	resizeCanvas(width: number, height: number, mode: 'crop' | 'scale'): void {
		this.commitFloating();
		const w = Math.min(MAX_CANVAS, Math.max(1, Math.round(width)));
		const h = Math.min(MAX_CANVAS, Math.max(1, Math.round(height)));
		if (w === this.doc.meta.width && h === this.doc.meta.height) return;
		this.bus.dispatch(
			new ResizeCanvasCommand(this.doc, this.doc.meta.width, this.doc.meta.height, w, h, mode)
		);
		this.marquee = null;
		this.overlayVersion++;
	}

	// --- history ---

	// T14/B5: undo removes the whole move in one step — a pending selection
	// commits first, so the very next undo reverts it entirely.
	undo(): void {
		this.strokeEnd();
		this.commitFloating();
		this.bus.undo();
	}

	redo(): void {
		this.strokeEnd();
		this.commitFloating();
		this.bus.redo();
	}
}
