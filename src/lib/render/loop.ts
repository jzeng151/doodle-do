// Live loop player (§3.1): blits the compositor's frame cache to a target
// canvas every rAF tick, so any stroke shows up on the very next frame.

import { frameDurationMs, type Doc } from '../core/document';
import type { Compositor } from './compositor';

export class LoopPlayer {
	private raf = 0;
	private frame = 0;
	private acc = 0;
	private lastTime = 0;

	constructor(
		private readonly doc: Doc,
		private readonly compositor: Compositor,
		private readonly target: HTMLCanvasElement
	) {}

	start(): void {
		this.stop();
		this.lastTime = performance.now();
		const tick = (now: number) => {
			if (this.frame >= this.doc.frames.length) this.frame = 0; // frame was deleted
			this.acc += now - this.lastTime;
			this.lastTime = now;
			let duration = frameDurationMs(this.doc, this.frame);
			while (this.acc >= duration) {
				this.acc -= duration;
				this.frame = (this.frame + 1) % this.doc.frames.length;
				duration = frameDurationMs(this.doc, this.frame);
			}
			this.blit();
			this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}

	stop(): void {
		if (this.raf) cancelAnimationFrame(this.raf);
		this.raf = 0;
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
