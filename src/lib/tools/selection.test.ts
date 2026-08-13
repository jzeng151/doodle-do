import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { DEFAULT_PALETTE } from '../core/palette';
import { CommandBus } from '../core/commands';
import { combineMasks, FloatingSelection, clampRect, maskFromPolygon, maskFromRects, mirrorMaskX } from './selection';

function testDoc() {
	const doc = createDoc({ width: 8, height: 8, palette: DEFAULT_PALETTE, frameCount: 1 });
	const pixels = doc.frames[0].layers[0].pixels;
	// 2×2 block of color 3 at (1,1), a bystander pixel of color 5 at (5,5)
	pixels[1 * 8 + 1] = 3;
	pixels[1 * 8 + 2] = 3;
	pixels[2 * 8 + 1] = 3;
	pixels[2 * 8 + 2] = 3;
	pixels[5 * 8 + 5] = 5;
	return doc;
}

describe('clampRect', () => {
	it('clips to bounds and rejects empty results', () => {
		expect(clampRect({ x: -2, y: -2, w: 4, h: 4 }, 8, 8)).toEqual({ x: 0, y: 0, w: 2, h: 2 });
		expect(clampRect({ x: 10, y: 0, w: 4, h: 4 }, 8, 8)).toBeNull();
	});
});

describe('selection modes', () => {
	const current = new Uint8Array([1, 1, 0, 0]);
	const next = new Uint8Array([0, 1, 1, 0]);

	it('replaces, adds, subtracts, and intersects masks', () => {
		expect([...(combineMasks(current, next, 'replace') ?? [])]).toEqual([0, 1, 1, 0]);
		expect([...(combineMasks(current, next, 'add') ?? [])]).toEqual([1, 1, 1, 0]);
		expect([...(combineMasks(current, next, 'subtract') ?? [])]).toEqual([1, 0, 0, 0]);
		expect([...(combineMasks(current, next, 'intersect') ?? [])]).toEqual([0, 1, 0, 0]);
	});

	it('returns no selection for an empty result', () => {
		expect(combineMasks(null, next, 'subtract')).toBeNull();
	});
});

describe('FloatingSelection (B5)', () => {
	it('tracks transformed selection coverage independently of transparent pixels', () => {
		const doc = testDoc();
		const mask = maskFromRects([{ x: 1, y: 1, w: 1, h: 1 }, { x: 3, y: 1, w: 1, h: 1 }], 8, 8);
		const sel = new FloatingSelection(doc, 0, 0, mask);
		sel.moveBy(1, 1);
		const moved = sel.coverageMask();
		expect([moved[2 * 8 + 2], moved[2 * 8 + 3], moved[2 * 8 + 4]]).toEqual([1, 0, 1]);
	});

	it('lift clears the source and captures the buffer', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 1]).toBe(0); // source cleared
		expect(Array.from(sel.buffer)).toEqual([3, 3, 3, 3]);
	});

	it('lift + move + stamp collapses into ONE undoable command', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		sel.moveBy(3, 2);
		const cmd = sel.commit()!;
		bus.dispatch(cmd, { applied: true });

		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 1]).toBe(0); // old spot empty
		expect(pixels[3 * 8 + 4]).toBe(3); // new spot filled
		expect(pixels[4 * 8 + 5]).toBe(3);
		expect(bus.undoDepth).toBe(1);

		bus.undo(); // one step restores everything
		expect(pixels[1 * 8 + 1]).toBe(3);
		expect(pixels[3 * 8 + 4]).toBe(0);
		expect(pixels[5 * 8 + 5]).toBe(5); // bystander untouched throughout
	});

	it('committing without moving is a no-op (null command)', () => {
		const doc = testDoc();
		const before = doc.frames[0].layers[0].pixels.slice();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		expect(sel.commit()).toBeNull();
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});

	it('flip applies to the buffer and lands flipped', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels[1 * 8 + 2] = 7; // make the block asymmetric
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		sel.flip('horizontal');
		sel.moveBy(0, 3);
		sel.commit();
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[4 * 8 + 1]).toBe(7); // the 7 was top-right, now top-left
		expect(pixels[4 * 8 + 2]).toBe(3);
	});

	it('cancel restores the layer exactly', () => {
		const doc = testDoc();
		const before = doc.frames[0].layers[0].pixels.slice();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		sel.moveBy(4, 4);
		sel.flip('vertical');
		sel.cancel();
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});

	it('transparent buffer pixels do not punch holes at the destination', () => {
		const doc = testDoc();
		// select a 3×3 area whose corner overlaps the block — buffer has 0s
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 2, y: 2, w: 3, h: 3 }], 8, 8));
		sel.moveBy(3, 3); // drop it over the bystander at (5,5)
		sel.commit();
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[5 * 8 + 5]).toBe(3); // block pixel landed on it
		expect(pixels[7 * 8 + 7]).toBe(0); // transparent part stayed transparent
	});

	it('off-canvas moves clip on stamp; the rest is dropped', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		sel.moveBy(6, 0); // x now 7: right column lands, left column off-canvas
		const cmd = sel.commit()!;
		bus.dispatch(cmd, { applied: true });
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 7]).toBe(3);
		expect(pixels[2 * 8 + 7]).toBe(3);
		bus.undo();
		expect(pixels[1 * 8 + 1]).toBe(3); // fully restored even after clipping
		expect(pixels[1 * 8 + 7]).toBe(0);
	});
});

describe('FloatingSelection multi-rect + rotation', () => {
	it('lifts multiple disjoint rects, leaving pixels between them alone', () => {
		const doc = testDoc();
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[3 * 8 + 3] = 6; // between the two rects, inside the bbox
		const sel = new FloatingSelection(
			doc,
			0,
			0,
			maskFromRects(
				[
					{ x: 1, y: 1, w: 2, h: 2 },
					{ x: 5, y: 5, w: 1, h: 1 }
				],
				8,
				8
			)
		);
		expect(pixels[1 * 8 + 1]).toBe(0); // both sources cleared
		expect(pixels[5 * 8 + 5]).toBe(0);
		expect(pixels[3 * 8 + 3]).toBe(6); // gap pixel not lifted
		// bbox spans (1,1)..(5,5); buffer holds both regions, gap is transparent
		expect(sel.buffer[0]).toBe(3); // (1,1)
		expect(sel.buffer[4 * 5 + 4]).toBe(5); // (5,5)
		expect(sel.buffer[2 * 5 + 2]).toBe(0); // (3,3) not lifted
	});

	it('overlapping rects lift each pixel exactly once and cancel restores exactly', () => {
		const doc = testDoc();
		const before = doc.frames[0].layers[0].pixels.slice();
		const sel = new FloatingSelection(
			doc,
			0,
			0,
			maskFromRects(
				[
					{ x: 1, y: 1, w: 2, h: 2 },
					{ x: 2, y: 2, w: 2, h: 2 }
				],
				8,
				8
			)
		);
		// shared pixel (2,2) captured once with its real value, not zero
		expect(sel.buffer[1 * 3 + 1]).toBe(3); // (2,2) in bbox (1,1,3,3)
		expect(doc.frames[0].layers[0].pixels[2 * 8 + 2]).toBe(0);
		sel.moveBy(2, 2);
		sel.cancel();
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});

	it('moving two regions commits as ONE command; one undo restores both', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const sel = new FloatingSelection(
			doc,
			0,
			0,
			maskFromRects(
				[
					{ x: 1, y: 1, w: 2, h: 2 },
					{ x: 5, y: 5, w: 1, h: 1 }
				],
				8,
				8
			)
		);
		sel.moveBy(0, 2);
		bus.dispatch(sel.commit()!, { applied: true });
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[3 * 8 + 1]).toBe(3); // block moved down 2
		expect(pixels[7 * 8 + 5]).toBe(5); // bystander moved down 2
		expect(pixels[5 * 8 + 5]).toBe(0);
		expect(bus.undoDepth).toBe(1);
		bus.undo();
		expect(pixels[1 * 8 + 1]).toBe(3);
		expect(pixels[5 * 8 + 5]).toBe(5);
		expect(pixels[7 * 8 + 5]).toBe(0);
	});

	it('90-degree rotation is an exact permutation', () => {
		const doc = createDoc({ width: 8, height: 8, palette: DEFAULT_PALETTE, frameCount: 1 });
		const pixels = doc.frames[0].layers[0].pixels;
		// 3x1 horizontal bar at y=1: values 3,7,9
		pixels[1 * 8 + 1] = 3;
		pixels[1 * 8 + 2] = 7;
		pixels[1 * 8 + 3] = 9;
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 3, h: 1 }], 8, 8));
		sel.rotateTo(Math.PI / 2);
		sel.commit();
		// bar is now vertical at x=2, y=0..2, order preserved top-to-bottom
		expect(pixels[0 * 8 + 2]).toBe(3);
		expect(pixels[1 * 8 + 2]).toBe(7);
		expect(pixels[2 * 8 + 2]).toBe(9);
		expect(pixels[1 * 8 + 1]).toBe(0); // old spots cleared
		expect(pixels[1 * 8 + 3]).toBe(0);
	});

	it('repeated rotation does not compound resampling loss', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		sel.rotateTo(0.3);
		sel.rotateTo(1.1);
		sel.rotateTo(0);
		expect(sel.commit()).toBeNull(); // back to identity = net no-op
	});

	it('rotate + flip + move is ONE command and flip works about the screen axis', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels[1 * 8 + 2] = 7; // asymmetric block
		const bus = new CommandBus(doc);
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		// flip while rotated, then rotate back: equals a plain flip of the original
		sel.rotateTo(0.4);
		sel.flip('horizontal');
		sel.rotateTo(0);
		expect(Array.from(sel.buffer)).toEqual([7, 3, 3, 3]);
		sel.moveBy(0, 3);
		bus.dispatch(sel.commit()!, { applied: true });
		expect(bus.undoDepth).toBe(1);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[4 * 8 + 1]).toBe(7); // flipped block landed at y+3
		bus.undo();
		expect(pixels[1 * 8 + 2]).toBe(7); // one undo restores everything
		expect(pixels[4 * 8 + 1]).toBe(0);
	});
});

describe('precision selection masks', () => {
	it('an arbitrary mask lifts only the masked pixels', () => {
		const doc = testDoc();
		const pixels = doc.frames[0].layers[0].pixels;
		// L-shaped mask over the 2x2 block: (1,1),(2,1),(1,2) but NOT (2,2)
		const mask = new Uint8Array(64);
		mask[1 * 8 + 1] = 1;
		mask[1 * 8 + 2] = 1;
		mask[2 * 8 + 1] = 1;
		const sel = new FloatingSelection(doc, 0, 0, mask);
		expect(pixels[2 * 8 + 2]).toBe(3); // unmasked pixel stays on the layer
		expect(pixels[1 * 8 + 1]).toBe(0); // masked pixels lifted
		// bbox is (1,1,2,2); the unmasked cell is transparent in the buffer
		expect(Array.from(sel.buffer)).toEqual([3, 3, 3, 0]);
	});

	it('maskFromRects covers exactly the clamped rects', () => {
		const mask = maskFromRects([{ x: -1, y: -1, w: 2, h: 2 }], 8, 8);
		expect(mask[0]).toBe(1); // (0,0) survives clamping
		expect(mask[1]).toBe(0);
		expect(mask[8]).toBe(0);
	});

	it('maskFromPolygon fills the interior and includes the outline path', () => {
		// right triangle over pixel centers (0,0), (6,0), (0,6)
		const mask = maskFromPolygon(
			[
				{ x: 0.5, y: 0.5 },
				{ x: 6.5, y: 0.5 },
				{ x: 0.5, y: 6.5 }
			],
			8,
			8
		);
		expect(mask[0 * 8 + 0]).toBe(1); // vertices are on the path
		expect(mask[0 * 8 + 6]).toBe(1);
		expect(mask[6 * 8 + 0]).toBe(1);
		expect(mask[2 * 8 + 2]).toBe(1); // interior
		expect(mask[6 * 8 + 6]).toBe(0); // outside
		expect(mask[3 * 8 + 5]).toBe(0); // outside, beyond the hypotenuse
	});

	it('a thin polygon still selects its path pixels', () => {
		// a degenerate sliver: nearly a line from (1,1) to (5,1)
		const mask = maskFromPolygon(
			[
				{ x: 1.5, y: 1.5 },
				{ x: 5.5, y: 1.5 },
				{ x: 1.5, y: 1.6 }
			],
			8,
			8
		);
		expect(mask[1 * 8 + 1]).toBe(1);
		expect(mask[1 * 8 + 3]).toBe(1);
		expect(mask[1 * 8 + 5]).toBe(1);
	});
});

describe('extract to layer', () => {
	it('returns the transformed selection as layer pixels plus a source-clear diff', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8));
		sel.moveBy(3, 2);
		const { layerPixels, sourceDiff } = sel.extract();
		// the block sits at (4,3)..(5,4) in the new layer, nowhere else
		expect(layerPixels[3 * 8 + 4]).toBe(3);
		expect(layerPixels[4 * 8 + 5]).toBe(3);
		expect(layerPixels[1 * 8 + 1]).toBe(0);
		// cancel restores the source; the diff re-clears exactly the lifted pixels
		expect(sourceDiff).not.toBeNull();
		sel.cancel();
		expect(doc.frames[0].layers[0].pixels[1 * 8 + 1]).toBe(3);
		sourceDiff!.do(doc);
		expect(doc.frames[0].layers[0].pixels[1 * 8 + 1]).toBe(0);
		expect(doc.frames[0].layers[0].pixels[5 * 8 + 5]).toBe(5); // bystander kept
	});

	it('an all-transparent selection extracts to nothing', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 6, y: 0, w: 2, h: 2 }], 8, 8));
		const { layerPixels, sourceDiff } = sel.extract();
		expect(sourceDiff).toBeNull();
		expect(layerPixels.every((v) => v === 0)).toBe(true);
	});
});

describe('pixel-safe quarter turns', () => {
	it('rotates a parity-mismatched selection without dropping pixels', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels.fill(0);
		doc.frames[0].layers[0].pixels[8] = 3;
		doc.frames[0].layers[0].pixels[9] = 5;
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 0, y: 1, w: 2, h: 1 }], 8, 8));
		sel.rotateTo(Math.PI / 2);
		expect([...sel.buffer]).toEqual([3, 5]);
		sel.commit();
		expect(doc.frames[0].layers[0].pixels.filter(Boolean)).toHaveLength(2);
	});

	it('moves on the first nudge after an edge-clamped rotation', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 0, y: 1, w: 1, h: 3 }], 8, 8));
		sel.rotateTo(Math.PI / 2);
		expect(sel.renderRect.x).toBe(0);
		sel.moveBy(1, 0);
		expect(sel.renderRect.x).toBe(1);
	});

	it('keeps the snapped center when returning to free rotation', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 2, h: 1 }], 8, 8));
		sel.rotateTo(Math.PI / 2);
		const center = {
			x: sel.renderRect.x + sel.renderRect.w / 2,
			y: sel.renderRect.y + sel.renderRect.h / 2
		};
		sel.rotateTo(Math.PI / 2 + Math.PI / 12);
		expect(sel.bbox.x + sel.bbox.w / 2 + sel.dx).toBe(center.x);
		expect(sel.bbox.y + sel.bbox.h / 2 + sel.dy).toBe(center.y);
	});

	it('does not turn edge clamps into translation', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 0, y: 0, w: 2, h: 1 }], 8, 8));
		for (let turn = 1; turn <= 4; turn++) sel.rotateTo(turn * Math.PI / 2);
		expect(sel.renderRect).toEqual({ x: 0, y: 0, w: 2, h: 1 });
		expect(sel.dx).toBe(0);
		expect(sel.dy).toBe(0);
	});
});

describe('mirrored twin selection', () => {
	it('mirrorMaskX reflects the mask across the canvas centerline', () => {
		const mask = maskFromRects([{ x: 1, y: 2, w: 2, h: 1 }], 8, 8);
		const mirrored = mirrorMaskX(mask, 8, 8);
		expect(mirrored[2 * 8 + 5]).toBe(1); // x=2 -> 5
		expect(mirrored[2 * 8 + 6]).toBe(1); // x=1 -> 6
		expect(mirrored[2 * 8 + 1]).toBe(0);
	});

	it('commitPair stamps both halves mirrored and collapses into ONE command', () => {
		const doc = createDoc({ width: 8, height: 8, palette: DEFAULT_PALETTE, frameCount: 1 });
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[1 * 8 + 1] = 3; // main content at (1,1)
		pixels[1 * 8 + 6] = 5; // twin content at its mirror (6,1), different value
		const bus = new CommandBus(doc);

		const mask = maskFromRects([{ x: 1, y: 1, w: 1, h: 1 }], 8, 8);
		const main = new FloatingSelection(doc, 0, 0, mask); // lifts FIRST: pristine snapshot
		const twin = new FloatingSelection(doc, 0, 0, mirrorMaskX(mask, 8, 8));
		main.moveBy(2, 1);
		twin.moveBy(-2, 1);
		bus.dispatch(main.commitPair(twin)!, { applied: true });

		expect(pixels[2 * 8 + 3]).toBe(3); // main landed at (3,2)
		expect(pixels[2 * 8 + 4]).toBe(5); // twin landed at the mirror (4,2)
		expect(pixels[1 * 8 + 1]).toBe(0); // both sources cleared
		expect(pixels[1 * 8 + 6]).toBe(0);
		expect(bus.undoDepth).toBe(1);

		bus.undo(); // one step restores both halves
		expect(pixels[1 * 8 + 1]).toBe(3);
		expect(pixels[1 * 8 + 6]).toBe(5);
		expect(pixels[2 * 8 + 3]).toBe(0);
	});

	it('cancelling the main selection alone restores the layer exactly', () => {
		const doc = testDoc();
		const before = doc.frames[0].layers[0].pixels.slice();
		const mask = maskFromRects([{ x: 1, y: 1, w: 2, h: 2 }], 8, 8);
		const main = new FloatingSelection(doc, 0, 0, mask);
		const twin = new FloatingSelection(doc, 0, 0, mirrorMaskX(mask, 8, 8));
		main.moveBy(1, 3);
		twin.moveBy(-1, 3);
		main.cancel(); // its snapshot predates the twin's lift
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});

	it('extractPair lifts both halves onto the new layer and clears both sources', () => {
		const doc = createDoc({ width: 8, height: 8, palette: DEFAULT_PALETTE, frameCount: 1 });
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[1 * 8 + 1] = 3;
		pixels[1 * 8 + 6] = 5;
		const mask = maskFromRects([{ x: 1, y: 1, w: 1, h: 1 }], 8, 8);
		const main = new FloatingSelection(doc, 0, 0, mask);
		const twin = new FloatingSelection(doc, 0, 0, mirrorMaskX(mask, 8, 8));
		const { layerPixels, sourceDiff } = main.extractPair(twin);

		expect(layerPixels[1 * 8 + 1]).toBe(3);
		expect(layerPixels[1 * 8 + 6]).toBe(5);
		expect(sourceDiff).not.toBeNull();
		main.cancel();
		expect(pixels[1 * 8 + 1]).toBe(3); // restored
		sourceDiff!.do(doc);
		expect(pixels[1 * 8 + 1]).toBe(0); // diff re-clears both
		expect(pixels[1 * 8 + 6]).toBe(0);
	});

	it('extraction clears retained pixels covered by moved artwork', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, maskFromRects([{ x: 1, y: 1, w: 1, h: 1 }], 8, 8));
		sel.moveBy(4, 4);
		const { sourceDiff } = sel.extract();
		sel.cancel();
		sourceDiff!.do(doc);
		expect(doc.frames[0].layers[0].pixels[5 * 8 + 5]).toBe(0);
	});

	it('a selection crossing the centerline lifts overlap pixels exactly once', () => {
		const doc = createDoc({ width: 8, height: 8, palette: DEFAULT_PALETTE, frameCount: 1 });
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[1 * 8 + 3] = 7;
		pixels[1 * 8 + 4] = 9;
		const before = pixels.slice();
		// mask covers (3,1)-(4,1); its mirror is the same two pixels
		const mask = maskFromRects([{ x: 3, y: 1, w: 2, h: 1 }], 8, 8);
		const main = new FloatingSelection(doc, 0, 0, mask);
		const twin = new FloatingSelection(doc, 0, 0, mirrorMaskX(mask, 8, 8));
		expect(main.commitPair(twin)).toBeNull(); // untransformed pair is a no-op
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});
});
