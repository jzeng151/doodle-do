import { describe, expect, it, vi } from 'vitest';
import { createDoc } from '../core/document';
import { gplPalette, hexPalette, paletteFromArtwork, parseTextPalette, readPalette } from './palette';

describe('palette files', () => {
	it('parses GPL, PAL-style RGB rows, and hex lines', () => {
		expect(parseTextPalette('GIMP Palette\n255 0 16 red\n0 128 255 blue')).toEqual(['#ff0010', '#0080ff']);
		expect(parseTextPalette('#112233\n#AABBCC')).toEqual(['#112233', '#aabbcc']);
		expect(parseTextPalette('#112233\n#112233')).toEqual(['#112233', '#112233']);
		expect(parseTextPalette('GIMP Palette\nName: #112233\n255 0 16 red')).toEqual(['#ff0010']);
		expect(parseTextPalette('GIMP Palette\n#112233\n255 0 16 red')).toEqual(['#ff0010']);
	});

	it('exports GPL and hex text', () => {
		expect(gplPalette(['#ff0010'], 'Test')).toContain('255 0 16');
		expect(gplPalette(['#ff0010'], 'Walk\nCycle').split('\n')[1]).toBe('Name: Walk Cycle');
		expect(hexPalette(['#112233', '#aabbcc'])).toBe('#112233\n#aabbcc\n');
	});

	it('rejects oversized PNG headers before bitmap decoding', async () => {
		const bytes = new Uint8Array(24);
		bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
		bytes.set([73, 72, 68, 82], 12);
		new DataView(bytes.buffer).setUint32(16, 2048);
		new DataView(bytes.buffer).setUint32(20, 2048);
		const decode = vi.fn();
		vi.stubGlobal('createImageBitmap', decode);
		await expect(readPalette(new File([bytes], 'large.png', { type: 'image/png' }))).rejects.toThrow(/1 megapixel/);
		expect(decode).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it('rejects oversized text palettes before reading them', async () => {
		const file = new File([new Uint8Array(1_048_577)], 'large.txt', { type: 'text/plain' });
		await expect(readPalette(file)).rejects.toThrow(/1 MB/);
	});

	it('builds and remaps a compact palette from used artwork colors', () => {
		const doc = createDoc({ width: 3, height: 1, palette: ['#111111', '#222222', '#333333'] });
		doc.frames[0].layers[0].pixels.set([3, 0, 1]);
		const { palette, map } = paletteFromArtwork(doc)!;
		expect(palette).toEqual(['#111111', '#333333']);
		expect([...doc.frames[0].layers[0].pixels]).toEqual([3, 0, 1]);
		expect(map.get(3)).toBe(2);
	});
});
