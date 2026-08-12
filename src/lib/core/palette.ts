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

const channels = (color: string) => {
	const value = parseInt(color.slice(1), 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
};

export function colorRamp(from: string, to: string, steps: number): string[] {
	const a = channels(from);
	const b = channels(to);
	return Array.from({ length: steps }, (_, index) => {
		const t = steps === 1 ? 0 : index / (steps - 1);
		return `#${a.map((value, channel) => Math.round(value + (b[channel] - value) * t).toString(16).padStart(2, '0')).join('')}`;
	});
}

export type PaletteSort = 'hue' | 'saturation' | 'luminance' | 'red' | 'green' | 'blue';

export function sortPaletteRange(doc: Doc, start: number, end: number, sort: PaletteSort): { doc: Doc; map: Map<number, number>; moved: boolean } {
	const lo = Math.min(start, end);
	const hi = Math.max(start, end);
	const hsv = ([r, g, b]: readonly number[]) => {
		const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
		const hue = delta === 0 ? 0 : max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
		return [hue * 60, max === 0 ? 0 : delta / max] as const;
	};
	const score = (color: string) => {
		const rgb = channels(color);
		if (sort === 'red') return rgb[0];
		if (sort === 'green') return rgb[1];
		if (sort === 'blue') return rgb[2];
		if (sort === 'luminance') return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
		return hsv(rgb)[sort === 'hue' ? 0 : 1];
	};
	const entries = doc.palette.slice(lo, hi + 1).map((color, offset) => ({ color, old: lo + offset + 1 }));
	entries.sort((a, b) => score(a.color) - score(b.color) || a.old - b.old);
	const moved = entries.some((entry, offset) => entry.old !== lo + offset + 1);
	const remap = new Map<number, number>();
	for (let offset = 0; offset < entries.length; offset++) remap.set(entries[offset].old, lo + offset + 1);
	if (!moved) return { doc, map: remap, moved };
	const next = structuredClone(doc);
	for (let offset = 0; offset < entries.length; offset++) {
		next.palette[lo + offset] = entries[offset].color;
	}
	for (const frame of next.frames) for (const layer of frame.layers) {
		for (let i = 0; i < layer.pixels.length; i++) if (remap.has(layer.pixels[i])) layer.pixels[i] = remap.get(layer.pixels[i])!;
	}
	return { doc: next, map: remap, moved };
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
