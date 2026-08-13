// Eyedropper: returns the pixel value the user actually sees — the topmost
// visible non-transparent layer at (x, y), or 0.

import type { Doc } from '../core/document';
import { compositePixelIndex } from '../core/flatten';

export function samplePixel(doc: Doc, frameIndex: number, x: number, y: number): number {
	const { width, height } = doc.meta;
	if (x < 0 || y < 0 || x >= width || y >= height) return 0;
	const i = y * width + x;
	return compositePixelIndex(doc.frames[frameIndex].layers, i, doc.palette);
}
