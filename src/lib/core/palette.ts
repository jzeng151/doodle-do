// Palette ops. The compositor consumes a Uint32Array LUT: lut[0] = 0
// (transparent), lut[n] = palette[n - 1] packed as little-endian RGBA
// (the byte layout of a Uint32Array view over ImageData.data).

import { MAX_PALETTE, type Doc } from './document';

export function packColor(hex: string): number {
	const v = parseInt(hex.slice(1), 16);
	const r = (v >> 16) & 0xff;
	const g = (v >> 8) & 0xff;
	const b = v & 0xff;
	return (0xff << 24) | (b << 16) | (g << 8) | r;
}

export function buildLut(palette: string[]): Uint32Array {
	const lut = new Uint32Array(MAX_PALETTE + 1);
	for (let i = 0; i < palette.length; i++) lut[i + 1] = packColor(palette[i]);
	return lut;
}

export function isValidPixelValue(doc: Doc, value: number): boolean {
	return value >= 0 && value <= doc.palette.length;
}

// Phase 0 placeholder palette: DawnBringer 16 (free to use). The curated,
// license-verified Lospec starter set is a Phase 2 item (§4.2).
export const DEFAULT_PALETTE: string[] = [
	'#140c1c',
	'#442434',
	'#30346d',
	'#4e4a4e',
	'#854c30',
	'#346524',
	'#d04648',
	'#757161',
	'#597dce',
	'#d27d2c',
	'#8595a1',
	'#6daa2c',
	'#d2aa99',
	'#6dc2ca',
	'#dad45e',
	'#deeed6'
];
