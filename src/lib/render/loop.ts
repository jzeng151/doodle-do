// Live loop player (§3.1): blits the compositor's frame cache to a target
// canvas every rAF tick, so any stroke shows up on the very next frame.
// Also drives loop mode's scrubber via seek/onFrame.

import { frameDurationMs, type Doc } from '../core/document';
import type { Compositor } from '../render/compositor';

export class LoopPlayer {
	private raf = 0;
	private frame = 0;
	private acc = 0;
	private lastTime = 0;

	constructor(
		private readonly doc: Doc,
		private readonly compositor: Compositor,
		private readonly target: HTMLCanvasElement,
		private readonly onFrame?: (frame: number) => void
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
			if (this.frame >= this.doc.frames.length) this.frame = 0; // frame was deleted
			this.acc += now - this.lastTime;
			this.lastTime = now;
			const before = this.frame;
			let duration = frameDurationMs(this.doc, this.frame);
			while (this.acc >= duration) {
				this.acc -= duration;
				this.frame = (this.frame + 1) % this.doc.frames.length;
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
		ctx.drawImage(
			this.compositor.frameCanvas(this.frame),
			0,
			0,
			this.target.width,
			this.target.height
		);
	}
}
