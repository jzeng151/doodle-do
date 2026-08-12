import type { Doc } from '../core/document';
import type { Command, DirtyRegion, Rect } from '../core/commands';

export class ReplaceColorCommand implements Command {
	readonly kind = 'replace-color';
	readonly byteSize: number;
	readonly pixelCount: number;
	private readonly hits: Uint8Array;
	private readonly bbox: Rect;

	constructor(
		doc: Doc,
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly from: number,
		private readonly to: number,
		mask?: Uint8Array | null
	) {
		const pixels = doc.frames[frameIndex].layers[layerIndex].pixels;
		this.hits = new Uint8Array(Math.ceil(pixels.length / 8));
		let count = 0, minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
		for (let i = 0; i < pixels.length; i++) {
			if (pixels[i] !== from || (mask && !mask[i])) continue;
			this.hits[i >> 3] |= 1 << (i & 7);
			count++;
			const x = i % doc.meta.width, y = (i / doc.meta.width) | 0;
			minX = Math.min(minX, x); minY = Math.min(minY, y);
			maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
		}
		this.pixelCount = count;
		this.byteSize = this.hits.byteLength + 64;
		this.bbox = count ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: 0, y: 0, w: 0, h: 0 };
	}

	private apply(doc: Doc, value: number): void {
		const pixels = doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		for (let i = 0; i < pixels.length; i++) if (this.hits[i >> 3] & (1 << (i & 7))) pixels[i] = value;
	}

	do(doc: Doc): void { this.apply(doc, this.to); }
	undo(doc: Doc): void { this.apply(doc, this.from); }
	serialize(): unknown { return { kind: this.kind, frame: this.frameIndex, layer: this.layerIndex, from: this.from, to: this.to, hits: Array.from(this.hits) }; }
	dirty(): DirtyRegion { return { frame: this.frameIndex, rect: this.bbox }; }
}

export function replaceColorCommand(
	doc: Doc,
	frameIndex: number,
	layerIndex: number,
	from: number,
	to: number,
	mask?: Uint8Array | null
): ReplaceColorCommand | null {
	if (from === to) return null;
	const command = new ReplaceColorCommand(doc, frameIndex, layerIndex, from, to, mask);
	return command.pixelCount ? command : null;
}
