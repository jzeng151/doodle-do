import { describe, expect, it } from 'vitest';
import { createDoc, resizePixels } from './document';
import { buildLut, colorRamp, packColor, DEFAULT_PALETTE, sortPaletteRange } from './palette';
import { CommandBus, CompositeCommand, PixelDiffCommand, UNDO_MAX_COMMANDS } from './commands';
import { LayerAddCommand, ResizeCanvasCommand } from './structural';
import { StrokeBuilder } from '../tools/pencil';

function testDoc(width = 8, height = 8) {
	return createDoc({ width, height, palette: DEFAULT_PALETTE, frameCount: 2, layerCount: 2 });
}

describe('document', () => {
	it('creates frames and layers with zeroed (transparent) pixels', () => {
		const doc = testDoc();
		expect(doc.frames).toHaveLength(2);
		expect(doc.frames[0].layers).toHaveLength(2);
		expect(doc.frames[0].layers[0].pixels).toHaveLength(64);
		expect(doc.frames[0].layers[0].pixels.every((p) => p === 0)).toBe(true);
	});

	it('rejects out-of-range canvas sizes', () => {
		expect(() => createDoc({ width: 513, height: 8, palette: [] })).toThrow();
		expect(() => createDoc({ width: 0, height: 8, palette: [] })).toThrow();
	});
});

describe('canvas resize', () => {
	it('crop/extend keeps pixels top-left and pads new area with transparent', () => {
		const src = new Uint8Array([1, 2, 3, 4]); // 2×2
		expect(Array.from(resizePixels(src, 2, 2, 3, 3, 'crop'))).toEqual([1, 2, 0, 3, 4, 0, 0, 0, 0]);
		expect(Array.from(resizePixels(src, 2, 2, 1, 1, 'crop'))).toEqual([1]); // shrink crops
	});

	it('scale resamples nearest-neighbor and preserves palette indices', () => {
		const src = new Uint8Array([1, 2, 3, 4]); // 2×2
		// 2× up: each source pixel becomes a 2×2 block, values unchanged
		expect(Array.from(resizePixels(src, 2, 2, 4, 4, 'scale'))).toEqual([
			1, 1, 2, 2, 1, 1, 2, 2, 3, 3, 4, 4, 3, 3, 4, 4
		]);
	});

	it('command resizes every layer of every frame and updates meta', () => {
		const doc = createDoc({ width: 2, height: 2, palette: DEFAULT_PALETTE, frameCount: 2, layerCount: 2 });
		doc.frames[0].layers[0].pixels.set([1, 2, 3, 4]);
		doc.frames[1].layers[1].pixels.set([4, 3, 2, 1]);
		new CommandBus(doc).dispatch(new ResizeCanvasCommand(doc, 2, 2, 3, 3, 'crop'));
		expect([doc.meta.width, doc.meta.height]).toEqual([3, 3]);
		expect(doc.frames[0].layers[0].pixels).toHaveLength(9);
		expect(Array.from(doc.frames[0].layers[0].pixels)).toEqual([1, 2, 0, 3, 4, 0, 0, 0, 0]);
		expect(Array.from(doc.frames[1].layers[1].pixels)).toEqual([4, 3, 0, 2, 1, 0, 0, 0, 0]);
	});

	it('undo restores exact pixels and dimensions even when shrink dropped data', () => {
		const doc = createDoc({ width: 2, height: 2, palette: DEFAULT_PALETTE, frameCount: 1, layerCount: 1 });
		doc.frames[0].layers[0].pixels.set([1, 2, 3, 4]);
		const bus = new CommandBus(doc);
		bus.dispatch(new ResizeCanvasCommand(doc, 2, 2, 1, 1, 'crop'));
		expect(Array.from(doc.frames[0].layers[0].pixels)).toEqual([1]);
		bus.undo();
		expect([doc.meta.width, doc.meta.height]).toEqual([2, 2]);
		expect(Array.from(doc.frames[0].layers[0].pixels)).toEqual([1, 2, 3, 4]);
	});

	it('preserves shared linked-cel buffers through resize and undo', () => {
		const doc = createDoc({ width: 2, height: 2, palette: DEFAULT_PALETTE, frameCount: 2 });
		doc.frames[1].layers[0].pixels = doc.frames[0].layers[0].pixels;
		const bus = new CommandBus(doc);
		bus.dispatch(new ResizeCanvasCommand(doc, 2, 2, 4, 4, 'scale'));
		expect(doc.frames[0].layers[0].pixels).toBe(doc.frames[1].layers[0].pixels);
		bus.undo();
		expect(doc.frames[0].layers[0].pixels).toBe(doc.frames[1].layers[0].pixels);
	});
});

describe('palette LUT', () => {
	it('maps 0 to transparent and n to palette[n-1] as LE RGBA', () => {
		const lut = buildLut(['#ff0000', '#00ff00']);
		expect(lut[0]).toBe(0);
		expect(lut[1] >>> 0).toBe(0xff0000ff); // A=ff B=00 G=00 R=ff
		expect(lut[2] >>> 0).toBe(0xff00ff00);
	});

	it('packColor is opaque LE RGBA', () => {
		expect(packColor('#102030') >>> 0).toBe(0xff302010);
	});
});

describe('palette ranges', () => {
	it('generates an inclusive RGB ramp', () => {
		expect(colorRamp('#000000', '#ffffff', 3)).toEqual(['#000000', '#808080', '#ffffff']);
	});

	it('sorts entries while remapping indices to preserve artwork colors', () => {
		const doc = createDoc({ width: 3, height: 1, palette: ['#ffffff', '#000000', '#ff0000'] });
		doc.frames[0].layers[0].pixels.set([1, 2, 3]);
		const { palette, map, moved } = sortPaletteRange(doc, 0, 2, 'luminance');
		expect(palette).toEqual(['#000000', '#ff0000', '#ffffff']);
		expect([...doc.frames[0].layers[0].pixels]).toEqual([1, 2, 3]);
		expect(map.get(1)).toBe(3);
		expect(moved).toBe(true);
		expect(sortPaletteRange({ ...doc, palette }, 0, 2, 'luminance').moved).toBe(false);
	});
});

describe('StrokeBuilder (B2 coalescing)', () => {
	it('a drag becomes one command; undo restores in a single step', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const stroke = new StrokeBuilder(doc, 0, 0, 3);
		stroke.begin(1, 1);
		stroke.moveTo(4, 1);
		stroke.moveTo(4, 4);
		const cmd = stroke.end()!;
		bus.dispatch(cmd, { applied: true });

		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 1]).toBe(3);
		expect(pixels[1 * 8 + 4]).toBe(3);
		expect(pixels[4 * 8 + 4]).toBe(3);
		expect(bus.undoDepth).toBe(1);

		bus.undo();
		expect(pixels.every((p) => p === 0)).toBe(true);
		bus.redo();
		expect(pixels[4 * 8 + 4]).toBe(3);
	});

	it('optimistic mutation means dispatch({applied:true}) does not double-apply', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 5);
		stroke.begin(2, 2);
		// pixel already set before the command is even built
		expect(doc.frames[0].layers[0].pixels[2 * 8 + 2]).toBe(5);
		const cmd = stroke.end()!;
		expect(cmd.pixelCount).toBe(1);
	});

	it('records the pre-stroke value even when a pixel is hit twice', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels[2 * 8 + 2] = 7;
		const stroke = new StrokeBuilder(doc, 0, 0, 3);
		stroke.begin(2, 2);
		stroke.moveTo(3, 2);
		stroke.moveTo(2, 2); // back over the same pixel
		const cmd = stroke.end()!;
		cmd.undo(doc);
		expect(doc.frames[0].layers[0].pixels[2 * 8 + 2]).toBe(7);
	});

	it('drops no-op pixels; painting same color over itself yields no command', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels.fill(3);
		const stroke = new StrokeBuilder(doc, 0, 0, 3);
		stroke.begin(1, 1);
		stroke.moveTo(5, 5);
		expect(stroke.end()).toBeNull();
	});

	it('clips to canvas bounds', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 3);
		stroke.begin(0, 0); // 3px brush at corner
		const cmd = stroke.end()!;
		expect(cmd.pixelCount).toBe(4); // 2×2 survives clipping
	});
});

describe('CommandBus (B4 budget)', () => {
	function strokeCmd(doc: ReturnType<typeof testDoc>, index: number, value: number) {
		return new PixelDiffCommand(
			'pencil-stroke',
			0,
			0,
			new Uint32Array([index]),
			new Uint8Array([doc.frames[0].layers[0].pixels[index]]),
			new Uint8Array([value]),
			doc.meta.width
		);
	}

	it('dispatch clears the redo stack', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		bus.dispatch(strokeCmd(doc, 0, 1));
		bus.dispatch(strokeCmd(doc, 1, 2));
		bus.undo();
		expect(bus.canRedo).toBe(true);
		bus.dispatch(strokeCmd(doc, 2, 3));
		expect(bus.canRedo).toBe(false);
	});

	it('evicts oldest beyond 200 commands', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		for (let i = 0; i < UNDO_MAX_COMMANDS + 50; i++) {
			bus.dispatch(strokeCmd(doc, i % 64, (i % 15) + 1));
		}
		expect(bus.undoDepth).toBe(UNDO_MAX_COMMANDS);
	});

	it('notifies change listeners with the command dirty rect', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		let region: unknown = null;
		bus.onChange((r) => (region = r));
		bus.dispatch(strokeCmd(doc, 2 * 8 + 3, 1));
		expect(region).toEqual({ frame: 0, rect: { x: 3, y: 2, w: 1, h: 1 } });
	});

	it('fires commit listeners on dispatch, undo, and redo', () => {
		const doc = testDoc();
		const bus = new CommandBus(doc);
		const actions: string[] = [];
		bus.onCommit((_command, action) => actions.push(action));
		bus.dispatch(strokeCmd(doc, 0, 1));
		bus.undo();
		bus.redo();
		expect(actions).toEqual(['dispatch', 'undo', 'redo']);
	});
});

describe('CompositeCommand', () => {
	it('does children in order, undoes in reverse, as ONE bus entry', () => {
		const doc = createDoc({ width: 4, height: 4, palette: DEFAULT_PALETTE, frameCount: 1 });
		const bus = new CommandBus(doc);
		doc.frames[0].layers[0].pixels[5] = 3;
		const clear = new PixelDiffCommand(
			'extract-clear',
			0,
			0,
			new Uint32Array([5]),
			new Uint8Array([3]),
			new Uint8Array([0]),
			4
		);
		const lifted = new Uint8Array(16);
		lifted[5] = 3;
		const add = new LayerAddCommand(0, 1, { name: 'Layer 2', visible: true, pixels: lifted });
		bus.dispatch(new CompositeCommand('extract-layer', [clear, add]));

		expect(doc.frames[0].layers[0].pixels[5]).toBe(0);
		expect(doc.frames[0].layers.length).toBe(2);
		expect(bus.undoDepth).toBe(1);
		bus.undo(); // one step reverts both mutations
		expect(doc.frames[0].layers.length).toBe(1);
		expect(doc.frames[0].layers[0].pixels[5]).toBe(3);
	});

	it('sums byteSize and unions dirty regions', () => {
		const doc = createDoc({ width: 4, height: 4, palette: DEFAULT_PALETTE, frameCount: 2 });
		const diff = (frame: number) =>
			new PixelDiffCommand(
				'x',
				frame,
				0,
				new Uint32Array([0]),
				new Uint8Array([0]),
				new Uint8Array([1]),
				4
			);
		const sameFrame = new CompositeCommand('k', [
			diff(0),
			new LayerAddCommand(0, 1, { name: 'L', visible: true, pixels: new Uint8Array(16) })
		]);
		expect(sameFrame.byteSize).toBeGreaterThanOrEqual(diff(0).byteSize);
		expect(sameFrame.dirty()).toEqual({ frame: 0, rect: null });
		const crossFrame = new CompositeCommand('k', [diff(0), diff(1)]);
		expect(crossFrame.dirty()).toEqual({ frame: null, rect: null });
		void doc;
	});
});
