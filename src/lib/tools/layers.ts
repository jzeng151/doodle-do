// Layer operations that bundle several mutations into ONE undo step via
// CompositeCommand: merge-down and copying/moving a layer to another frame.

import { MAX_LAYERS, type Doc } from '../core/document';
import { CompositeCommand, PixelDiffCommand, type Command } from '../core/commands';
import { LayerAddCommand, LayerDeleteCommand, UnlinkFrameCommand } from '../core/structural';

export function mergeDownBlockedReason(doc: Doc, frameIndex: number, layerIndex: number): string | null {
	if (layerIndex <= 0) return 'No layer below to merge into';
	const layers = doc.frames[frameIndex].layers;
	const upper = layers[layerIndex];
	const lower = layers[layerIndex - 1];
	if (doc.frames.some((frame) => frame.layers.some((layer) => layer.pixels === lower.pixels && layer.locked))) return 'Unlock the layer below before merging';
	if ((upper.opacity ?? 1) !== 1 || (lower.opacity ?? 1) !== 1) return 'Set both layer opacities to 100% before merging';
	return null;
}

// Composite the layer's nonzero pixels onto the layer below (matching how
// the compositor flattens), then delete it. Null when nothing is below.
export function mergeDownCommand(
	doc: Doc,
	frameIndex: number,
	layerIndex: number
): CompositeCommand | null {
	if (mergeDownBlockedReason(doc, frameIndex, layerIndex)) return null;
	const layers = doc.frames[frameIndex].layers;
	const upperLayer = layers[layerIndex];
	const lowerLayer = layers[layerIndex - 1];
	const upper = upperLayer.pixels;
	const lower = lowerLayer.pixels;
	const indices: number[] = [];
	const before: number[] = [];
	const after: number[] = [];
	for (let i = 0; i < upper.length; i++) {
		if (upper[i] !== 0 && lower[i] !== upper[i]) {
			indices.push(i);
			before.push(lower[i]);
			after.push(upper[i]);
		}
	}
	const sharedLower = doc.frames.some((frame, f) =>
		frame.layers.some((layer, l) => (f !== frameIndex || l !== layerIndex - 1) && layer.pixels === lower)
	);
	const cmds: Command[] = sharedLower ? [new UnlinkFrameCommand(doc, frameIndex)] : [];
	if (indices.length) {
		cmds.push(
			new PixelDiffCommand(
				'merge-down',
				frameIndex,
				layerIndex - 1,
				new Uint32Array(indices),
				new Uint8Array(before),
				new Uint8Array(after),
				doc.meta.width
			)
		);
	}
	cmds.push(new LayerDeleteCommand(doc, frameIndex, layerIndex));
	return new CompositeCommand('merge-layers', cmds);
}

// Clone the layer onto the top of another frame's stack; a move also deletes
// the source. Null when the target is the same frame or at the layer cap,
// or when a move would leave the source frame with no layers.
export function sendLayerCommand(
	doc: Doc,
	frameIndex: number,
	layerIndex: number,
	targetFrame: number,
	move: boolean
): CompositeCommand | null {
	if (targetFrame === frameIndex || targetFrame < 0 || targetFrame >= doc.frames.length) {
		return null;
	}
	const target = doc.frames[targetFrame];
	if (target.layers.length >= MAX_LAYERS) return null;
	if (move && doc.frames[frameIndex].layers.length <= 1) return null;
	const src = doc.frames[frameIndex].layers[layerIndex];
	const { linkId: _, ...copy } = src;
	const cmds: Command[] = [
		new LayerAddCommand(targetFrame, target.layers.length, {
			...copy,
			pixels: src.pixels.slice()
		})
	];
	if (move) cmds.push(new LayerDeleteCommand(doc, frameIndex, layerIndex));
	return new CompositeCommand(move ? 'layer-move' : 'layer-copy', cmds);
}
