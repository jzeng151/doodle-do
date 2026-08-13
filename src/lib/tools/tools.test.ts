import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { DEFAULT_PALETTE } from '../core/palette';
import { floodFill, floodRegion } from './fill';
import { samplePixel } from './sample';
import { FlipLayerCommand } from './flip';
import { constrainLineEndpoint, StrokeBuilder } from './pencil';
import { boundedTileEndpoint, ellipsePoints, rectanglePoints } from './shapes';
import { replaceColorCommand } from './replace';
import { ditherValue } from './dither';
import { flipStamp, rotateStamp, stampCommand } from './stamp';

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

	it('keeps duplicate palette indices distinct at zero tolerance', () => {
		const doc = createDoc({ width: 2, height: 1, palette: ['#112233', '#112233'] });
		doc.frames[0].layers[0].pixels.set([1, 2]);
		expect(floodFill(doc, 0, 0, 0, 0, 2)!.pixelCount).toBe(1);
	});

	it('fills similar palette colors within tolerance', () => {
		const doc = testDoc(3, 1);
		doc.palette[0] = '#101010';
		doc.palette[1] = '#181818';
		const pixels = doc.frames[0].layers[0].pixels;
		pixels.set([1, 2, 3]);
		const cmd = floodFill(doc, 0, 0, 0, 0, 4, 10)!;
		expect(cmd.pixelCount).toBe(2);
		cmd.do(doc);
		expect([...pixels]).toEqual([4, 4, 3]);
	});

	it('fills all matching regions when contiguous is off', () => {
		const doc = testDoc(4, 1);
		const pixels = doc.frames[0].layers[0].pixels;
		pixels.set([1, 2, 1, 2]);
		const cmd = floodFill(doc, 0, 0, 0, 0, 3, 0, false)!;
		cmd.do(doc);
		expect([...pixels]).toEqual([3, 2, 3, 2]);
	});

	it('normalizes nearby colors to the clicked replacement without recording unchanged pixels', () => {
		const doc = testDoc(3, 1);
		doc.palette[0] = '#101010';
		doc.palette[1] = '#181818';
		const pixels = doc.frames[0].layers[0].pixels;
		pixels.set([1, 2, 1]);
		const cmd = floodFill(doc, 0, 0, 0, 0, 1, 10)!;
		expect(cmd.pixelCount).toBe(1);
		cmd.do(doc);
		expect([...pixels]).toEqual([1, 1, 1]);
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

	it('supports movable X axes and combined X/Y symmetry', () => {
		const doc = testDoc(8, 8);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', false, undefined, 0, 2, true, 2);
		stroke.begin(1, 1);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([[1, 1], [3, 1], [1, 3], [3, 3]].every(([x, y]) => pixels[y * 8 + x] === 3)).toBe(true);
	});

	it('reflects even brush footprints without a one-pixel shift', () => {
		const doc = testDoc(8, 8);
		new StrokeBuilder(doc, 0, 0, 3, 2, true, 'pencil-stroke', false, undefined, 0, 3.5, true, 3.5).begin(2, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([[1, 1], [2, 2], [5, 1], [6, 2], [1, 5], [2, 6], [5, 5], [6, 6]].every(([x, y]) => pixels[y * 8 + x] === 3)).toBe(true);
		expect(pixels[4 * 8 + 4]).toBe(0);
	});

	it('samples even mirrored brushes from the source footprint', () => {
		const doc = testDoc(8, 8);
		new StrokeBuilder(doc, 0, 0, 3, 2, true, 'pencil-stroke', false, 4, 2, 3.5).begin(2, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[2 * 8 + 5]).toBe(pixels[2 * 8 + 2]);
		expect(pixels[2 * 8 + 6]).toBe(pixels[2 * 8 + 1]);
	});

	it('center column with mirror does not double-record', () => {
		const doc = testDoc(7, 7); // odd width, center x = 3 mirrors to itself
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true);
		stroke.begin(3, 3);
		expect(stroke.end()!.pixelCount).toBe(1);
	});

	it('mirrors dither colors with the stroke geometry', () => {
		const doc = testDoc(8, 8);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', false, 4, 2);
		stroke.begin(1, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[2 * 8 + 6]).toBe(pixels[2 * 8 + 1]);
	});

	it('preserves dither phase across custom X and Y axes', () => {
		const xDoc = testDoc(8, 8);
		new StrokeBuilder(xDoc, 0, 0, 3, 1, true, 'pencil-stroke', false, 4, 2, 2).begin(1, 2);
		expect(xDoc.frames[0].layers[0].pixels[2 * 8 + 3]).toBe(xDoc.frames[0].layers[0].pixels[2 * 8 + 1]);
		const yDoc = testDoc(8, 8);
		new StrokeBuilder(yDoc, 0, 0, 3, 1, false, 'pencil-stroke', false, 4, 2, 3.5, true, 1.5).begin(2, 1);
		expect(yDoc.frames[0].layers[0].pixels[2 * 8 + 2]).toBe(yDoc.frames[0].layers[0].pixels[1 * 8 + 2]);
	});

	it('does not repaint an overlapping mirrored dither stamp', () => {
		const doc = testDoc(8, 8);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 3, true, 'pencil-stroke', false, 4, 2);
		stroke.begin(3, 2);
		expect(doc.frames[0].layers[0].pixels[2 * 8 + 4]).toBe(ditherValue(4, 2, 3, 4, 2));
	});

	it('preserves mirrored dither colors across successive brush centers', () => {
		const doc = testDoc(8, 8);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 3, true, 'pencil-stroke', false, 4, 2);
		stroke.begin(2, 2);
		stroke.moveTo(3, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[2 * 8 + 3]).toBe(pixels[2 * 8 + 4]);
	});
});

describe('tiled drawing', () => {
	it('retains one complete traversal plus the wrapped endpoint', () => {
		expect(boundedTileEndpoint(0, 5, 4)).toBe(5);
		expect(boundedTileEndpoint(0, 100_001, 4)).toBe(5);
		expect(boundedTileEndpoint(3, -6, 4)).toBe(-2);
	});

	it('wraps brush pixels across canvas edges', () => {
		const doc = testDoc(4, 4);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 3, false, 'pencil-stroke', false, undefined, 0, 1.5, false, 1.5, true);
		stroke.begin(0, 0);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([[0, 0], [3, 0], [0, 3], [3, 3]].every(([x, y]) => pixels[y * 4 + x] === 3)).toBe(true);
	});

	it('preserves mirrored dither phase while tiled', () => {
		const doc = testDoc(8, 8);
		new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', false, 4, 2, 3.5, false, 3.5, true).begin(1, 2);
		expect(doc.frames[0].layers[0].pixels[2 * 8 + 6]).toBe(doc.frames[0].layers[0].pixels[2 * 8 + 1]);
	});

	it('normalizes custom-axis dither samples back into the tile', () => {
		const doc = testDoc(5, 5);
		new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', false, 4, 2, 0.5, false, 2, true).begin(4, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[2 * 5 + 2]).toBe(pixels[2 * 5 + 4]);
	});

	it('deduplicates line centers after they wrap', () => {
		const doc = testDoc(4, 4);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'line', false, undefined, 0, 1.5, false, 1.5, true);
		stroke.begin(0, 0);
		stroke.previewLineTo(100_000, 0);
		expect(stroke.end()!.pixelCount).toBe(4);
	});

	it('deduplicates filled tiled geometry before stamping', () => {
		expect(rectanglePoints({ x: 0, y: 0 }, { x: 5, y: 5 }, true, undefined, { width: 4, height: 4 })).toHaveLength(16);
	});

	it('preserves the aspect ratio of wrapped ellipses', () => {
		const exact = ellipsePoints({ x: 0, y: 0 }, { x: 6, y: 8 }, false, undefined, { width: 4, height: 4 });
		const shortened = ellipsePoints({ x: 0, y: 0 }, { x: 6, y: 4 }, false, undefined, { width: 4, height: 4 });
		expect(new Set(exact.map(({ x, y }) => `${x},${y}`))).not.toEqual(new Set(shortened.map(({ x, y }) => `${x},${y}`)));
	});

	it('bounds wrapped ellipse work without changing its wrapped pixels', () => {
		const wrap = { width: 4, height: 4 };
		const expected = new Set(
			ellipsePoints({ x: 0, y: 0 }, { x: 6, y: 8 }, false)
				.map(({ x, y }) => `${(x % 4 + 4) % 4},${(y % 4 + 4) % 4}`)
		);
		const exact = ellipsePoints({ x: 0, y: 0 }, { x: 6, y: 8 }, false, undefined, wrap);
		expect(new Set(exact.map(({ x, y }) => `${x},${y}`))).toEqual(expected);
		expect(ellipsePoints({ x: 0, y: 0 }, { x: 16_000, y: 12_000 }, false, undefined, wrap).length).toBeLessThanOrEqual(16);
	});

	it('keeps a local dirty rect until a tiled brush crosses an edge', () => {
		const doc = testDoc(8, 8);
		const local = new StrokeBuilder(doc, 0, 0, 3, 3, false, 'pencil-stroke', false, undefined, 0, 3.5, false, 3.5, true);
		expect(local.begin(3, 3)).toEqual({ x: 2, y: 2, w: 3, h: 3 });
		const wrapped = new StrokeBuilder(doc, 0, 0, 3, 3, false, 'pencil-stroke', false, undefined, 0, 3.5, false, 3.5, true);
		expect(wrapped.begin(0, 3)).toEqual({ x: 0, y: 2, w: 8, h: 3 });
	});

	it('wraps shape geometry drawn beyond the canvas edge', () => {
		const doc = testDoc(4, 4);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'rectangle', false, undefined, 0, 1.5, false, 1.5, true);
		stroke.previewPoints(rectanglePoints({ x: 3, y: 1 }, { x: 5, y: 2 }, false));
		expect([0, 1, 3].every((x) => doc.frames[0].layers[0].pixels[1 * 4 + x] === 3)).toBe(true);
	});

	it('wraps pixel-perfect corner cleanup across canvas edges', () => {
		const doc = testDoc(4, 4);
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'pencil-stroke', true, undefined, 0, 1.5, false, 1.5, true);
		stroke.begin(3, 1);
		stroke.moveTo(4, 1);
		stroke.moveTo(4, 2);
		expect(doc.frames[0].layers[0].pixels[1 * 4]).toBe(0);
	});
});

describe('line tool', () => {
	it('replaces its live preview and commits only the final line', () => {
		const doc = testDoc();
		const line = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'line');
		line.begin(1, 1);
		line.previewLineTo(5, 1);
		line.previewLineTo(1, 4);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 5]).toBe(0);
		expect(pixels[4 * 8 + 1]).toBe(3);
		expect(line.end()!.kind).toBe('line');
	});

	it('cancels its optimistic preview', () => {
		const doc = testDoc();
		const line = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'line');
		line.begin(1, 1);
		line.previewLineTo(4, 1);
		line.cancel();
		expect(doc.frames[0].layers[0].pixels.every((pixel) => pixel === 0)).toBe(true);
	});

	it('constrains to horizontal, vertical, or diagonal lines', () => {
		expect(constrainLineEndpoint(2, 2, 7, 3)).toEqual({ x: 7, y: 2 });
		expect(constrainLineEndpoint(2, 2, 3, 7)).toEqual({ x: 2, y: 7 });
		expect(constrainLineEndpoint(2, 2, 6, 5)).toEqual({ x: 6, y: 6 });
	});
});

describe('shape tools', () => {
	it('creates outlined and filled rectangles', () => {
		expect(rectanglePoints({ x: 1, y: 1 }, { x: 3, y: 3 }, false)).toHaveLength(8);
		expect(rectanglePoints({ x: 1, y: 1 }, { x: 3, y: 3 }, true)).toHaveLength(9);
	});

	it('creates symmetric ellipse points inside the bounding box', () => {
		const points = ellipsePoints({ x: 1, y: 1 }, { x: 6, y: 4 }, false);
		expect(points.length).toBeGreaterThan(4);
		expect(points.every(({ x, y }) => x >= 1 && x <= 6 && y >= 1 && y <= 4)).toBe(true);
		expect(new Set(points.map(({ x, y }) => `${7 - x},${5 - y}`))).toEqual(
			new Set(points.map(({ x, y }) => `${x},${y}`))
		);
	});

	it('retains the endpoints of narrow ellipses', () => {
		const points = ellipsePoints({ x: 0, y: 0 }, { x: 1, y: 7 }, false);
		expect(points.some((point) => point.y === 0)).toBe(true);
		expect(points.some((point) => point.y === 7)).toBe(true);
	});

	it('clamps an off-canvas shape preview before enumerating points', () => {
		const points = rectanglePoints({ x: 1, y: 1 }, { x: 100_000, y: 100_000 }, false, { width: 8, height: 8 });
		expect(points).toHaveLength(13);
		expect(points).not.toContainEqual({ x: 7, y: 7 });
	});

	it('retains off-canvas centers whose thick brush can overlap the canvas', () => {
		const points = rectanglePoints({ x: -1, y: 1 }, { x: 3, y: 3 }, false, {
			width: 4,
			height: 4,
			padding: 1
		});
		expect(points).toContainEqual({ x: -1, y: 2 });
	});
});

describe('pixel-perfect pencil', () => {
	it('removes the redundant middle pixel from an L-shaped corner', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'pencil-stroke', true);
		stroke.begin(1, 1);
		stroke.moveTo(2, 1);
		stroke.moveTo(2, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect(pixels[1 * 8 + 1]).toBe(3);
		expect(pixels[1 * 8 + 2]).toBe(0);
		expect(pixels[2 * 8 + 2]).toBe(3);
		expect(stroke.end()!.pixelCount).toBe(2);
	});

	it('does not alter strokes wider than one pixel', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 2, false, 'pencil-stroke', true);
		stroke.begin(1, 1);
		stroke.moveTo(2, 1);
		stroke.moveTo(2, 2);
		expect(doc.frames[0].layers[0].pixels[1 * 8 + 2]).toBe(3);
	});

	it('keeps alternating corners connected', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'pencil-stroke', true);
		stroke.begin(1, 1);
		stroke.moveTo(2, 1);
		stroke.moveTo(2, 2);
		stroke.moveTo(3, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([pixels[1 * 8 + 1], pixels[2 * 8 + 2], pixels[2 * 8 + 3]]).toEqual([3, 3, 3]);
	});

	it('does not erase mirrored endpoints at the center axis', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', true);
		stroke.begin(3, 1);
		stroke.moveTo(3, 2);
		stroke.moveTo(4, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([pixels[2 * 8 + 3], pixels[2 * 8 + 4]]).toEqual([3, 3]);
	});

	it('cleans the pixel-perfect corner in every mirrored quadrant', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', true, undefined, 0, 3.5, true, 3.5);
		stroke.begin(1, 1);
		stroke.moveTo(2, 1);
		stroke.moveTo(2, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([[2, 1], [5, 1], [2, 6], [5, 6]].map(([x, y]) => pixels[y * 8 + x])).toEqual([0, 0, 0, 0]);
	});

	it('keeps both mirrored arms when a corner crosses the axis', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, true, 'pencil-stroke', true);
		stroke.begin(3, 1);
		stroke.moveTo(4, 1);
		stroke.moveTo(4, 2);
		const pixels = doc.frames[0].layers[0].pixels;
		expect([pixels[1 * 8 + 3], pixels[1 * 8 + 4], pixels[2 * 8 + 3], pixels[2 * 8 + 4]]).toEqual([3, 3, 3, 3]);
	});

	it('keeps pixels reused earlier in the same stroke', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'pencil-stroke', true);
		for (const [i, point] of [[2, 2], [3, 2], [2, 2], [2, 3]].entries()) {
			if (i === 0) stroke.begin(...point as [number, number]);
			else stroke.moveTo(...point as [number, number]);
		}
		expect(doc.frames[0].layers[0].pixels[2 * 8 + 2]).toBe(3);
	});

	it('does not let off-canvas centers protect aliased pixels', () => {
		const doc = testDoc();
		const stroke = new StrokeBuilder(doc, 0, 0, 3, 1, false, 'pencil-stroke', true);
		for (const [i, point] of [[0, 1], [-1, 1], [6, 0], [7, 0], [7, 1]].entries()) {
			if (i === 0) stroke.begin(...point as [number, number]);
			else stroke.moveTo(...point as [number, number]);
		}
		expect(doc.frames[0].layers[0].pixels[7]).toBe(0);
	});
});

describe('replace color', () => {
	it('replaces matching pixels within an optional selection mask', () => {
		const doc = testDoc(4, 1);
		const pixels = doc.frames[0].layers[0].pixels;
		pixels.set([1, 2, 1, 1]);
		const mask = new Uint8Array([1, 1, 0, 1]);
		const cmd = replaceColorCommand(doc, 0, 0, 1, 3, mask)!;
		cmd.do(doc);
		expect([...pixels]).toEqual([3, 2, 1, 3]);
		cmd.undo(doc);
		expect([...pixels]).toEqual([1, 2, 1, 1]);
	});

	it('stores whole-layer replacement history as a compact bitset', () => {
		const doc = testDoc(512, 512);
		doc.frames[0].layers[0].pixels.fill(1);
		const cmd = replaceColorCommand(doc, 0, 0, 1, 3)!;
		expect(cmd.byteSize).toBeLessThan(33_000);
		expect(cmd.pixelCount).toBe(512 * 512);
	});

	it('stores sparse replacement history as indices', () => {
		const doc = testDoc(512, 512);
		doc.frames[0].layers[0].pixels[123] = 1;
		const cmd = replaceColorCommand(doc, 0, 0, 1, 3)!;
		expect(cmd.byteSize).toBeLessThan(100);
		cmd.do(doc);
		expect(doc.frames[0].layers[0].pixels[123]).toBe(3);
	});
});

describe('dithering', () => {
	it('alternates primary and secondary colors in stable 2x2 and 4x4 patterns', () => {
		expect([0, 1, 2, 3].map((i) => ditherValue(i % 2, (i / 2) | 0, 1, 2, 2))).toEqual([1, 2, 2, 1]);
		const four = Array.from({ length: 16 }, (_, i) => ditherValue(i % 4, (i / 4) | 0, 1, 2, 4));
		expect(four.filter((v) => v === 1)).toHaveLength(8);
		expect(four).not.toEqual(Array.from({ length: 16 }, (_, i) => ditherValue(i % 4, (i / 4) | 0, 1, 2, 2)));
	});

	it('applies the pattern to fill output', () => {
		const doc = testDoc(2, 2);
		const cmd = floodFill(doc, 0, 0, 0, 0, 1, 0, true, 2, 2)!;
		cmd.do(doc);
		expect([...doc.frames[0].layers[0].pixels]).toEqual([1, 2, 2, 1]);
		expect(floodFill(doc, 0, 0, 0, 0, 1, 1, true, 2, 2)).toBeNull();
	});
});

describe('selection stamps', () => {
	it('places opaque stamp pixels and supports transforms', () => {
		const doc = testDoc(5, 5);
		const stamp = { width: 2, height: 2, pixels: new Uint8Array([1, 0, 2, 3]) };
		stampCommand(doc, 0, 0, stamp, 2, 2)!.do(doc);
		expect(doc.frames[0].layers[0].pixels[1 * 5 + 1]).toBe(1);
		expect([...flipStamp(stamp).pixels]).toEqual([0, 1, 3, 2]);
		expect([...rotateStamp(stamp).pixels]).toEqual([2, 1, 3, 0]);
	});
});
