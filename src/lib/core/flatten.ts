// Flattens a frame's layers into one indexed pixel buffer (topmost visible
// non-transparent wins). Pure — used by the GIF exporter and anywhere else
// that needs indexed output rather than RGBA.

import type { Doc, Layer } from './document';
import { buildLut } from './palette';
import { blendPacked } from '../render/compositor';

export function compositePixelIndex(layers: Layer[], index: number, palette: string[], lut = buildLut(palette), alphaThreshold = 128, quantized?: Map<number, number>): number {
	let color = 0;
	for (const layer of layers) {
		if (!layer.visible) continue;
		const value = layer.pixels[index];
		if (value) color = blendPacked(color, lut[value], layer.opacity ?? 1);
	}
	if ((color >>> 24) < alphaThreshold) return 0;
	const cached = quantized?.get(color);
	if (cached !== undefined) return cached;
	let nearest = 1, distance = Infinity;
	for (let value = 1; value <= palette.length; value++) {
		const red = (color & 255) - (lut[value] & 255);
		const green = ((color >>> 8) & 255) - ((lut[value] >>> 8) & 255);
		const blue = ((color >>> 16) & 255) - ((lut[value] >>> 16) & 255);
		const score = red * red + green * green + blue * blue;
		if (score < distance) [nearest, distance] = [value, score];
	}
	quantized?.set(color, nearest);
	return nearest;
}

export function flattenFrameIndices(doc: Doc, frameIndex: number): Uint8Array {
	const { width, height } = doc.meta;
	const out = new Uint8Array(width * height);
	const layers = doc.frames[frameIndex].layers;
	const lut = buildLut(doc.palette);
	const quantized = new Map<number, number>();
	for (let value = 1; value <= doc.palette.length; value++) if (!quantized.has(lut[value])) quantized.set(lut[value], value);
	for (let i = 0; i < out.length; i++) out[i] = compositePixelIndex(layers, i, doc.palette, lut, 128, quantized);
	return out;
}
