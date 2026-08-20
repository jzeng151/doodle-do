import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { DEFAULT_PALETTE } from '../core/palette';
import { CommandBus } from '../core/commands';
import { mergeDownBlockedReason, mergeDownCommand, sendLayerCommand } from './layers';

function testDoc(layerCount = 2) {
	const doc = createDoc({
		width: 4,
		height: 4,
		palette: DEFAULT_PALETTE,
		frameCount: 2,
		layerCount
	});
	// frame 0: lower has 3 at (0,0) and 5 at (1,0); upper has 7 at (1,0) and 9 at (2,0)
	doc.frames[0].layers[0].pixels[0] = 3;
	doc.frames[0].layers[0].pixels[1] = 5;
	doc.frames[0].layers[1].pixels[1] = 7;
	doc.frames[0].layers[1].pixels[2] = 9;
	return doc;
}

describe('mergeDownCommand', () => {
	it('composites upper over lower (nonzero wins) and deletes upper, as ONE undo step', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		bus.dispatch(mergeDownCommand(doc, 0, 1)!);

		const layers = doc.frames[0].layers;
		expect(layers.length).toBe(1);
		expect(layers[0].pixels[0]).toBe(3); // transparent upper leaves lower alone
		expect(layers[0].pixels[1]).toBe(7); // upper wins over lower
		expect(layers[0].pixels[2]).toBe(9); // upper onto empty
		expect(bus.undoDepth).toBe(1);

		bus.undo();
		expect(doc.frames[0].layers.length).toBe(2);
		expect(doc.frames[0].layers[0].pixels[1]).toBe(5); // lower restored exactly
		expect(doc.frames[0].layers[1].pixels[1]).toBe(7); // upper restored exactly
	});

	it('merging an all-transparent layer still deletes it and undoes cleanly', () => {
		const doc = testDoc();
		doc.frames[0].layers[1].pixels.fill(0);
		const bus = new CommandBus(doc);
		bus.dispatch(mergeDownCommand(doc, 0, 1)!);
		expect(doc.frames[0].layers.length).toBe(1);
		expect(doc.frames[0].layers[0].pixels[1]).toBe(5); // lower untouched
		bus.undo();
		expect(doc.frames[0].layers.length).toBe(2);
	});

	it('does not reveal pixels from a fully transparent upper layer', () => {
		const doc = testDoc();
		doc.frames[0].layers[1].opacity = 0;
		expect(mergeDownCommand(doc, 0, 1)).toBeNull();
	});

	it('refuses merges that cannot preserve locks or opacity', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].locked = true;
		expect(mergeDownCommand(doc, 0, 1)).toBeNull();
		doc.frames[0].layers[0].locked = false;
		doc.frames[0].layers[0].opacity = .5;
		expect(mergeDownCommand(doc, 0, 1)).toBeNull();
		expect(mergeDownBlockedReason(doc, 0, 1)).toMatch(/opacities/);
	});

	it('refuses when there is no layer below', () => {
		expect(mergeDownCommand(testDoc(), 0, 0)).toBeNull();
	});

	it('unlinks a shared destination before merging', () => {
		const doc = testDoc();
		doc.frames[1].layers[0].pixels = doc.frames[0].layers[0].pixels;
		doc.frames[0].layers[0].linkId = doc.frames[1].layers[0].linkId = 'linked';
		const peerBefore = doc.frames[1].layers[0].pixels.slice();
		const bus = new CommandBus(doc);
		bus.dispatch(mergeDownCommand(doc, 0, 1)!);
		expect(doc.frames[1].layers[0].pixels).toEqual(peerBefore);
		expect(doc.frames[0].layers[0].pixels).not.toBe(doc.frames[1].layers[0].pixels);
		bus.undo();
		expect(doc.frames[0].layers[0].pixels).toBe(doc.frames[1].layers[0].pixels);
	});
});

describe('sendLayerCommand', () => {
	it('copy clones the layer onto the top of the target frame', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		bus.dispatch(sendLayerCommand(doc, 0, 1, 1, false)!);

		expect(doc.frames[0].layers.length).toBe(2); // source unchanged
		expect(doc.frames[1].layers.length).toBe(3);
		const copied = doc.frames[1].layers[2];
		expect(copied.pixels[1]).toBe(7);
		doc.frames[0].layers[1].pixels[1] = 6; // a clone, not a shared buffer
		expect(copied.pixels[1]).toBe(7);

		expect(bus.undoDepth).toBe(1);
		bus.undo();
		expect(doc.frames[1].layers.length).toBe(2);
	});

	it('preserves lock and opacity metadata when copying', () => {
		const doc = testDoc();
		doc.frames[0].layers[1].locked = true;
		doc.frames[0].layers[1].opacity = .4;
		new CommandBus(doc).dispatch(sendLayerCommand(doc, 0, 1, 1, false)!);
		expect(doc.frames[1].layers[2]).toMatchObject({ locked: true, opacity: .4 });
	});

	it('move also removes the source layer; one undo restores both frames', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		bus.dispatch(sendLayerCommand(doc, 0, 1, 1, true)!);

		expect(doc.frames[0].layers.length).toBe(1);
		expect(doc.frames[1].layers.length).toBe(3);
		bus.undo();
		expect(doc.frames[0].layers.length).toBe(2);
		expect(doc.frames[0].layers[1].pixels[2]).toBe(9);
		expect(doc.frames[1].layers.length).toBe(2);
	});

	it('refuses the same frame, a full target, and a move that would empty the source', () => {
		expect(sendLayerCommand(testDoc(), 0, 1, 0, false)).toBeNull();
		expect(sendLayerCommand(testDoc(8), 0, 1, 1, false)).toBeNull(); // target at MAX_LAYERS
		const doc = testDoc();
		doc.frames[0].layers.pop();
		expect(sendLayerCommand(doc, 0, 0, 1, true)).toBeNull(); // last layer can't move away
	});
});
