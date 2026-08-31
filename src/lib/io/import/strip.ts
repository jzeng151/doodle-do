// Sprite strip import: one horizontal strip PNG per animation, frame width
// = image height (the layout used by e.g. animation packs with an
// animations.json manifest). Arbitrary RGBA input is quantized into the
// indexed model: ≤64 palette entries, binary transparency.

// gifenc ships a CommonJS main build whose esbuild getter-exports aren't
// statically detectable, so a named import breaks Vite's dev SSR (this module
// is in the page's prerender graph via files.ts). A namespace import grabs the
// whole exports object and sidesteps the check.
import * as gifenc from 'gifenc';
import { isValidFrameDuration, MAX_CANVAS, MAX_PALETTE, type Doc } from '../../core/document';
import { DEFAULT_PALETTE } from '../../core/palette';

// Doodle-Do transparency is 1-bit (index 0); GIF-style threshold.
export const ALPHA_THRESHOLD = 128;

export interface RgbaImage {
	width: number;
	height: number;
	data: Uint8ClampedArray; // RGBA, width * height * 4
}

export interface StripInfo {
	frameSize: number;
	frameCount: number;
}

export const MAX_STRIP_PIXELS = MAX_CANVAS * MAX_CANVAS * 64;

export function stripPngDimensions(header: Uint8Array): { width: number; height: number } {
	const signature = [137, 80, 78, 71, 13, 10, 26, 10];
	if (
		header.length < 24 ||
		!signature.every((byte, index) => header[index] === byte) ||
		String.fromCharCode(...header.slice(12, 16)) !== 'IHDR'
	) {
		throw new Error('that file is not a valid PNG');
	}
	const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
	const width = view.getUint32(16);
	const height = view.getUint32(20);
	if (!width || !height || height > MAX_CANVAS || width > MAX_STRIP_PIXELS / height) {
		throw new Error(`sprite strips must use at most ${MAX_STRIP_PIXELS.toLocaleString()} pixels with frames no taller than ${MAX_CANVAS}px`);
	}
	if (width % height !== 0) {
		throw new Error(`not a uniform strip: width ${width} is not a multiple of frame height ${height}`);
	}
	return { width, height };
}

export function detectStrip(img: RgbaImage): StripInfo {
	const { width, height } = img;
	if (height > MAX_CANVAS) {
		throw new Error(`frame size ${height}px exceeds the ${MAX_CANVAS}px canvas cap`);
	}
	if (width % height !== 0) {
		throw new Error(
			`not a uniform strip: width ${width} is not a multiple of frame height ${height}`
		);
	}
	return { frameSize: height, frameCount: width / height };
}

function hex(r: number, g: number, b: number): string {
	return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// Builds a ≤64-color palette and a pixel→value mapper. Exact mapping when
// the source already fits; median-cut quantization (gifenc) when it doesn't.
function buildPalette(img: RgbaImage): { palette: string[]; valueAt: (i: number) => number } {
	const { data } = img;
	const exact = new Map<number, number>(); // packed rgb → pixel value
	const colors: string[] = [];
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < ALPHA_THRESHOLD) continue;
		const packed = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
		if (!exact.has(packed)) {
			if (exact.size >= MAX_PALETTE) break; // over budget — quantize instead
			exact.set(packed, exact.size + 1);
			colors.push(hex(data[i], data[i + 1], data[i + 2]));
		}
	}

	if (exact.size < MAX_PALETTE || uniqueOpaqueFitsExactly(img, exact)) {
		return {
			palette: colors,
			valueAt: (i) =>
				data[i + 3] < ALPHA_THRESHOLD
					? 0
					: exact.get((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])!
		};
	}

	// Quantize opaque pixels only, so transparency doesn't eat palette slots.
	let opaqueCount = 0;
	for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= ALPHA_THRESHOLD) opaqueCount++;
	const opaque = new Uint8Array(opaqueCount * 4);
	for (let i = 0, o = 0; i < data.length; i += 4) {
		if (data[i + 3] < ALPHA_THRESHOLD) continue;
		opaque[o] = data[i];
		opaque[o + 1] = data[i + 1];
		opaque[o + 2] = data[i + 2];
		opaque[o + 3] = 255;
		o += 4;
	}
	const table = gifenc.quantize(opaque, MAX_PALETTE);
	const cache = new Map<number, number>();
	return {
		palette: table.map(([r, g, b]) => hex(r, g, b)),
		valueAt: (i) => {
			if (data[i + 3] < ALPHA_THRESHOLD) return 0;
			const packed = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
			let value = cache.get(packed);
			if (value === undefined) {
				value = gifenc.nearestColorIndex(table, [data[i], data[i + 1], data[i + 2]]) + 1;
				cache.set(packed, value);
			}
			return value;
		}
	};
}

function uniqueOpaqueFitsExactly(img: RgbaImage, seen: Map<number, number>): boolean {
	// seen was filled until the cap; verify no further colors exist
	const { data } = img;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < ALPHA_THRESHOLD) continue;
		if (!seen.has((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])) return false;
	}
	return true;
}

export function stripToDoc(
	img: RgbaImage,
	name: string,
	opts: { frameMs?: number; fps?: number } = {}
): Doc {
	if (opts.frameMs !== undefined && !isValidFrameDuration(opts.frameMs)) {
		throw new Error('frame duration must be a whole number of at least 20 ms');
	}
	const { frameSize, frameCount } = detectStrip(img);
	const { palette, valueAt } = buildPalette(img);
	const usablePalette = palette.length ? palette : [DEFAULT_PALETTE[0]];

	const frames: Doc['frames'] = [];
	for (let f = 0; f < frameCount; f++) {
		const pixels = new Uint8Array(frameSize * frameSize);
		for (let y = 0; y < frameSize; y++) {
			for (let x = 0; x < frameSize; x++) {
				const src = (y * img.width + f * frameSize + x) * 4;
				pixels[y * frameSize + x] = valueAt(src);
			}
		}
		frames.push({
			layers: [{ name: 'Layer 1', visible: true, pixels }],
			...(opts.frameMs !== undefined && { durationMs: opts.frameMs })
		});
	}

	return {
		meta: {
			name,
			width: frameSize,
			height: frameSize,
			fps: opts.fps ?? 8,
			version: 1,
			syncMeta: null
		},
		palette: usablePalette,
		frames
	};
}

// animations.json manifest (schemaVersion 1): finds the entry whose src
// basename matches the imported PNG and returns its timing.
export function manifestEntryFor(
	manifestText: string,
	pngFilename: string
): { frames: number; frameMs: number } | null {
	let manifest: unknown;
	try {
		manifest = JSON.parse(manifestText);
	} catch {
		throw new Error('manifest is not valid JSON');
	}
	const animations = (manifest as { animations?: Record<string, unknown> }).animations;
	if (!animations) return null;
	for (const entry of Object.values(animations)) {
		const a = entry as { src?: string; frames?: number; frameMs?: number };
		if (typeof a.src !== 'string') continue;
		if (a.src.split('/').pop() === pngFilename) {
			if (a.frames !== undefined && (!Number.isSafeInteger(a.frames) || a.frames < 1)) {
				throw new Error('manifest frame count must be a positive whole number');
			}
			if (a.frameMs !== undefined && !isValidFrameDuration(a.frameMs)) {
				throw new Error('manifest frame duration must be a whole number of at least 20 ms');
			}
			return {
				frames: typeof a.frames === 'number' ? a.frames : 0,
				frameMs: typeof a.frameMs === 'number' ? a.frameMs : 0
			};
		}
	}
	return null;
}
