// Document model (§6.2). Indexed color: layer pixels store palette indices,
// 0 = transparent, n = palette[n - 1]. Palette ≤ 64 entries.

export const MAX_PALETTE = 64;
export const MAX_LAYERS = 8;
export const MAX_CANVAS = 512;
export const TRANSPARENT = 0;

export interface DocMeta {
	name: string;
	width: number;
	height: number;
	fps: number; // 1–24, default 8
	version: 1;
	syncMeta: null; // reserved for future cloud sync (§4.7)
	tags?: AnimationTag[];
}

export interface AnimationTag {
	name: string;
	from: number;
	to: number;
	direction: 'forward' | 'reverse' | 'ping-pong';
	repeats: number;
}

export interface Layer {
	name: string;
	visible: boolean;
	pixels: Uint8Array; // width * height palette indices
	linkId?: string;
	locked?: boolean;
	opacity?: number;
}

export interface Frame {
	layers: Layer[]; // layers[0] = bottom
	durationMs?: number; // overrides global fps when set
}

export interface Doc {
	meta: DocMeta;
	palette: string[]; // '#rrggbb' entries; pixel value n maps to palette[n - 1]
	frames: Frame[];
}

export function createLayer(doc: Pick<Doc, 'meta'>, name: string): Layer {
	return {
		name,
		visible: true,
		pixels: new Uint8Array(doc.meta.width * doc.meta.height)
	};
}

export function createDoc(opts: {
	name?: string;
	width: number;
	height: number;
	fps?: number;
	palette: string[];
	frameCount?: number;
	layerCount?: number;
}): Doc {
	const { width, height } = opts;
	if (width < 1 || height < 1 || width > MAX_CANVAS || height > MAX_CANVAS) {
		throw new Error(`canvas size ${width}×${height} out of range (1–${MAX_CANVAS})`);
	}
	if (opts.palette.length > MAX_PALETTE) {
		throw new Error(`palette exceeds ${MAX_PALETTE} entries`);
	}
	const doc: Doc = {
		meta: {
			name: opts.name ?? 'Untitled',
			width,
			height,
			fps: opts.fps ?? 8,
			version: 1,
			syncMeta: null
		},
		palette: [...opts.palette],
		frames: []
	};
	const frameCount = opts.frameCount ?? 2; // smart default: 2 frames (§4.5)
	const layerCount = opts.layerCount ?? 1;
	for (let f = 0; f < frameCount; f++) {
		const layers: Layer[] = [];
		for (let l = 0; l < layerCount; l++) layers.push(createLayer(doc, `Layer ${l + 1}`));
		doc.frames.push({ layers });
	}
	return doc;
}

export function frameDurationMs(doc: Doc, frameIndex: number): number {
	return doc.frames[frameIndex].durationMs ?? 1000 / doc.meta.fps;
}

// Resize one layer buffer to new dimensions. 'crop' keeps pixels at their
// coordinates (top-left anchor): growth adds transparent margin, shrink clips
// the right/bottom edges. 'scale' resamples nearest-neighbor, preserving
// palette indices (no blending — indexed color has no in-between).
export function resizePixels(
	pixels: Uint8Array,
	oldW: number,
	oldH: number,
	newW: number,
	newH: number,
	mode: 'crop' | 'scale' | 'scale2x'
): Uint8Array {
	const out = new Uint8Array(newW * newH);
	if (mode === 'scale' || mode === 'scale2x') {
		const source = mode === 'scale2x' ? scale2x(pixels, oldW, oldH) : pixels;
		const sourceW = mode === 'scale2x' ? oldW * 2 : oldW;
		const sourceH = mode === 'scale2x' ? oldH * 2 : oldH;
		for (let y = 0; y < newH; y++) {
			const sy = Math.min(sourceH - 1, Math.floor((y * sourceH) / newH));
			for (let x = 0; x < newW; x++) {
				const sx = Math.min(sourceW - 1, Math.floor((x * sourceW) / newW));
				out[y * newW + x] = source[sy * sourceW + sx];
			}
		}
	} else {
		const w = Math.min(oldW, newW);
		const h = Math.min(oldH, newH);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) out[y * newW + x] = pixels[y * oldW + x];
		}
	}
	return out;
}

function scale2x(pixels: Uint8Array, width: number, height: number): Uint8Array {
	const out = new Uint8Array(width * height * 4);
	const at = (x: number, y: number) => pixels[Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))];
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const e = at(x, y), b = at(x, y - 1), d = at(x - 1, y), f = at(x + 1, y), h = at(x, y + 1);
		const row = y * 2 * width * 2 + x * 2;
		out[row] = d === b && d !== h && b !== f ? d : e;
		out[row + 1] = b === f && b !== d && f !== h ? f : e;
		out[row + width * 2] = d === h && d !== b && h !== f ? d : e;
		out[row + width * 2 + 1] = h === f && d !== h && b !== f ? f : e;
	}
	return out;
}
