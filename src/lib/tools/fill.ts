// Flood fill (Appendix B3): stores the affected pixel set rather than
// recomputing on undo. 4-connected, active layer only.

import type { Doc } from '../core/document';
import { PixelDiffCommand } from '../core/commands';

// The contiguous same-value region containing (x, y), as pixel indices.
// Shared by the fill tool and the magic-wand selection.
export function floodRegion(
	pixels: Uint8Array,
	width: number,
	height: number,
	x: number,
	y: number
): number[] {
	if (x < 0 || y < 0 || x >= width || y >= height) return [];
	const target = pixels[y * width + x];
	const hits: number[] = [];
	const visited = new Uint8Array(pixels.length);
	const stack = [y * width + x];
	visited[stack[0]] = 1;
	while (stack.length) {
		const i = stack.pop()!;
		if (pixels[i] !== target) continue;
		hits.push(i);
		const px = i % width;
		if (px > 0 && !visited[i - 1]) {
			visited[i - 1] = 1;
			stack.push(i - 1);
		}
		if (px < width - 1 && !visited[i + 1]) {
			visited[i + 1] = 1;
			stack.push(i + 1);
		}
		if (i >= width && !visited[i - width]) {
			visited[i - width] = 1;
			stack.push(i - width);
		}
		if (i < pixels.length - width && !visited[i + width]) {
			visited[i + width] = 1;
			stack.push(i + width);
		}
	}
	return hits;
}

export function floodFill(
	doc: Doc,
	frameIndex: number,
	layerIndex: number,
	x: number,
	y: number,
	value: number
): PixelDiffCommand | null {
	const { width, height } = doc.meta;
	if (x < 0 || y < 0 || x >= width || y >= height) return null;
	const pixels = doc.frames[frameIndex].layers[layerIndex].pixels;
	const target = pixels[y * width + x];
	if (target === value) return null;

	const hits = floodRegion(pixels, width, height, x, y);
	const indices = new Uint32Array(hits);
	const before = new Uint8Array(hits.length).fill(target);
	const after = new Uint8Array(hits.length).fill(value);
	return new PixelDiffCommand('flood-fill', frameIndex, layerIndex, indices, before, after, width);
}
