// Horizontal/vertical flip of the whole active layer (B5: applies to the
// floating selection buffer when one exists — selection ships in Phase 2).
// A flip is its own inverse, so do and undo are the same transform.

import type { Command, DirtyRegion } from '../core/commands';
import type { Doc } from '../core/document';

export class FlipLayerCommand implements Command {
	readonly kind: string;
	readonly byteSize = 64;

	constructor(
		private readonly frameIndex: number,
		private readonly layerIndex: number,
		private readonly axis: 'horizontal' | 'vertical'
	) {
		this.kind = `flip-${axis}`;
	}

	do(doc: Doc): void {
		const { width, height } = doc.meta;
		const pixels = doc.frames[this.frameIndex].layers[this.layerIndex].pixels;
		if (this.axis === 'horizontal') {
			for (let y = 0; y < height; y++) {
				const row = y * width;
				for (let x = 0; x < width >> 1; x++) {
					const a = row + x;
					const b = row + width - 1 - x;
					const t = pixels[a];
					pixels[a] = pixels[b];
					pixels[b] = t;
				}
			}
		} else {
			for (let y = 0; y < height >> 1; y++) {
				const rowA = y * width;
				const rowB = (height - 1 - y) * width;
				for (let x = 0; x < width; x++) {
					const t = pixels[rowA + x];
					pixels[rowA + x] = pixels[rowB + x];
					pixels[rowB + x] = t;
				}
			}
		}
	}

	undo(doc: Doc): void {
		this.do(doc);
	}

	serialize(): unknown {
		return { kind: this.kind, frame: this.frameIndex, layer: this.layerIndex };
	}

	dirty(): DirtyRegion {
		return { frame: this.frameIndex, rect: null };
	}
}
