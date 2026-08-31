// Eyedropper: returns the pixel value the user actually sees — the topmost
// visible non-transparent layer at (x, y), or 0.

import type { Doc } from '../core/document';
import { compositePixelIndex } from '../core/flatten';
import { buildLut } from '../core/palette';

const SAMPLE_ALPHA_THRESHOLD = 1;

export function samplePixel(doc: Doc, frameIndex: number, x: number, y: number): number {
	const { width, height } = doc.meta;
	if (x < 0 || y < 0 || x >= width || y >= height) return 0;
	const i = y * width + x;
	return compositePixelIndex(doc.frames[frameIndex].layers, i, doc.palette, undefined, SAMPLE_ALPHA_THRESHOLD);
}

export function hasSampleablePixel(doc: Doc, frameIndex: number): boolean {
	const frame = doc.frames[frameIndex];
	if (!frame) return false;
	const lut = buildLut(doc.palette);
	for (let i = 0; i < doc.meta.width * doc.meta.height; i++) {
		if (compositePixelIndex(frame.layers, i, doc.palette, lut, SAMPLE_ALPHA_THRESHOLD) !== 0) return true;
	}
	return false;
}
