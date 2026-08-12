import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { gplPalette, hexPalette, paletteFromArtwork, parseTextPalette } from './palette';

describe('palette files', () => {
	it('parses GPL, PAL-style RGB rows, and hex lines', () => {
		expect(parseTextPalette('GIMP Palette\n255 0 16 red\n0 128 255 blue')).toEqual(['#ff0010', '#0080ff']);
		expect(parseTextPalette('#112233\n#AABBCC')).toEqual(['#112233', '#aabbcc']);
		expect(parseTextPalette('#112233\n#112233')).toEqual(['#112233', '#112233']);
	});

	it('exports GPL and hex text', () => {
		expect(gplPalette(['#ff0010'], 'Test')).toContain('255 0 16');
		expect(hexPalette(['#112233', '#aabbcc'])).toBe('#112233\n#aabbcc\n');
	});

	it('builds and remaps a compact palette from used artwork colors', () => {
		const doc = createDoc({ width: 3, height: 1, palette: ['#111111', '#222222', '#333333'] });
		doc.frames[0].layers[0].pixels.set([3, 0, 1]);
		const { doc: next, map } = paletteFromArtwork(doc)!;
		expect(next.palette).toEqual(['#111111', '#333333']);
		expect([...next.frames[0].layers[0].pixels]).toEqual([2, 0, 1]);
		expect(map.get(3)).toBe(2);
	});
});
