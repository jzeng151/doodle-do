// Selection model (Appendix B5, "simplest correct version"). A rectangular
// marquee selects pixels on the ACTIVE layer only. Starting a move lifts
// the pixels into a floating buffer (source cleared) — a pending command.
// While floating the buffer moves and flips; commit stamps it down and the
// whole lift+transform+stamp collapses into ONE command. Escape restores.
//
// Implementation: snapshot the layer at lift, mutate optimistically, and
// diff the whole layer at commit. Bounded by canvas size (≤16KB), so the
// single-command guarantee costs nothing.

import type { Doc } from '../core/document';
import { PixelDiffCommand, type Rect } from '../core/commands';

export function clampRect(rect: Rect, width: number, height: number): Rect | null {
	const x = Math.max(0, rect.x);
	const y = Math.max(0, rect.y);
	const w = Math.min(width, rect.x + rect.w) - x;
	const h = Math.min(height, rect.y + rect.h) - y;
	return w > 0 && h > 0 ? { x, y, w, h } : null;
}

export class FloatingSelection {
	// buffer position may go out of bounds while dragging; stamp clips
	x: number;
	y: number;
	readonly w: number;
	readonly h: number;
	readonly buffer: Uint8Array;
	private readonly snapshot: Uint8Array;
	private contentVersion = 0; // bumped on flip, for render caching

	constructor(
		private readonly doc: Doc,
		readonly frameIndex: number,
		readonly layerIndex: number,
		rect: Rect
	) {
		const { width, height } = doc.meta;
		const clamped = clampRect(rect, width, height);
		if (!clamped) throw new Error('selection is outside the canvas');
		this.x = clamped.x;
		this.y = clamped.y;
		this.w = clamped.w;
		this.h = clamped.h;

		const pixels = doc.frames[frameIndex].layers[layerIndex].pixels;
		this.snapshot = pixels.slice();
		this.buffer = new Uint8Array(this.w * this.h);
		// lift: copy into the buffer, clear the source
		for (let dy = 0; dy < this.h; dy++) {
			for (let dx = 0; dx < this.w; dx++) {
				const src = (this.y + dy) * width + (this.x + dx);
				this.buffer[dy * this.w + dx] = pixels[src];
				pixels[src] = 0;
			}
		}
	}

	get rect(): Rect {
		return { x: this.x, y: this.y, w: this.w, h: this.h };
	}

	get version(): number {
		return this.contentVersion;
	}

	moveBy(dx: number, dy: number): void {
		this.x += dx;
		this.y += dy;
	}

	contains(px: number, py: number): boolean {
		return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h;
	}

	flip(axis: 'horizontal' | 'vertical'): void {
		const { w, h, buffer } = this;
		if (axis === 'horizontal') {
			for (let y = 0; y < h; y++) {
				const row = y * w;
				for (let x = 0; x < w >> 1; x++) {
					const t = buffer[row + x];
					buffer[row + x] = buffer[row + w - 1 - x];
					buffer[row + w - 1 - x] = t;
				}
			}
		} else {
			for (let y = 0; y < h >> 1; y++) {
				for (let x = 0; x < w; x++) {
					const a = y * w + x;
					const b = (h - 1 - y) * w + x;
					const t = buffer[a];
					buffer[a] = buffer[b];
					buffer[b] = t;
				}
			}
		}
		this.contentVersion++;
	}

	// Stamps the buffer and returns the whole move as ONE command (already
	// applied to the document). Null when the net result is a no-op.
	commit(): PixelDiffCommand | null {
		const { width, height } = this.doc.meta;
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (let dy = 0; dy < this.h; dy++) {
			const ty = this.y + dy;
			if (ty < 0 || ty >= height) continue;
			for (let dx = 0; dx < this.w; dx++) {
				const tx = this.x + dx;
				if (tx < 0 || tx >= width) continue;
				const v = this.buffer[dy * this.w + dx];
				if (v !== 0) pixels[ty * width + tx] = v; // transparent doesn't punch holes
			}
		}

		const indices: number[] = [];
		const before: number[] = [];
		const after: number[] = [];
		for (let i = 0; i < pixels.length; i++) {
			if (pixels[i] !== this.snapshot[i]) {
				indices.push(i);
				before.push(this.snapshot[i]);
				after.push(pixels[i]);
			}
		}
		if (indices.length === 0) return null;
		return new PixelDiffCommand(
			'selection-move',
			this.frameIndex,
			this.layerIndex,
			new Uint32Array(indices),
			new Uint8Array(before),
			new Uint8Array(after),
			width
		);
	}

	// Escape: restore the layer exactly as it was before the lift.
	cancel(): void {
		this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels.set(this.snapshot);
	}
}
