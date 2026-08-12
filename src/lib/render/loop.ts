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
export function nextPlaybackFrame(frame: number, start: number, end: number, mode: PlaybackMode, direction = 1) {
	if (start === end) return { frame: start, direction, wrapped: true };
	if (mode === 'reverse') return frame <= start || frame > end
		? { frame: end, direction: -1, wrapped: frame <= start }
		: { frame: frame - 1, direction: -1, wrapped: false };
	if (mode === 'ping-pong') {
		if (direction > 0 && frame >= end) return { frame: end - 1, direction: -1, wrapped: false };
		if (direction < 0 && frame <= start) return { frame: start + 1, direction: 1, wrapped: true };
		return { frame: frame + direction, direction, wrapped: false };
	}
	return { frame: frame < start || frame >= end ? start : frame + 1, direction: 1, wrapped: frame >= end };
}

export class LoopPlayer {
	private raf = 0;
	private frame = 0;
	private acc = 0;
	private lastTime = 0;
	private direction = 1;
	private cycles = 0;

	constructor(
		private readonly doc: Doc,
		private readonly compositor: Compositor,
		private readonly target: HTMLCanvasElement,
		private readonly onFrame?: (frame: number) => void,
		private readonly range?: () => { start: number; end: number }, // live playback range, inclusive
		private readonly playbackSpeed?: () => number,
		private readonly playbackMode?: () => PlaybackMode,
		private readonly repeatCount?: () => number,
		private readonly onComplete?: () => void
	) {}

	get playing(): boolean {
		return this.raf !== 0;
	}

	get currentFrame(): number {
		return this.frame;
	}

	start(): void {
		this.stop();
		this.cycles = 0;
		this.direction = this.playbackMode?.() === 'reverse' ? -1 : 1;
		this.lastTime = performance.now();
		const tick = (now: number) => {
			const { start, end } = this.range?.() ?? { start: 0, end: this.doc.frames.length - 1 };
			const before = this.frame;
			if (this.frame < start || this.frame > end) this.frame = this.direction < 0 ? end : start;
			this.acc += (now - this.lastTime) * (this.playbackSpeed?.() ?? 1);
			this.lastTime = now;
			let duration = frameDurationMs(this.doc, this.frame);
			while (this.acc >= duration) {
				this.acc -= duration;
				const next = nextPlaybackFrame(this.frame, start, end, this.playbackMode?.() ?? 'forward', this.direction);
				this.frame = next.frame;
				this.direction = next.direction;
				if (next.wrapped) this.cycles++;
				const repeats = Math.max(0, this.repeatCount?.() ?? 0);
				if (repeats && this.cycles >= repeats) {
					this.onFrame?.(this.frame);
					this.blit();
					this.raf = 0;
					this.onComplete?.();
					return;
				}
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
		this.cycles = 0;
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
