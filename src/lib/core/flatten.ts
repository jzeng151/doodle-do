// Flattens a frame's layers into one indexed pixel buffer (topmost visible
// non-transparent wins). Pure — used by the GIF exporter and anywhere else
// that needs indexed output rather than RGBA.

import type { Doc } from './document';

export function flattenFrameIndices(doc: Doc, frameIndex: number): Uint8Array {
	const { width, height } = doc.meta;
	const out = new Uint8Array(width * height);
	const layers = doc.frames[frameIndex].layers;
	for (let l = 0; l < layers.length; l++) {
		if (!layers[l].visible) continue;
		const pixels = layers[l].pixels;
		for (let i = 0; i < out.length; i++) {
			if (pixels[i] !== 0 && ((layers[l].opacity ?? 1) >= .5 || out[i] === 0)) out[i] = pixels[i];
		}
	}
	return out;
}
