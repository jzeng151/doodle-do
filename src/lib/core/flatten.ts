// Flattens a frame's layers into one indexed pixel buffer (topmost visible
// non-transparent wins). Pure — used by the GIF exporter and anywhere else
// that needs indexed output rather than RGBA.

import type { Doc } from './document';

export function flattenFrameIndices(doc: Doc, frameIndex: number): Uint8Array {
	const { width, height } = doc.meta;
	const out = new Uint8Array(width * height);
	const alpha = new Float32Array(out.length);
	const layers = doc.frames[frameIndex].layers;
	for (let l = 0; l < layers.length; l++) {
		const opacity = layers[l].opacity ?? 1;
		if (!layers[l].visible || opacity <= 0) continue;
		const pixels = layers[l].pixels;
		for (let i = 0; i < out.length; i++) {
			if (pixels[i] === 0) continue;
			out[i] = pixels[i];
			alpha[i] = opacity + alpha[i] * (1 - opacity);
		}
	}
	for (let i = 0; i < out.length; i++) if (alpha[i] < .5) out[i] = 0;
	return out;
}
