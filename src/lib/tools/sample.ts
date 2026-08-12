// Eyedropper: returns the pixel value the user actually sees — the topmost
// visible non-transparent layer at (x, y), or 0.

import type { Doc } from '../core/document';

export function samplePixel(doc: Doc, frameIndex: number, x: number, y: number): number {
	const { width, height } = doc.meta;
	if (x < 0 || y < 0 || x >= width || y >= height) return 0;
	const layers = doc.frames[frameIndex].layers;
	const i = y * width + x;
	for (let l = layers.length - 1; l >= 0; l--) {
		if (!layers[l].visible || (layers[l].opacity ?? 1) <= 0) continue;
		const v = layers[l].pixels[i];
		if (v !== 0) return v;
	}
	return 0;
}
