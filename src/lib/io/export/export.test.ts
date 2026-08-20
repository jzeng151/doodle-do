import { describe, expect, it } from 'vitest';
import { createDoc } from '../../core/document';
import { DEFAULT_PALETTE } from '../../core/palette';
import { compositePixelIndex, flattenFrameIndices } from '../../core/flatten';
import { doodledoJson, sheetLayout, texturePackerJson } from './spritesheet';

describe('flattenFrameIndices', () => {
	it('topmost visible non-transparent wins; hidden layers skipped', () => {
		const doc = createDoc({ width: 2, height: 1, palette: DEFAULT_PALETTE, layerCount: 3 });
		doc.frames[0].layers[0].pixels[0] = 1;
		doc.frames[0].layers[1].pixels[0] = 2;
		doc.frames[0].layers[2].pixels[1] = 3;
		doc.frames[0].layers[1].visible = false;
		expect(Array.from(flattenFrameIndices(doc, 0))).toEqual([1, 3]);
	});

	it('accumulates translucent layers before applying GIF transparency', () => {
		const doc = createDoc({ width: 1, height: 1, palette: DEFAULT_PALETTE, layerCount: 2 });
		for (const layer of doc.frames[0].layers) {
			layer.pixels[0] = 1;
			layer.opacity = .4;
		}
		expect(flattenFrameIndices(doc, 0)[0]).toBe(1);
	});

	it('quantizes translucent blends to the nearest visible palette color', () => {
		const doc = createDoc({ width: 1, height: 1, palette: ['#ff0000', '#0000ff'], layerCount: 2 });
		doc.frames[0].layers[0].pixels[0] = 1;
		doc.frames[0].layers[1].pixels[0] = 2;
		doc.frames[0].layers[1].opacity = .05;
		expect(flattenFrameIndices(doc, 0)[0]).toBe(1);
	});

	it('reuses composited-color quantization', () => {
		const doc = createDoc({ width: 2, height: 1, palette: ['#ff0000', '#0000ff'], layerCount: 2 });
		for (const layer of doc.frames[0].layers) layer.pixels.fill(1);
		doc.frames[0].layers[1].pixels.fill(2);
		doc.frames[0].layers[1].opacity = .5;
		const quantized = new Map<number, number>();
		expect(compositePixelIndex(doc.frames[0].layers, 0, doc.palette, undefined, 128, quantized)).toBe(1);
		expect(compositePixelIndex(doc.frames[0].layers, 1, doc.palette, undefined, 128, quantized)).toBe(1);
		expect(quantized.size).toBe(1);
	});
});

describe('sheetLayout', () => {
	it('packs frames into one horizontal strip', () => {
		const layout = sheetLayout(4, 32, 32);
		expect(layout).toMatchObject({ columns: 4, rows: 1, width: 128, height: 32 });
		expect(layout.rects[3]).toEqual({ x: 96, y: 0, w: 32, h: 32 });
	});

	it('handles non-square counts without overlap', () => {
		const layout = sheetLayout(5, 16, 16);
		expect(layout).toMatchObject({ columns: 5, rows: 1, width: 80, height: 16 });
		expect(layout.rects).toHaveLength(5);
		const keys = new Set(layout.rects.map((r) => `${r.x},${r.y}`));
		expect(keys.size).toBe(5);
		for (const r of layout.rects) {
			expect(r.x + r.w).toBeLessThanOrEqual(layout.width);
			expect(r.y + r.h).toBeLessThanOrEqual(layout.height);
		}
	});
});

describe('export metadata schemas', () => {
	const doc = createDoc({
		name: 'strut',
		width: 32,
		height: 32,
		fps: 8,
		palette: DEFAULT_PALETTE,
		frameCount: 4
	});
	doc.frames[2].durationMs = 250;
	doc.meta.tags = [{ name: 'walk', from: 0, to: 3, direction: 'ping-pong', repeats: 2 }];
	const layout = sheetLayout(4, 32, 32);

	it('TexturePacker JSON-hash has the fields Phaser expects', () => {
		const parsed = JSON.parse(texturePackerJson(doc, layout, 'strut.png'));
		expect(Object.keys(parsed.frames)).toHaveLength(4);
		const frame = parsed.frames['frame-0'];
		expect(frame.frame).toEqual({ x: 0, y: 0, w: 32, h: 32 });
		expect(frame.rotated).toBe(false);
		expect(frame.trimmed).toBe(false);
		expect(frame.sourceSize).toEqual({ w: 32, h: 32 });
		expect(parsed.meta.image).toBe('strut.png');
		expect(parsed.meta.size).toEqual({ w: 128, h: 32 });
		expect(parsed.meta.scale).toBe('1');
		expect(parsed.meta.frameTags).toEqual([
			{ name: 'walk', from: 0, to: 3, direction: 'pingpong', repeat: 2 }
		]);
	});

	it('doodledo.json carries fps and per-frame durations', () => {
		const parsed = JSON.parse(doodledoJson(doc, layout, 'strut.png'));
		expect(parsed.format).toBe('doodledo-sheet');
		expect(parsed.fps).toBe(8);
		expect(parsed.frames[0].durationMs).toBe(125); // 1000/8
		expect(parsed.frames[2].durationMs).toBe(250); // per-frame override
		expect(parsed.frames[3]).toMatchObject({ x: 96, y: 0, w: 32, h: 32 });
		expect(parsed.animations).toEqual(doc.meta.tags);
	});
});
