// Pencil/eraser stroke accumulator (Appendix B2). A drag is ONE command:
// the builder mutates the layer optimistically while recording
// {index → before}, and the PixelDiffCommand is built at pointer-up.
// Pure logic — pointer events are wired by the view layer.

import type { Doc } from '../core/document';
import { PixelDiffCommand, type Rect } from '../core/commands';

export class StrokeBuilder {
	private readonly dirty = new Map<number, number>(); // index → value before stroke
	private last: { x: number; y: number } | null = null;

	constructor(
		private readonly doc: Doc,
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly value: number, // pixel value to place; 0 = eraser
		private readonly size = 1
	) {}

	// Returns the rect touched by this event, for optimistic repaint.
	begin(x: number, y: number): Rect | null {
		this.last = { x, y };
		return this.stamp(x, y);
	}

	moveTo(x: number, y: number): Rect | null {
		if (!this.last) return this.begin(x, y);
		const rect = this.line(this.last.x, this.last.y, x, y);
		this.last = { x, y };
		return rect;
	}

	end(): PixelDiffCommand | null {
		const { width } = this.doc.meta;
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		const indices: number[] = [];
		const before: number[] = [];
		const after: number[] = [];
		for (const [index, prev] of this.dirty) {
			if (pixels[index] === prev) continue; // no-op pixels don't enter the command
			indices.push(index);
			before.push(prev);
			after.push(pixels[index]);
		}
		if (indices.length === 0) return null;
		return new PixelDiffCommand(
			this.value === 0 ? 'eraser-stroke' : 'pencil-stroke',
			this.frameIndex,
			this.layerIndex,
			new Uint32Array(indices),
			new Uint8Array(before),
			new Uint8Array(after),
			width
		);
	}

	private stamp(cx: number, cy: number): Rect | null {
		const { width, height } = this.doc.meta;
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		const r = this.size >> 1;
		const x0 = Math.max(0, cx - r);
		const y0 = Math.max(0, cy - r);
		const x1 = Math.min(width - 1, cx - r + this.size - 1);
		const y1 = Math.min(height - 1, cy - r + this.size - 1);
		if (x1 < x0 || y1 < y0) return null;
		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				const i = y * width + x;
				if (!this.dirty.has(i)) this.dirty.set(i, pixels[i]);
				pixels[i] = this.value;
			}
		}
		return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
	}

	private line(x0: number, y0: number, x1: number, y1: number): Rect | null {
		// Bresenham; stamps the brush at every cell so fast drags leave no gaps.
		let rect: Rect | null = null;
		const dx = Math.abs(x1 - x0);
		const dy = -Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx + dy;
		let x = x0;
		let y = y0;
		for (;;) {
			rect = unionRect(rect, this.stamp(x, y));
			if (x === x1 && y === y1) break;
			const e2 = 2 * err;
			if (e2 >= dy) {
				err += dy;
				x += sx;
			}
			if (e2 <= dx) {
				err += dx;
				y += sy;
			}
		}
		return rect;
	}
}

export function unionRect(a: Rect | null, b: Rect | null): Rect | null {
	if (!a) return b;
	if (!b) return a;
	const x = Math.min(a.x, b.x);
	const y = Math.min(a.y, b.y);
	return {
		x,
		y,
		w: Math.max(a.x + a.w, b.x + b.w) - x,
		h: Math.max(a.y + a.h, b.y + b.h) - y
	};
}
