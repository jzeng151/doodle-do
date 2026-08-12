import type { Doc } from '../core/document';
import { PixelDiffCommand } from '../core/commands';

export interface Stamp { width: number; height: number; pixels: Uint8Array }

export function stampCommand(doc: Doc, frame: number, layer: number, stamp: Stamp, cx: number, cy: number) {
	const target = doc.frames[frame].layers[layer].pixels;
	const indices: number[] = [], before: number[] = [], after: number[] = [];
	const x0 = cx - Math.floor(stamp.width / 2), y0 = cy - Math.floor(stamp.height / 2);
	for (let y = 0; y < stamp.height; y++) for (let x = 0; x < stamp.width; x++) {
		const value = stamp.pixels[y * stamp.width + x], tx = x0 + x, ty = y0 + y;
		if (!value || tx < 0 || ty < 0 || tx >= doc.meta.width || ty >= doc.meta.height) continue;
		const index = ty * doc.meta.width + tx;
		if (target[index] === value) continue;
		indices.push(index); before.push(target[index]); after.push(value);
	}
	return indices.length ? new PixelDiffCommand('selection-stamp', frame, layer, new Uint32Array(indices), new Uint8Array(before), new Uint8Array(after), doc.meta.width) : null;
}

export function flipStamp(stamp: Stamp): Stamp {
	const pixels = new Uint8Array(stamp.pixels.length);
	for (let y = 0; y < stamp.height; y++) for (let x = 0; x < stamp.width; x++) pixels[y * stamp.width + stamp.width - 1 - x] = stamp.pixels[y * stamp.width + x];
	return { ...stamp, pixels };
}

export function rotateStamp(stamp: Stamp): Stamp {
	const pixels = new Uint8Array(stamp.pixels.length);
	for (let y = 0; y < stamp.height; y++) for (let x = 0; x < stamp.width; x++) pixels[x * stamp.height + stamp.height - 1 - y] = stamp.pixels[y * stamp.width + x];
	return { width: stamp.height, height: stamp.width, pixels };
}
