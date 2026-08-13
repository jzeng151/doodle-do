// Selection model (Appendix B5 + multi-select/rotate/precision extension).
// A selection is a canvas-sized coverage mask on the ACTIVE layer, produced
// by any gesture (rect marquee, lasso, wand, polygon; shift adds). Starting
// a move lifts the masked pixels into a floating buffer (source cleared)
// — a pending command. While floating the group moves, flips, and rotates
// (free angle, about the group bbox center); commit stamps it down and the
// whole lift+transform+stamp collapses into ONE command. Escape restores.
//
// Implementation: snapshot the layer at lift, mutate optimistically, and
// diff the whole layer at commit. Bounded by canvas size (≤16KB), so the
// single-command guarantee costs nothing. The lifted pixels are kept
// pristine; every transform change re-rasterizes from them (nearest
// neighbor), so repeated rotation never compounds resampling loss and
// angle 0 degenerates to an exact copy.

import type { Doc } from '../core/document';
import { PixelDiffCommand, type Rect } from '../core/commands';

export type SelectionMode = 'replace' | 'add' | 'subtract' | 'intersect';

export function combineMasks(
	current: Uint8Array | null,
	next: Uint8Array,
	mode: SelectionMode
): Uint8Array | null {
	const result = new Uint8Array(next.length);
	for (let i = 0; i < result.length; i++) {
		const a = current?.[i] === 1;
		const b = next[i] === 1;
		result[i] = Number(
			mode === 'replace' ? b : mode === 'add' ? a || b : mode === 'subtract' ? a && !b : a && b
		);
	}
	return result.some(Boolean) ? result : null;
}

export function clampRect(rect: Rect, width: number, height: number): Rect | null {
	const x = Math.max(0, rect.x);
	const y = Math.max(0, rect.y);
	const w = Math.min(width, rect.x + rect.w) - x;
	const h = Math.min(height, rect.y + rect.h) - y;
	return w > 0 && h > 0 ? { x, y, w, h } : null;
}

export function maskFromRects(rects: Rect[], width: number, height: number): Uint8Array {
	const mask = new Uint8Array(width * height);
	for (const r of rects) {
		const c = clampRect(r, width, height);
		if (!c) continue;
		for (let y = 0; y < c.h; y++) {
			for (let x = 0; x < c.w; x++) mask[(c.y + y) * width + (c.x + x)] = 1;
		}
	}
	return mask;
}

// Even-odd scanline fill sampled at pixel centers, plus the outline path
// itself so thin lasso strokes still select. Points are float pixel coords;
// the polygon closes automatically.
export function maskFromPolygon(
	points: { x: number; y: number }[],
	width: number,
	height: number
): Uint8Array {
	const mask = new Uint8Array(width * height);
	for (let y = 0; y < height; y++) {
		const cy = y + 0.5;
		const xs: number[] = [];
		for (let i = 0; i < points.length; i++) {
			const a = points[i];
			const b = points[(i + 1) % points.length];
			if (a.y <= cy !== b.y <= cy) xs.push(a.x + ((cy - a.y) * (b.x - a.x)) / (b.y - a.y));
		}
		xs.sort((p, q) => p - q);
		for (let k = 0; k + 1 < xs.length; k += 2) {
			const x0 = Math.max(0, Math.ceil(xs[k] - 0.5));
			const x1 = Math.min(width - 1, Math.ceil(xs[k + 1] - 0.5) - 1);
			for (let x = x0; x <= x1; x++) mask[y * width + x] = 1;
		}
	}
	for (let i = 0; i < points.length; i++) {
		const a = points[i];
		const b = points[(i + 1) % points.length];
		const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
		for (let s = 0; s <= steps; s++) {
			const x = Math.floor(a.x + ((b.x - a.x) * s) / steps);
			const y = Math.floor(a.y + ((b.y - a.y) * s) / steps);
			if (x >= 0 && x < width && y >= 0 && y < height) mask[y * width + x] = 1;
		}
	}
	return mask;
}

// the mask reflected across the canvas X centerline (pixel x -> width-1-x),
// for mirror-twin selections
export function mirrorMaskX(mask: Uint8Array, width: number, height: number): Uint8Array {
	const mirrored = new Uint8Array(width * height);
	for (let y = 0; y < height; y++) {
		const row = y * width;
		for (let x = 0; x < width; x++) {
			if (mask[row + x]) mirrored[row + (width - 1 - x)] = 1;
		}
	}
	return mirrored;
}

export class FloatingSelection {
	readonly bbox: Rect; // mask extents, source space
	dx = 0; // integer translation, applied after rotation
	dy = 0;
	angle = 0; // radians, about the bbox center
	// render output may go out of bounds while dragging; stamp clips
	renderRect: Rect;
	buffer: Uint8Array; // what the overlay draws and commit stamps
	private readonly pristine: Uint8Array; // bbox-sized union lift, never resampled
	private readonly coverage: Uint8Array;
	private readonly snapshot: Uint8Array;
	private contentVersion = 0; // bumped on every re-rasterize, for render caching

	constructor(
		private readonly doc: Doc,
		readonly frameIndex: number,
		readonly layerIndex: number,
		mask: Uint8Array // canvas-sized coverage, 1 = selected
	) {
		const { width, height } = doc.meta;
		let minX = width,
			minY = height,
			maxX = -1,
			maxY = -1;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (!mask[y * width + x]) continue;
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
		if (maxX < 0) throw new Error('selection is empty');
		this.bbox = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };

		const pixels = doc.frames[frameIndex].layers[layerIndex].pixels;
		this.snapshot = pixels.slice();

		// lift exactly the masked pixels; unmasked bbox cells stay 0 =
		// transparent, so they neither move pixels nor punch holes on stamp
		const { x: bx, y: by, w: bw, h: bh } = this.bbox;
		this.pristine = new Uint8Array(bw * bh);
		this.coverage = new Uint8Array(bw * bh);
		for (let y = 0; y < bh; y++) {
			for (let x = 0; x < bw; x++) {
				const src = (by + y) * width + (bx + x);
				if (!mask[src]) continue;
				this.coverage[y * bw + x] = 1;
				this.pristine[y * bw + x] = pixels[src];
				pixels[src] = 0;
			}
		}

		this.renderRect = { ...this.bbox };
		this.buffer = this.pristine.slice();
	}

	get rect(): Rect {
		return { ...this.renderRect };
	}

	get version(): number {
		return this.contentVersion;
	}

	// the group bbox corners forward-mapped through rotate+translate, in
	// source-space edge coordinates (shared by the overlay outline/handle)
	corners(): [number, number][] {
		const { x: bx, y: by, w: bw, h: bh } = this.bbox;
		const cx = bx + bw / 2;
		const cy = by + bh / 2;
		const cos = Math.cos(this.angle);
		const sin = Math.sin(this.angle);
		const pts: [number, number][] = [
			[bx, by],
			[bx + bw, by],
			[bx + bw, by + bh],
			[bx, by + bh]
		];
		return pts.map(([px, py]) => [
			cx + (px - cx) * cos - (py - cy) * sin + this.dx,
			cy + (px - cx) * sin + (py - cy) * cos + this.dy
		]);
	}

	moveBy(dx: number, dy: number): void {
		this.dx += dx;
		this.dy += dy;
		this.rerasterize();
	}

	rotateTo(angleRad: number): void {
		this.angle = angleRad;
		this.rerasterize();
	}

	contains(px: number, py: number): boolean {
		const { x: bx, y: by, w: bw, h: bh } = this.bbox;
		const cx = bx + bw / 2;
		const cy = by + bh / 2;
		const cos = Math.cos(this.angle);
		const sin = Math.sin(this.angle);
		const ux = px + 0.5 - this.dx - cx;
		const uy = py + 0.5 - this.dy - cy;
		const sx = cos * ux + sin * uy + cx;
		const sy = -sin * ux + cos * uy + cy;
		return sx >= bx && sx < bx + bw && sy >= by && sy < by + bh && !!this.coverage[(Math.floor(sy) - by) * bw + Math.floor(sx) - bx];
	}

	coverageMask(): Uint8Array {
		const { width, height } = this.doc.meta;
		const mask = new Uint8Array(width * height);
		const { x, y, w, h } = this.renderRect;
		for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
			for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
				if (this.contains(px, py)) mask[py * width + px] = 1;
			}
		}
		return mask;
	}

	// Flipping the pristine pixels and negating the angle reads as a flip
	// about the SCREEN axis while rotated (S·R(θ) = R(−θ)·S); at angle 0
	// it is byte-identical to a plain buffer flip.
	flip(axis: 'horizontal' | 'vertical'): void {
		const { w, h } = this.bbox;
		const p = this.pristine;
		if (axis === 'horizontal') {
			for (let y = 0; y < h; y++) {
				const row = y * w;
				for (let x = 0; x < w >> 1; x++) {
					const t = p[row + x];
					p[row + x] = p[row + w - 1 - x];
					p[row + w - 1 - x] = t;
				}
			}
		} else {
			for (let y = 0; y < h >> 1; y++) {
				for (let x = 0; x < w; x++) {
					const a = y * w + x;
					const b = (h - 1 - y) * w + x;
					const t = p[a];
					p[a] = p[b];
					p[b] = t;
				}
			}
		}
		this.angle = -this.angle;
		this.rerasterize();
	}

	// Rebuild renderRect/buffer from the pristine pixels with the current
	// transform: inverse-mapped nearest neighbor, sampling pixel centers.
	// At angle 0 this degenerates to an exact integer copy (lossless moves).
	private rerasterize(): void {
		const { x: bx, y: by, w: bw, h: bh } = this.bbox;
		const cx = bx + bw / 2;
		const cy = by + bh / 2;
		const cos = Math.cos(this.angle);
		const sin = Math.sin(this.angle);

		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const [x, y] of this.corners()) {
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
		this.renderRect = {
			x: Math.floor(minX),
			y: Math.floor(minY),
			w: Math.ceil(maxX) - Math.floor(minX),
			h: Math.ceil(maxY) - Math.floor(minY)
		};

		const { x: rx, y: ry, w: rw, h: rh } = this.renderRect;
		this.buffer = new Uint8Array(rw * rh);
		for (let ty = 0; ty < rh; ty++) {
			for (let tx = 0; tx < rw; tx++) {
				const ux = rx + tx + 0.5 - this.dx - cx;
				const uy = ry + ty + 0.5 - this.dy - cy;
				const sx = Math.floor(cos * ux + sin * uy + cx) - bx;
				const sy = Math.floor(-sin * ux + cos * uy + cy) - by;
				if (sx >= 0 && sx < bw && sy >= 0 && sy < bh) {
					this.buffer[ty * rw + tx] = this.pristine[sy * bw + sx];
				}
			}
		}
		this.contentVersion++;
	}

	// stamp the render buffer into a canvas-sized pixel array, clipped;
	// transparent buffer pixels don't punch holes
	private stampInto(pixels: Uint8Array): void {
		const { width, height } = this.doc.meta;
		const { x, y, w, h } = this.renderRect;
		for (let dy = 0; dy < h; dy++) {
			const ty = y + dy;
			if (ty < 0 || ty >= height) continue;
			for (let dx = 0; dx < w; dx++) {
				const tx = x + dx;
				if (tx < 0 || tx >= width) continue;
				const v = this.buffer[dy * w + dx];
				if (v !== 0) pixels[ty * width + tx] = v;
			}
		}
	}

	private diffVsSnapshot(kind: string, pixels: Uint8Array): PixelDiffCommand | null {
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
			kind,
			this.frameIndex,
			this.layerIndex,
			new Uint32Array(indices),
			new Uint8Array(before),
			new Uint8Array(after),
			this.doc.meta.width
		);
	}

	// Stamps the buffer and returns the whole move as ONE command (already
	// applied to the document). Null when the net result is a no-op.
	commit(): PixelDiffCommand | null {
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		this.stampInto(pixels);
		return this.diffVsSnapshot('selection-move', pixels);
	}

	// Commit this selection together with its mirror twin as ONE command.
	// This selection must have lifted FIRST, so its snapshot is the pristine
	// layer that the single diff runs against. The twin's own commit/cancel
	// are never used.
	commitPair(twin: FloatingSelection): PixelDiffCommand | null {
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		twin.stampInto(pixels);
		this.stampInto(pixels); // main wins where the halves overlap
		return this.diffVsSnapshot('selection-move', pixels);
	}

	// Extract-to-layer: the transformed selection stamped into a blank
	// canvas-sized layer, plus the diff that clears the source pixels
	// (null when the selection held only transparent pixels). Does not
	// mutate the document — the caller cancels and dispatches unapplied.
	extract(): { layerPixels: Uint8Array; sourceDiff: PixelDiffCommand | null } {
		const { width, height } = this.doc.meta;
		const layerPixels = new Uint8Array(width * height);
		this.stampInto(layerPixels);
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		return { layerPixels, sourceDiff: this.diffVsSnapshot('extract-clear', pixels) };
	}

	// extract() for a mirror pair: both halves land on the new layer, one
	// source diff clears both (this selection lifted first, as in commitPair)
	extractPair(twin: FloatingSelection): {
		layerPixels: Uint8Array;
		sourceDiff: PixelDiffCommand | null;
	} {
		const { width, height } = this.doc.meta;
		const layerPixels = new Uint8Array(width * height);
		twin.stampInto(layerPixels);
		this.stampInto(layerPixels);
		const pixels = this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		return { layerPixels, sourceDiff: this.diffVsSnapshot('extract-clear', pixels) };
	}

	// Escape: restore the layer exactly as it was before the lift.
	cancel(): void {
		this.doc.frames[this.frameIndex].layers[this.layerIndex].pixels.set(this.snapshot);
	}
}
