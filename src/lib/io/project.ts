// Project file format (§4.7, decided): a single versioned JSON file with
// pixel buffers as base64 strings. `version` and `syncMeta` present from
// day one for future cloud sync.

import { MAX_CANVAS, MAX_LAYERS, MAX_PALETTE, type Doc } from '../core/document';

export const PROJECT_FORMAT = 'doodledo-project';
export const PROJECT_VERSION = 1;
export const PROJECT_EXTENSION = '.doodledo';

export function encodeBase64(bytes: Uint8Array): string {
	let binary = '';
	const CHUNK = 0x8000;
	for (let i = 0; i < bytes.length; i += CHUNK) {
		binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(binary);
}

export function decodeBase64(text: string): Uint8Array {
	const binary = atob(text);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

export function serializeProject(doc: Doc): string {
	return JSON.stringify({
		format: PROJECT_FORMAT,
		version: PROJECT_VERSION,
		meta: {
			name: doc.meta.name,
			width: doc.meta.width,
			height: doc.meta.height,
			fps: doc.meta.fps,
			syncMeta: doc.meta.syncMeta,
			...(doc.meta.tags?.length && { tags: doc.meta.tags })
		},
		palette: doc.palette,
		frames: doc.frames.map((frame) => ({
			...(frame.durationMs !== undefined && { durationMs: frame.durationMs }),
			layers: frame.layers.map((layer) => ({
				name: layer.name,
				visible: layer.visible,
				...(layer.linkId && { linkId: layer.linkId }),
				...(layer.locked && { locked: true }),
				...(layer.opacity !== undefined && layer.opacity !== 1 && { opacity: layer.opacity }),
				pixels: encodeBase64(layer.pixels)
			}))
		}))
	});
}

function fail(reason: string): never {
	throw new Error(`invalid project file: ${reason}`);
}

export function parseProject(text: string): Doc {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		fail('not JSON');
	}
	const p = raw as Record<string, unknown>;
	if (p.format !== PROJECT_FORMAT) fail('unknown format');
	if (p.version !== PROJECT_VERSION) fail(`unsupported version ${p.version}`);
	const meta = p.meta as Record<string, unknown>;
	const width = meta?.width as number;
	const height = meta?.height as number;
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width < 1 ||
		height < 1 ||
		width > MAX_CANVAS ||
		height > MAX_CANVAS
	) {
		fail('canvas size out of range');
	}
	const palette = p.palette as string[];
	if (!Array.isArray(palette) || palette.length > MAX_PALETTE) fail('bad palette');
	const rawFrames = p.frames as Record<string, unknown>[];
	if (!Array.isArray(rawFrames) || rawFrames.length < 1) fail('no frames');
	let tags: Doc['meta']['tags'];
	if (Array.isArray(meta.tags)) {
		const names = new Set<string>();
		tags = (meta.tags as Record<string, unknown>[]).map((tag) => {
			const name = typeof tag.name === 'string' ? tag.name.trim() : '';
			const from = Number(tag.from), to = Number(tag.to);
			const repeats = Number(tag.repeats);
			const direction = tag.direction;
			if (!name || names.has(name) || !Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(repeats) || repeats < 0 || repeats > 99 || from < 0 || to < from || to >= rawFrames.length || !['forward', 'reverse', 'ping-pong'].includes(direction as string)) fail('bad animation tags');
			names.add(name);
			return { name, from, to, direction: direction as 'forward' | 'reverse' | 'ping-pong', repeats };
		});
	}

	const doc: Doc = {
		meta: {
			name: typeof meta.name === 'string' ? meta.name : 'Untitled',
			width,
			height,
			fps: typeof meta.fps === 'number' && meta.fps >= 1 && meta.fps <= 24 ? meta.fps : 8,
			version: PROJECT_VERSION,
			syncMeta: null,
			...(tags && { tags })
		},
		palette,
		frames: rawFrames.map((rawFrame, f) => {
			const rawLayers = rawFrame.layers as Record<string, unknown>[];
			if (!Array.isArray(rawLayers) || rawLayers.length < 1 || rawLayers.length > MAX_LAYERS) {
				fail(`frame ${f} has a bad layer list`);
			}
			const frameLinks = new Set<string>();
			return {
				...(typeof rawFrame.durationMs === 'number' && { durationMs: rawFrame.durationMs }),
				layers: rawLayers.map((rawLayer, l) => {
					const linkId = typeof rawLayer.linkId === 'string' ? rawLayer.linkId : '';
					if (linkId && frameLinks.has(linkId)) fail(`frame ${f} repeats linked cel ${linkId}`);
					if (linkId) frameLinks.add(linkId);
					const pixels = decodeBase64(rawLayer.pixels as string);
					if (pixels.length !== width * height) fail(`frame ${f} layer ${l} pixel size mismatch`);
					for (const v of pixels) {
						if (v > palette.length) fail(`frame ${f} layer ${l} has out-of-palette pixels`);
					}
					return {
						name: typeof rawLayer.name === 'string' ? rawLayer.name : `Layer ${l + 1}`,
						visible: rawLayer.visible !== false,
						...(linkId && { linkId }),
						...(rawLayer.locked === true && { locked: true }),
						...(typeof rawLayer.opacity === 'number' && { opacity: Math.max(0, Math.min(1, rawLayer.opacity)) }),
						pixels
					};
				})
			};
		})
	};
	const linked = new Map<string, Uint8Array>();
	for (const frame of doc.frames) for (const layer of frame.layers) if (layer.linkId) {
		if (linked.has(layer.linkId)) {
			const source = linked.get(layer.linkId)!;
			if (source.some((value, index) => value !== layer.pixels[index])) fail(`linked cel ${layer.linkId} has inconsistent pixels`);
			layer.pixels = source;
		}
		else linked.set(layer.linkId, layer.pixels);
	}
	return doc;
}
