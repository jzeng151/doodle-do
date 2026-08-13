// Live loop player (§3.1): blits the compositor's frame cache to a target
// canvas every rAF tick, so any stroke shows up on the very next frame.
// Also drives loop mode's scrubber via seek/onFrame.

import { frameDurationMs, type Doc } from '../core/document';
import type { Compositor } from '../render/compositor';

// advance within an inclusive [start, end] playback range; a frame outside
// the range (range changed, frame deleted) snaps to the start
export function nextLoopFrame(frame: number, start: number, end: number): number {
	return frame < start || frame >= end ? start : frame + 1;
}

export type PlaybackMode = 'forward' | 'reverse' | 'ping-pong';

export class LoopPlayer {
	private raf = 0;
	private frame = 0;
	private acc = 0;
	private lastTime = 0;
	private direction = 1;
	private cycles = 0;
	private config = '';
	private started = false;

	constructor(
		private readonly doc: Doc,
		private readonly compositor: Compositor,
		private readonly target: HTMLCanvasElement,
		private readonly onFrame?: (frame: number) => void,
		private readonly range?: () => { start: number; end: number }, // live playback range, inclusive
		private readonly playbackSpeed?: () => number,
		private readonly playbackMode?: () => PlaybackMode,
		private readonly repeatCount?: () => number,
		private readonly onComplete?: () => void,
		private readonly drawOverlay?: (ctx: CanvasRenderingContext2D, frame: number) => void
	) {}

	get playing(): boolean {
		return this.raf !== 0;
	}

	get currentFrame(): number {
		return this.frame;
	}

	start(): void {
		if (this.raf) return;
		this.syncConfig();
		this.lastTime = performance.now();
		const tick = (now: number) => {
			const { start, end } = this.range?.() ?? { start: 0, end: this.doc.frames.length - 1 };
			this.syncConfig();
			const before = this.frame;
			this.acc += (now - this.lastTime) * (this.playbackSpeed?.() ?? 1);
			this.lastTime = now;
			let duration = frameDurationMs(this.doc, this.frame);
			while (this.acc >= duration) {
				this.acc -= duration;
				if (this.advance(start, end)) return;
				duration = frameDurationMs(this.doc, this.frame);
			}
			if (this.frame !== before) this.onFrame?.(this.frame);
			this.blit();
			this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}

	private syncConfig(): void {
		const { start, end } = this.range?.() ?? { start: 0, end: this.doc.frames.length - 1 };
		const mode = this.playbackMode?.() ?? 'forward';
		const repeats = Math.max(0, this.repeatCount?.() ?? 0);
		const config = `${start}:${end}:${mode}:${repeats}`;
		if (this.started && config === this.config) return;
		this.config = config;
		this.started = true;
		this.cycles = 0;
		this.acc = 0;
		this.direction = mode === 'reverse' ? -1 : 1;
		this.frame = mode === 'reverse' ? end : start;
		this.onFrame?.(this.frame);
		this.blit();
	}

	private configValue(): string {
		const { start, end } = this.range?.() ?? { start: 0, end: this.doc.frames.length - 1 };
		return `${start}:${end}:${this.playbackMode?.() ?? 'forward'}:${Math.max(0, this.repeatCount?.() ?? 0)}`;
	}

	private advance(start: number, end: number): boolean {
		const mode = this.playbackMode?.() ?? 'forward';
		const repeats = Math.max(0, this.repeatCount?.() ?? 0);
		if (this.frame < start || this.frame > end) {
			this.frame = mode === 'reverse' ? end : start;
			this.direction = mode === 'reverse' ? -1 : 1;
			return false;
		}
		let completed = false;
		if (start === end) completed = true;
		else if (mode === 'reverse') {
			if (this.frame <= start) completed = true;
			else this.frame--;
		} else if (mode === 'ping-pong') {
			if (this.direction > 0 && this.frame >= end) {
				this.direction = -1;
				this.frame--;
			} else if (this.direction < 0 && this.frame <= start) completed = true;
			else this.frame += this.direction;
		} else if (this.frame >= end) completed = true;
		else this.frame++;
		if (!completed) return false;
		this.cycles++;
		if (repeats && this.cycles >= repeats) {
			this.onFrame?.(this.frame);
			this.blit();
			this.raf = 0;
			this.started = false;
			this.onComplete?.();
			return true;
		}
		this.frame = mode === 'reverse' ? end : start;
		this.direction = mode === 'reverse' ? -1 : 1;
		return false;
	}

	stop(): void {
		if (this.raf) cancelAnimationFrame(this.raf);
		this.raf = 0;
	}

	seek(frame: number): void {
		this.frame = Math.max(0, Math.min(this.doc.frames.length - 1, frame));
		this.acc = 0;
		this.cycles = 0;
		this.config = this.configValue();
		this.started = true;
		this.onFrame?.(this.frame);
		this.blit();
	}

	blit(): void {
		if (this.frame >= this.doc.frames.length) this.frame = 0; // frame was deleted
		const ctx = this.target.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, this.target.width, this.target.height);
		ctx.drawImage(
			this.compositor.frameCanvas(this.frame),
			0,
			0,
			this.target.width,
			this.target.height
		);
		this.drawOverlay?.(ctx, this.frame);
	}
}
