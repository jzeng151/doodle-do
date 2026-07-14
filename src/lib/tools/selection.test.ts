import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { DEFAULT_PALETTE } from '../core/palette';
import { CommandBus } from '../core/commands';
import { FloatingSelection, clampRect } from './selection';

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

describe('FloatingSelection (B5)', () => {
	it('lift clears the source and captures the buffer', () => {
		const doc = testDoc();
		const sel = new FloatingSelection(doc, 0, 0, { x: 1, y: 1, w: 2, h: 2 });
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 1]).toBe(0); // source cleared
		expect(Array.from(sel.buffer)).toEqual([3, 3, 3, 3]);
	});

	it('lift + move + stamp collapses into ONE undoable command', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const sel = new FloatingSelection(doc, 0, 0, { x: 1, y: 1, w: 2, h: 2 });
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
		const sel = new FloatingSelection(doc, 0, 0, { x: 1, y: 1, w: 2, h: 2 });
		expect(sel.commit()).toBeNull();
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});

	it('flip applies to the buffer and lands flipped', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels[1 * 8 + 2] = 7; // make the block asymmetric
		const sel = new FloatingSelection(doc, 0, 0, { x: 1, y: 1, w: 2, h: 2 });
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
		const sel = new FloatingSelection(doc, 0, 0, { x: 1, y: 1, w: 2, h: 2 });
		sel.moveBy(4, 4);
		sel.flip('vertical');
		sel.cancel();
		expect(doc.frames[0].layers[0].pixels).toEqual(before);
	});

	it('transparent buffer pixels do not punch holes at the destination', () => {
		const doc = testDoc();
		// select a 3×3 area whose corner overlaps the block — buffer has 0s
		const sel = new FloatingSelection(doc, 0, 0, { x: 2, y: 2, w: 3, h: 3 });
		sel.moveBy(3, 3); // drop it over the bystander at (5,5)
		sel.commit();
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[5 * 8 + 5]).toBe(3); // block pixel landed on it
		expect(pixels[7 * 8 + 7]).toBe(0); // transparent part stayed transparent
	});

	it('off-canvas moves clip on stamp; the rest is dropped', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const sel = new FloatingSelection(doc, 0, 0, { x: 1, y: 1, w: 2, h: 2 });
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
