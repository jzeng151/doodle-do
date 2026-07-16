import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { DEFAULT_PALETTE } from '../core/palette';
import { floodFill, floodRegion } from './fill';
import { samplePixel } from './sample';
import { FlipLayerCommand } from './flip';
import { StrokeBuilder } from './pencil';

function testDoc(width = 8, height = 8) {
	return createDoc({ width, height, palette: DEFAULT_PALETTE, frameCount: 1, layerCount: 2 });
}

describe('floodFill (B3)', () => {
	it('fills a bounded region and stores the pixel set for undo', () => {
		const doc = testDoc();
		const pixels = doc.frames[0].layers[0].pixels;
		// draw a 3×3 box outline of color 2 around (2..4, 2..4)
		for (let i = 2; i <= 4; i++) {
			pixels[2 * 8 + i] = 2;
			pixels[4 * 8 + i] = 2;
			pixels[i * 8 + 2] = 2;
			pixels[i * 8 + 4] = 2;
		}
		const cmd = floodFill(doc, 0, 0, 3, 3, 5)!;
		cmd.do(doc);
		expect(pixels[3 * 8 + 3]).toBe(5); // inside filled
		expect(pixels[0]).toBe(0); // outside untouched (wall blocks)
		expect(cmd.pixelCount).toBe(1); // only the single interior pixel
		cmd.undo(doc);
		expect(pixels[3 * 8 + 3]).toBe(0);
	});

	it('fill on open canvas covers everything connected', () => {
		const doc = testDoc(4, 4);
		const cmd = floodFill(doc, 0, 0, 0, 0, 3)!;
		expect(cmd.pixelCount).toBe(16);
	});

	it('no-ops when target already has the color or point is out of bounds', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels.fill(3);
		expect(floodFill(doc, 0, 0, 1, 1, 3)).toBeNull();
		expect(floodFill(doc, 0, 0, -1, 0, 5)).toBeNull();
		expect(floodFill(doc, 0, 0, 8, 0, 5)).toBeNull();
	});
});

describe('floodRegion (wand)', () => {
	it('returns only the clicked contiguous same-color region, 4-connected', () => {
		const doc = testDoc();
		const pixels = doc.frames[0].layers[0].pixels;
		// two blobs of color 2: an L at (1,1)-(1,2)-(2,2), and a diagonal
		// neighbor at (3,3) that must NOT connect; a different color at (2,1)
		pixels[1 * 8 + 1] = 2;
		pixels[2 * 8 + 1] = 2;
		pixels[2 * 8 + 2] = 2;
		pixels[3 * 8 + 3] = 2; // diagonal from (2,2)
		pixels[1 * 8 + 2] = 4; // different color
		const region = floodRegion(pixels, 8, 8, 1, 1);
		expect([...region].sort((a, b) => a - b)).toEqual([1 * 8 + 1, 2 * 8 + 1, 2 * 8 + 2]);
	});

	it('selects a contiguous transparent region too', () => {
		const doc = testDoc(4, 4);
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[5] = 3; // (1,1) colored; the rest transparent and connected
		const region = floodRegion(pixels, 4, 4, 0, 0);
		expect(region.length).toBe(15);
		expect(region).not.toContain(5);
	});
});

describe('samplePixel', () => {
	it('returns the topmost visible non-transparent value', () => {
		const doc = testDoc();
		doc.frames[0].layers[0].pixels[9] = 2; // bottom
		doc.frames[0].layers[1].pixels[9] = 7; // top
		expect(samplePixel(doc, 0, 1, 1)).toBe(7);
		doc.frames[0].layers[1].visible = false;
		expect(samplePixel(doc, 0, 1, 1)).toBe(2);
		expect(samplePixel(doc, 0, 0, 0)).toBe(0);
		expect(samplePixel(doc, 0, -1, 0)).toBe(0);
	});
});

describe('FlipLayerCommand', () => {
	it('horizontal flip mirrors and undo restores', () => {
		const doc = testDoc(4, 4);
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[0] = 5; // top-left
		const cmd = new FlipLayerCommand(0, 0, 'horizontal');
		cmd.do(doc);
		expect(pixels[0]).toBe(0);
		expect(pixels[3]).toBe(5); // now top-right
		cmd.undo(doc);
		expect(pixels[0]).toBe(5);
	});

	it('vertical flip mirrors rows', () => {
		const doc = testDoc(4, 4);
		const pixels = doc.frames[0].layers[0].pixels;
		pixels[1] = 5; // row 0
		new FlipLayerCommand(0, 0, 'vertical').do(doc);
		expect(pixels[3 * 4 + 1]).toBe(5); // row 3
	});
});

describe('mirror-draw', () => {
	it('stamps the x-mirrored pixel too', () => {
		const doc = testDoc(8, 8);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true);
		stroke.begin(1, 2);
		const cmd = stroke.end()!;
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[2 * 8 + 1]).toBe(3);
		expect(pixels[2 * 8 + 6]).toBe(3); // width-1-x = 6
		expect(cmd.pixelCount).toBe(2);
	});

	it('center column with mirror does not double-record', () => {
		const doc = testDoc(7, 7); // odd width, center x = 3 mirrors to itself
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true);
		stroke.begin(3, 3);
		expect(stroke.end()!.pixelCount).toBe(1);
	});
});
