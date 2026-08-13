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

export class LoopPlayer {
	private raf = 0;
	private frame = 0;
	private acc = 0;
	private lastTime = 0;

	constructor(
		private readonly doc: Doc,
		private readonly compositor: Compositor,
		private readonly target: HTMLCanvasElement,
		private readonly onFrame?: (frame: number) => void,
		private readonly range?: () => { start: number; end: number }, // live playback range, inclusive
		private readonly playbackSpeed?: () => number,
		private readonly drawFrame?: (ctx: CanvasRenderingContext2D, frame: number) => boolean
	) {}

	get playing(): boolean {
		return this.raf !== 0;
	}

	get currentFrame(): number {
		return this.frame;
	}

	start(): void {
		this.stop();
		this.lastTime = performance.now();
		const tick = (now: number) => {
			const { start, end } = this.range?.() ?? { start: 0, end: this.doc.frames.length - 1 };
			const before = this.frame;
			if (this.frame < start || this.frame > end) this.frame = start; // range changed / frame deleted
			this.acc += (now - this.lastTime) * (this.playbackSpeed?.() ?? 1);
			this.lastTime = now;
			let duration = frameDurationMs(this.doc, this.frame);
			while (this.acc >= duration) {
				this.acc -= duration;
				this.frame = nextLoopFrame(this.frame, start, end);
				duration = frameDurationMs(this.doc, this.frame);
			}
			if (this.frame !== before) this.onFrame?.(this.frame);
			this.blit();
			this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}

	stop(): void {
		if (this.raf) cancelAnimationFrame(this.raf);
		this.raf = 0;
	}

	seek(frame: number): void {
		this.frame = Math.max(0, Math.min(this.doc.frames.length - 1, frame));
		this.acc = 0;
		this.onFrame?.(this.frame);
		this.blit();
	}

	blit(): void {
		if (this.frame >= this.doc.frames.length) this.frame = 0; // frame was deleted
		const ctx = this.target.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, this.target.width, this.target.height);
		if (!this.drawFrame?.(ctx, this.frame)) {
			ctx.drawImage(this.compositor.frameCanvas(this.frame), 0, 0, this.target.width, this.target.height);
		}
	}
}
