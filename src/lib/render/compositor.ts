// Compositor (§6.3): flattens Frame → offscreen canvas with dirty-rect
// caching. Live loop, editor canvas, grid canvases, thumbnails, and onion
// ghosts all consume this cache — composite once, blit everywhere.

import type { Doc } from '../core/document';
import type { DirtyRegion, Rect } from '../core/commands';
import { buildLut } from '../core/palette';
import { unionRect } from '../tools/pencil';

interface FrameCacheEntry {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	img: ImageData;
	u32: Uint32Array;
	dirty: Rect | 'all' | null;
}

export class Compositor {
	private lut: Uint32Array;
	private cache: FrameCacheEntry[] = [];

	constructor(private readonly doc: Doc) {
		this.lut = buildLut(doc.palette);
	}

	invalidate(region: DirtyRegion): void {
		if (region.palette) {
			this.invalidatePalette();
			return;
		}
		if (region.frame === null) {
			// structural change: frame indices may have shifted — drop the cache
			this.cache = [];
			return;
		}
		const entry = this.cache[region.frame];
		if (!entry) return; // not composited yet — will be built on first request
		if (region.rect === null || entry.dirty === 'all') {
			entry.dirty = 'all';
		} else {
			entry.dirty = unionRect(entry.dirty === null ? null : entry.dirty, region.rect);
		}
	}

	invalidatePalette(): void {
		this.lut = buildLut(this.doc.palette);
		this.cache = [];
	}

	frameCanvas(frameIndex: number): HTMLCanvasElement {
		let entry = this.cache[frameIndex];
		if (!entry) {
			const { width, height } = this.doc.meta;
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d')!;
			const img = ctx.createImageData(width, height);
			entry = { canvas, ctx, img, u32: new Uint32Array(img.data.buffer), dirty: 'all' };
			this.cache[frameIndex] = entry;
		}
		if (entry.dirty !== null) {
			const { width, height } = this.doc.meta;
			const rect: Rect =
				entry.dirty === 'all' ? { x: 0, y: 0, w: width, h: height } : entry.dirty;
			this.composite(frameIndex, entry, rect);
			entry.ctx.putImageData(entry.img, 0, 0, rect.x, rect.y, rect.w, rect.h);
			entry.dirty = null;
		}
		return entry.canvas;
	}

	private composite(frameIndex: number, entry: FrameCacheEntry, rect: Rect): void {
		const { width } = this.doc.meta;
		const layers = this.doc.frames[frameIndex].layers;
		const { u32 } = entry;
		for (let y = rect.y; y < rect.y + rect.h; y++) {
			const row = y * width;
			for (let x = rect.x; x < rect.x + rect.w; x++) {
				const i = row + x;
				let color = 0;
				// topmost visible non-transparent pixel wins (indexed color has
				// no per-pixel alpha to blend — 0 is fully transparent)
				for (let l = layers.length - 1; l >= 0; l--) {
					if (!layers[l].visible) continue;
					const v = layers[l].pixels[i];
					if (v !== 0) {
						color = this.lut[v];
						break;
					}
				}
				u32[i] = color;
			}
		}
	}
}
