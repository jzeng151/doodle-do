// Editor session: one document + its command bus + compositor, plus the
// view state that is deliberately NOT undoable (Appendix B7). `version`
// bumps on every committed change so Svelte views can react to document
// mutations that live outside its reactivity (Uint8Arrays).

import { createDoc, createLayer, frameDurationMs, MAX_LAYERS, MAX_PALETTE, type Doc } from '../core/document';
import { CommandBus } from '../core/commands';
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
	PaletteSwapCommand
} from '../core/structural';
import { Compositor } from '../render/compositor';
import { floodFill } from '../tools/fill';
import { samplePixel } from '../tools/sample';
import { FlipLayerCommand } from '../tools/flip';
import { StrokeBuilder } from '../tools/pencil';
import { DEFAULT_PALETTE } from '../core/palette';

export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';

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
	tool = $state<Tool>('pencil');
	brushSize = $state(1);
	mirrorX = $state(false);
	colorValue = $state(1);
	zoom = $state(12);
	showGrid = $state(false);
	paletteLocked = $state(false);
	onionEnabled = $state(true); // on by default (§4.5)
	onionOpacity = $state(0.35);
	autosavedAt = $state<Date | null>(null);

	private stroke: StrokeBuilder | null = null;

	constructor(doc: Doc) {
		this.doc = doc;
		this.bus = new CommandBus(doc);
		this.compositor = new Compositor(doc);
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
	}

	get frame() {
		return this.doc.frames[this.currentFrame];
	}

	// --- strokes (B2: one command per drag, finalized on pointer-up) ---

	strokeBegin(x: number, y: number): void {
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
		const cmd = floodFill(this.doc, this.currentFrame, this.currentLayer, x, y, this.colorValue);
		if (cmd) this.bus.dispatch(cmd);
	}

	eyedrop(x: number, y: number): void {
		const value = samplePixel(this.doc, this.currentFrame, x, y);
		if (value !== 0) this.colorValue = value;
	}

	flip(axis: 'horizontal' | 'vertical'): void {
		this.bus.dispatch(new FlipLayerCommand(this.currentFrame, this.currentLayer, axis));
	}

	// --- frames ---

	addFrame(duplicate: boolean): void {
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
	}

	deleteFrame(): void {
		if (this.doc.frames.length <= 1) return;
		this.bus.dispatch(new FrameDeleteCommand(this.doc, this.currentFrame));
	}

	moveFrame(delta: -1 | 1): void {
		const to = this.currentFrame + delta;
		if (to < 0 || to >= this.doc.frames.length) return;
		this.bus.dispatch(new FrameReorderCommand(this.currentFrame, to));
		this.currentFrame = to;
	}

	setFps(fps: number): void {
		const next = Math.round(Math.min(24, Math.max(1, fps)));
		if (next !== this.doc.meta.fps) this.bus.dispatch(new FpsCommand(this.doc.meta.fps, next));
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
		this.bus.dispatch(new LayerDeleteCommand(this.doc, this.currentFrame, this.currentLayer));
	}

	moveLayer(delta: -1 | 1): void {
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
	}

	swapPaletteColor(index: number, hex: string): void {
		if (this.paletteLocked || this.doc.palette[index] === hex) return;
		this.bus.dispatch(new PaletteSwapCommand(index, this.doc.palette[index], hex));
	}

	removePaletteColor(index: number, remapTo: number): void {
		if (this.paletteLocked || this.doc.palette.length <= 1 || index === remapTo) return;
		this.bus.dispatch(new PaletteRemoveCommand(this.doc, index, remapTo));
	}

	// --- history ---

	undo(): void {
		this.strokeEnd();
		this.bus.undo();
	}

	redo(): void {
		this.strokeEnd();
		this.bus.redo();
	}
}
