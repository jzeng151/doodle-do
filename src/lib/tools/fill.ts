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
	value: number,
	tolerance = 0,
	contiguous = true
): PixelDiffCommand | null {
	const { width, height } = doc.meta;
	if (x < 0 || y < 0 || x >= width || y >= height) return null;
	const pixels = doc.frames[frameIndex].layers[layerIndex].pixels;
	const target = pixels[y * width + x];

	const match = new Uint8Array(doc.palette.length + 1);
	for (let candidate = 0; candidate < match.length; candidate++) match[candidate] = Number(tolerance <= 0 ? candidate === target : colorDistance(doc, target, candidate) <= tolerance);
	const matches = (candidate: number) => !!match[candidate];
	const hits = (contiguous
		? connectedRegion(pixels, width, height, x, y, matches)
		: Array.from(pixels.keys()).filter((index) => matches(pixels[index])))
		.filter((index) => pixels[index] !== value);
	if (!hits.length) return null;
	const indices = new Uint32Array(hits);
	const before = new Uint8Array(hits.map((index) => pixels[index]));
	const after = new Uint8Array(hits.length).fill(value);
	return new PixelDiffCommand('flood-fill', frameIndex, layerIndex, indices, before, after, width);
}

function connectedRegion(
	pixels: Uint8Array,
	width: number,
	height: number,
	x: number,
	y: number,
	matches: (value: number) => boolean
): number[] {
	const hits: number[] = [];
	const visited = new Uint8Array(pixels.length);
	const stack = [y * width + x];
	visited[stack[0]] = 1;
	while (stack.length) {
		const index = stack.pop()!;
		if (!matches(pixels[index])) continue;
		hits.push(index);
		const px = index % width;
		for (const next of [px > 0 ? index - 1 : -1, px < width - 1 ? index + 1 : -1, index - width, index + width]) {
			if (next >= 0 && next < pixels.length && !visited[next]) {
				visited[next] = 1;
				stack.push(next);
			}
		}
	}
	return hits;
}

function colorDistance(doc: Doc, a: number, b: number): number {
	if (a === b) return 0;
	if (a === 0 || b === 0) return 256;
	const rgb = (value: number) => {
		const hex = parseInt(doc.palette[value - 1].slice(1), 16);
		return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
	};
	const aa = rgb(a);
	const bb = rgb(b);
	return Math.sqrt(aa.reduce((sum, channel, i) => sum + (channel - bb[i]) ** 2, 0) / 3);
}
