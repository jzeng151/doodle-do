// Pencil/eraser stroke accumulator (Appendix B2). A drag is ONE command:
// the builder mutates the layer optimistically while recording
// {index → before}, and the PixelDiffCommand is built at pointer-up.
// Pure logic — pointer events are wired by the view layer.

import type { Doc } from '../core/document';
import { PixelDiffCommand, type Rect } from '../core/commands';
import { ditherValue } from './dither';

export class StrokeBuilder {
	private readonly dirty = new Map<number, number>(); // index → value before stroke
	private last: { x: number; y: number } | null = null;
	private origin: { x: number; y: number } | null = null;
	private centers: { x: number; y: number }[] = [];

	constructor(
		private readonly doc: Doc,
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly value: number, // pixel value to place; 0 = eraser
		private readonly size = 1,
		private readonly mirrorX = false, // mirror-draw toggle (§4.1)
		private readonly kind = value === 0 ? 'eraser-stroke' : 'pencil-stroke',
		private readonly pixelPerfect = false,
		private readonly secondaryValue?: number,
		private readonly ditherSize: 0 | 2 | 4 = 0
	) {}

	// Returns the rect touched by this event, for optimistic repaint.
	begin(x: number, y: number): Rect | null {
		this.last = this.origin = { x, y };
		return this.stamp(x, y);
	}

	moveTo(x: number, y: number): Rect | null {
		if (!this.last) return this.begin(x, y);
		const rect = this.line(this.last.x, this.last.y, x, y);
		this.last = { x, y };
		return rect;
	}

	// Replaces the previous preview with one line from the original pointer-down
	// point. The final preview is recorded as the single undoable command.
	previewLineTo(x: number, y: number): Rect | null {
		if (!this.origin) return this.begin(x, y);
		const previous = this.dirtyRect();
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (const [index, value] of this.dirty) pixels[index] = value;
		this.dirty.clear();
		return unionRect(previous, this.line(this.origin.x, this.origin.y, x, y));
	}

	previewPoints(points: { x: number; y: number }[]): Rect | null {
		const previous = this.restorePreview();
		let rect: Rect | null = null;
		for (const point of points) rect = unionRect(rect, this.stamp(point.x, point.y));
		return unionRect(previous, rect);
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
			this.kind,
			this.frameIndex,
			this.layerIndex,
			new Uint32Array(indices),
			new Uint8Array(before),
			new Uint8Array(after),
			width
		);
	}

	cancel(): Rect | null {
		const rect = this.dirtyRect();
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (const [index, value] of this.dirty) pixels[index] = value;
		this.dirty.clear();
		return rect;
	}

	private dirtyRect(): Rect | null {
		if (!this.dirty.size) return null;
		const { width } = this.doc.meta;
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const index of this.dirty.keys()) {
			const x = index % width;
			const y = (index / width) | 0;
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
		return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
	}

	private restorePreview(): Rect | null {
		const previous = this.dirtyRect();
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (const [index, value] of this.dirty) pixels[index] = value;
		this.dirty.clear();
		return previous;
	}

	private stamp(cx: number, cy: number): Rect | null {
		let rect = this.stampOne(cx, cy);
		if (this.mirrorX) rect = unionRect(rect, this.stampOne(this.doc.meta.width - 1 - cx, cy));
		if (!this.pixelPerfect || this.size !== 1) return rect;
		const last = this.centers.at(-1);
		if (last?.x === cx && last.y === cy) return rect;
		this.centers.push({ x: cx, y: cy });
		if (this.centers.length < 3) return rect;
		const [a, b, c] = this.centers.slice(-3);
		if (Math.abs(a.x - c.x) !== 1 || Math.abs(a.y - c.y) !== 1) return rect;
		const endpoints = new Set<number>();
		for (const [index, point] of this.centers.entries()) {
			if (index === this.centers.length - 2) continue;
			endpoints.add(point.y * this.doc.meta.width + point.x);
			if (this.mirrorX) endpoints.add(point.y * this.doc.meta.width + this.doc.meta.width - 1 - point.x);
		}
		if (this.restorePixel(b.x, b.y, endpoints)) rect = unionRect(rect, { x: b.x, y: b.y, w: 1, h: 1 });
		if (this.mirrorX) {
			const mirrorX = this.doc.meta.width - 1 - b.x;
			if (this.restorePixel(mirrorX, b.y, endpoints)) rect = unionRect(rect, { x: mirrorX, y: b.y, w: 1, h: 1 });
		}
		this.centers.splice(-2, 1);
		return rect;
	}

	private restorePixel(x: number, y: number, protectedIndices = new Set<number>()): boolean {
		const { width, height } = this.doc.meta;
		if (x < 0 || y < 0 || x >= width || y >= height) return false;
		const index = y * width + x;
		if (protectedIndices.has(index)) return false;
		const before = this.dirty.get(index);
		if (before === undefined) return false;
		this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels[index] = before;
		return true;
	}

	private stampOne(cx: number, cy: number): Rect | null {
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
				pixels[i] = ditherValue(x, y, this.value, this.secondaryValue, this.ditherSize);
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

export function constrainLineEndpoint(x0: number, y0: number, x1: number, y1: number) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const distance = Math.max(Math.abs(dx), Math.abs(dy));
	if (Math.abs(dx) > Math.abs(dy) * 2) return { x: x1, y: y0 };
	if (Math.abs(dy) > Math.abs(dx) * 2) return { x: x0, y: y1 };
	return { x: x0 + Math.sign(dx) * distance, y: y0 + Math.sign(dy) * distance };
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
