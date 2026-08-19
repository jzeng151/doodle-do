import { describe, expect, it } from 'vitest';
import { createDoc } from '../core/document';
import { DEFAULT_PALETTE } from '../core/palette';
import { parseProject, serializeProject } from './project';

describe('project file round-trip', () => {
	it('preserves meta, palette, durations, visibility, and pixels exactly', () => {
		const doc = createDoc({
			name: 'strut',
			width: 32,
			height: 16,
			fps: 12,
			palette: DEFAULT_PALETTE,
			frameCount: 3,
			layerCount: 2
		});
		doc.frames[1].durationMs = 250;
		doc.frames[0].layers[1].visible = false;
		for (let i = 0; i < 32 * 16; i++) doc.frames[2].layers[0].pixels[i] = i % 17;

		const restored = parseProject(serializeProject(doc));
		expect(restored.meta).toEqual(doc.meta);
		expect(restored.palette).toEqual(doc.palette);
		expect(restored.frames[1].durationMs).toBe(250);
		expect(restored.frames[0].durationMs).toBeUndefined();
		expect(restored.frames[0].layers[1].visible).toBe(false);
		expect(restored.frames[2].layers[0].pixels).toEqual(doc.frames[2].layers[0].pixels);
	});

	it('round-trips animation tags while accepting files without them', () => {
		const doc = createDoc({ width: 2, height: 2, palette: DEFAULT_PALETTE, frameCount: 3 });
		doc.meta.tags = [{ name: 'walk', from: 0, to: 2, direction: 'ping-pong', repeats: 2 }];
		expect(parseProject(serializeProject(doc)).meta.tags).toEqual(doc.meta.tags);
		const legacy = JSON.parse(serializeProject(doc));
		delete legacy.meta.tags;
		expect(parseProject(JSON.stringify(legacy)).meta.tags).toBeUndefined();
		legacy.meta.tags = 'walk';
		expect(() => parseProject(JSON.stringify(legacy))).toThrow(/bad animation tags/);
	});

	it('rejects empty and duplicate animation tag names', () => {
		const raw = JSON.parse(serializeProject(createDoc({ width: 2, height: 2, palette: DEFAULT_PALETTE })));
		raw.meta.tags = [{ name: ' walk ', from: 0, to: 0, direction: 'forward', repeats: 0 }, { name: 'walk', from: 0, to: 0, direction: 'forward', repeats: 0 }];
		expect(() => parseProject(JSON.stringify(raw))).toThrow(/bad animation tags/);
		raw.meta.tags = [{ name: ' ', from: 0, to: 0, direction: 'forward', repeats: 0 }];
		expect(() => parseProject(JSON.stringify(raw))).toThrow(/bad animation tags/);
	});

	it('rejects invalid animation tag repeat counts', () => {
		const raw = JSON.parse(serializeProject(createDoc({ width: 2, height: 2, palette: DEFAULT_PALETTE })));
		for (const repeats of [-1, 1.5, 100]) {
			raw.meta.tags = [{ name: 'walk', from: 0, to: 0, direction: 'forward', repeats }];
			expect(() => parseProject(JSON.stringify(raw))).toThrow(/bad animation tags/);
		}
		for (const value of [null, '', '0']) {
			raw.meta.tags = [{ name: 'walk', from: value, to: 0, direction: 'forward', repeats: 0 }];
			expect(() => parseProject(JSON.stringify(raw))).toThrow(/bad animation tags/);
		}
	});

	it('rejects wrong format, version, and corrupt payloads', () => {
		const doc = createDoc({ width: 4, height: 4, palette: DEFAULT_PALETTE });
		const good = JSON.parse(serializeProject(doc));
		expect(() => parseProject('not json')).toThrow(/not JSON/);
		expect(() => parseProject(JSON.stringify({ ...good, format: 'x' }))).toThrow(/format/);
		expect(() => parseProject(JSON.stringify({ ...good, version: 99 }))).toThrow(/version/);
		expect(() =>
			parseProject(JSON.stringify({ ...good, meta: { ...good.meta, width: 4096 } }))
		).toThrow(/size/);
		expect(() => parseProject(JSON.stringify({ ...good, frames: [] }))).toThrow(/frames/);
		// truncated pixel buffer
		good.frames[0].layers[0].pixels = 'AAAA';
		expect(() => parseProject(JSON.stringify(good))).toThrow(/mismatch/);
	});

	it('rejects pixels pointing past the palette', () => {
		const doc = createDoc({ width: 2, height: 2, palette: ['#ff0000'] });
		doc.frames[0].layers[0].pixels[0] = 1; // valid
		const good = JSON.parse(serializeProject(doc));
		const bad = createDoc({ width: 2, height: 2, palette: ['#ff0000'] });
		bad.frames[0].layers[0].pixels[0] = 9; // out of range
		const badJson = JSON.parse(serializeProject(bad));
		expect(() => parseProject(JSON.stringify(good))).not.toThrow();
		expect(() => parseProject(JSON.stringify(badJson))).toThrow(/out-of-palette/);
	});
});
