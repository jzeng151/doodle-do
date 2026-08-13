// Flattens a frame's layers into one indexed pixel buffer (topmost visible
// non-transparent wins). Pure — used by the GIF exporter and anywhere else
// that needs indexed output rather than RGBA.

import type { Doc, Layer } from './document';
import { buildLut } from './palette';
import { blendPacked } from '../render/compositor';

export function compositePixelIndex(layers: Layer[], index: number, palette: string[], lut = buildLut(palette)): number {
	let color = 0;
	for (const layer of layers) {
		if (!layer.visible) continue;
		const value = layer.pixels[index];
		if (value) color = blendPacked(color, lut[value], layer.opacity ?? 1);
	}
	if ((color >>> 24) < 128) return 0;
	let nearest = 1, distance = Infinity;
	for (let value = 1; value <= palette.length; value++) {
		const red = (color & 255) - (lut[value] & 255);
		const green = ((color >>> 8) & 255) - ((lut[value] >>> 8) & 255);
		const blue = ((color >>> 16) & 255) - ((lut[value] >>> 16) & 255);
		const score = red * red + green * green + blue * blue;
		if (score < distance) [nearest, distance] = [value, score];
	}
	return nearest;
}

export function flattenFrameIndices(doc: Doc, frameIndex: number): Uint8Array {
	const { width, height } = doc.meta;
	const out = new Uint8Array(width * height);
	const layers = doc.frames[frameIndex].layers;
	const lut = buildLut(doc.palette);
	for (let i = 0; i < out.length; i++) out[i] = compositePixelIndex(layers, i, doc.palette, lut);
	return out;
}
