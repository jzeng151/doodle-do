import type { Doc } from '../core/document';
import { PixelDiffCommand } from '../core/commands';

export function replaceColorCommand(
	doc: Doc,
	frameIndex: number,
	layerIndex: number,
	from: number,
	to: number,
	mask?: Uint8Array | null
): PixelDiffCommand | null {
	if (from === to) return null;
	const pixels = doc.frames[frameIndex].layers[layerIndex].pixels;
	const hits: number[] = [];
	for (let i = 0; i < pixels.length; i++) {
		if (pixels[i] === from && (!mask || mask[i])) hits.push(i);
	}
	if (!hits.length) return null;
	return new PixelDiffCommand(
		'replace-color',
		frameIndex,
		layerIndex,
		new Uint32Array(hits),
		new Uint8Array(hits.length).fill(from),
		new Uint8Array(hits.length).fill(to),
		doc.meta.width
	);
}
