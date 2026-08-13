import { describe, expect, it } from 'vitest';
import { createDoc, createLayer } from './document';
import { DEFAULT_PALETTE } from './palette';
import { CommandBus } from './commands';
import {
	FpsCommand,
	FrameAddCommand,
	FrameDeleteCommand,
	FrameDurationCommand,
	FrameReorderCommand,
	LayerAddCommand,
	LayerDeleteCommand,
	LayerReorderCommand,
	LayerVisibilityCommand,
	PaletteAddCommand,
	PaletteRemoveCommand,
	PaletteRemapCommand,
	PaletteReplaceCommand,
	PaletteSwapCommand
} from './structural';

function testDoc() {
	return createDoc({ width: 4, height: 4, palette: [...DEFAULT_PALETTE], frameCount: 3, layerCount: 2 });
}

describe('frame commands', () => {
	it('add/delete/reorder round-trip through undo', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		doc.frames[2].layers[0].pixels[0] = 9; // marker on frame 3

		bus.dispatch(new FrameAddCommand(1, { layers: [createLayer(doc, 'Layer 1')] }));
		expect(doc.frames).toHaveLength(4);
		expect(doc.frames[3].layers[0].pixels[0]).toBe(9);

		bus.dispatch(new FrameReorderCommand(3, 0));
		expect(doc.frames[0].layers[0].pixels[0]).toBe(9);

		bus.dispatch(new FrameDeleteCommand(doc, 0));
		expect(doc.frames).toHaveLength(3);
		expect(doc.frames[0].layers[0].pixels[0]).toBe(0);

		bus.undo(); // delete
		bus.undo(); // reorder
		bus.undo(); // add
		expect(doc.frames).toHaveLength(3);
		expect(doc.frames[2].layers[0].pixels[0]).toBe(9);
	});

	it('refuses to delete the last frame', () => {
		const doc = createDoc({ width: 4, height: 4, palette: [], frameCount: 1 });
		expect(() => new FrameDeleteCommand(doc, 0)).toThrow();
	});

	it('per-frame duration and fps commands undo cleanly', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		bus.dispatch(new FrameDurationCommand(0, undefined, 250));
		expect(doc.frames[0].durationMs).toBe(250);
		bus.dispatch(new FpsCommand(8, 12));
		expect(doc.meta.fps).toBe(12);
		bus.undo();
		bus.undo();
		expect(doc.meta.fps).toBe(8);
		expect(doc.frames[0].durationMs).toBeUndefined();
	});
});

describe('layer commands', () => {
	it('add/delete/reorder/visibility round-trip', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		doc.frames[0].layers[1].pixels[5] = 4; // marker on top layer

		bus.dispatch(new LayerAddCommand(0, 2, createLayer(doc, 'Layer 3')));
		expect(doc.frames[0].layers).toHaveLength(3);

		bus.dispatch(new LayerReorderCommand(0, 1, 2));
		expect(doc.frames[0].layers[2].pixels[5]).toBe(4);

		bus.dispatch(new LayerVisibilityCommand(0, 2, false));
		expect(doc.frames[0].layers[2].visible).toBe(false);

		bus.dispatch(new LayerDeleteCommand(doc, 0, 2));
		expect(doc.frames[0].layers).toHaveLength(2);

		bus.undo();
		bus.undo();
		bus.undo();
		bus.undo();
		expect(doc.frames[0].layers).toHaveLength(2);
		expect(doc.frames[0].layers[1].pixels[5]).toBe(4);
		expect(doc.frames[0].layers[1].visible).toBe(true);
	});

	it('refuses to delete the last layer', () => {
		const doc = createDoc({ width: 4, height: 4, palette: [], layerCount: 1 });
		expect(() => new LayerDeleteCommand(doc, 0, 0)).toThrow();
	});
});

describe('palette commands', () => {
	it('remaps palette indices in place and preserves linked buffer identity', () => {
		const doc = testDoc();
		const pixels = doc.frames[0].layers[0].pixels;
		doc.frames[1].layers[0].pixels = pixels;
		pixels[0] = 3;
		const command = new PaletteRemapCommand(doc.palette, [doc.palette[0], doc.palette[2]], new Map([[1, 1], [3, 2]]));
		command.do(doc);
		expect(pixels[0]).toBe(2);
		expect(doc.frames[1].layers[0].pixels).toBe(pixels);
		command.undo(doc);
		expect(pixels[0]).toBe(3);
	});

	it('undoes duplicate-color remaps to the used slot', () => {
		const doc = createDoc({ width: 1, height: 1, palette: ['#111111', '#222222', '#111111'] });
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[0] = 3;
		const command = new PaletteRemapCommand(doc.palette, ['#111111'], new Map([[3, 1], [1, 1]]));
		command.do(doc);
		command.undo(doc);
		expect(pixels[0]).toBe(3);
	});

	it('replaces only the palette and undoes compactly', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const cmd = new PaletteReplaceCommand(doc.palette, ['#000000']);
		expect(cmd.byteSize).toBeLessThan(512);
		bus.dispatch(cmd);
		expect(doc.palette).toEqual(['#000000']);
		bus.undo();
		expect(doc.palette).toEqual(DEFAULT_PALETTE);
	});

	it('add and swap undo cleanly and mark the palette dirty', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		bus.dispatch(new PaletteAddCommand('#123456'));
		expect(doc.palette).toHaveLength(17);
		const swap = new PaletteSwapCommand(0, doc.palette[0], '#abcdef');
		expect(swap.dirty().palette).toBe(true);
		bus.dispatch(swap);
		expect(doc.palette[0]).toBe('#abcdef');
		bus.undo();
		bus.undo();
		expect(doc.palette).toHaveLength(16);
		expect(doc.palette[0]).toBe(DEFAULT_PALETTE[0]);
	});

	it('remove remaps used pixels and shifts higher indices (target above removed)', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const pixels = doc.frames[1].layers[0].pixels;
		pixels[0] = 3; // uses palette[2] — the entry we remove
		pixels[1] = 5; // uses palette[4] — must shift down to 4
		pixels[2] = 2; // uses palette[1] — untouched

		bus.dispatch(new PaletteRemoveCommand(doc, 2, 7)); // remap to palette[7]
		expect(doc.palette).toHaveLength(15);
		expect(pixels[0]).toBe(7); // pre-removal value 8, shifted to 7
		expect(pixels[1]).toBe(4);
		expect(pixels[2]).toBe(2);

		bus.undo();
		expect(doc.palette).toHaveLength(16);
		expect(doc.palette[2]).toBe(DEFAULT_PALETTE[2]);
		expect(pixels[0]).toBe(3);
		expect(pixels[1]).toBe(5);
		expect(pixels[2]).toBe(2);
	});

	it('remove with target below the removed index', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const pixels = doc.frames[0].layers[1].pixels;
		pixels[0] = 6; // uses palette[5], remove it, remap to palette[1]

		bus.dispatch(new PaletteRemoveCommand(doc, 5, 1));
		expect(pixels[0]).toBe(2); // value 2 is below the removed value — no shift
		bus.undo();
		expect(pixels[0]).toBe(6);
	});
});
