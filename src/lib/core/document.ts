// Document model (§6.2). Indexed color: layer pixels store palette indices,
// 0 = transparent, n = palette[n - 1]. Palette ≤ 64 entries.

export const MAX_PALETTE = 64;
export const MAX_LAYERS = 8;
export const MAX_CANVAS = 128;
export const TRANSPARENT = 0;

export interface DocMeta {
	name: string;
	width: number;
	height: number;
	fps: number; // 1–24, default 8
	version: 1;
	syncMeta: null; // reserved for future cloud sync (§4.7)
}

export interface Layer {
	name: string;
	visible: boolean;
	pixels: Uint8Array; // width * height palette indices
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
