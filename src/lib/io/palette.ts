import { MAX_PALETTE, type Doc } from '../core/document';

const hex = (r: number, g: number, b: number) =>
	`#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;

export function parseTextPalette(text: string): string[] {
	const colors: string[] = [];
	const gpl = /^\s*GIMP Palette(?:\r?\n|$)/i.test(text);
	for (const line of text.split(/\r?\n/)) {
		if (gpl && /^\s*#/.test(line)) continue;
		const hexMatch = line.match(/^\s*#([\da-f]{6})\s*$/i);
		const rgbMatch = line.match(/^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s|$)/);
		const color = hexMatch
			? `#${hexMatch[1].toLowerCase()}`
			: rgbMatch && rgbMatch.slice(1).every((value) => Number(value) <= 255)
				? hex(...(rgbMatch.slice(1).map(Number) as [number, number, number]))
				: null;
		if (color) colors.push(color);
	}
	if (!colors.length) throw new Error('No RGB colors were found in that palette file.');
	return colors.slice(0, MAX_PALETTE);
}

export async function readPalette(file: File): Promise<string[]> {
	if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
		if (file.size > 1_048_576) throw new Error('Text palette files must be no larger than 1 MB.');
		return parseTextPalette(await file.text());
	}
	const header = new Uint8Array(await file.slice(0, 24).arrayBuffer());
	const signature = [137, 80, 78, 71, 13, 10, 26, 10];
	if (header.length < 24 || !signature.every((byte, index) => header[index] === byte) || String.fromCharCode(...header.slice(12, 16)) !== 'IHDR') {
		throw new Error('That file is not a valid PNG.');
	}
	const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
	const width = view.getUint32(16), height = view.getUint32(20);
	if (!width || !height || width > 1_048_576 / height) throw new Error('Palette PNGs must be no larger than 1 megapixel.');
	const bitmap = await createImageBitmap(file);
	if (bitmap.width !== width || bitmap.height !== height) {
		bitmap.close();
		throw new Error('PNG dimensions changed while decoding.');
	}
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0);
	const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
	bitmap.close();
	const colors: string[] = [];
	for (let i = 0; i < data.length && colors.length < MAX_PALETTE; i += 4) {
		if (data[i + 3] < 128) continue;
		const color = hex(data[i], data[i + 1], data[i + 2]);
		if (!colors.includes(color)) colors.push(color);
	}
	if (!colors.length) throw new Error('No opaque colors were found in that PNG.');
	return colors;
}

export function gplPalette(colors: string[], name: string): string {
	const rows = colors.map((color) => {
		const value = parseInt(color.slice(1), 16);
		return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}\t${color}`;
	});
	return `GIMP Palette\nName: ${name.replace(/[\r\n]+/g, ' ').trim()}\nColumns: 8\n#\n${rows.join('\n')}\n`;
}

export function hexPalette(colors: string[]): string {
	return `${colors.join('\n')}\n`;
}

export function paletteFromArtwork(doc: Doc): { palette: string[]; map: Map<number, number> } | null {
	const used = new Set<number>();
	for (const frame of doc.frames) for (const layer of frame.layers) for (const value of layer.pixels) if (value) used.add(value);
	if (!used.size) return null;
	const values = [...used].sort((a, b) => a - b);
	const map = new Map(values.map((value, index) => [value, index + 1]));
	const palette = values.map((value) => doc.palette[value - 1]);
	for (let value = 1; value <= doc.palette.length; value++) {
		const duplicate = palette.indexOf(doc.palette[value - 1]);
		if (!map.has(value) && duplicate >= 0) map.set(value, duplicate + 1);
	}
	return { palette, map };
}
