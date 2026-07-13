import { describe, expect, it } from 'vitest';
import { MAX_PALETTE } from '../../core/document';
import { packColor, buildLut } from '../../core/palette';
import { ALPHA_THRESHOLD, detectStrip, manifestEntryFor, stripToDoc, type RgbaImage } from './strip';

function makeImage(width: number, height: number): RgbaImage {
	return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

function setPx(img: RgbaImage, x: number, y: number, r: number, g: number, b: number, a = 255) {
	const i = (y * img.width + x) * 4;
	img.data[i] = r;
	img.data[i + 1] = g;
	img.data[i + 2] = b;
	img.data[i + 3] = a;
}

describe('detectStrip', () => {
	it('splits width by height', () => {
		expect(detectStrip(makeImage(768, 96))).toEqual({ frameSize: 96, frameCount: 8 });
		expect(detectStrip(makeImage(4, 4))).toEqual({ frameSize: 4, frameCount: 1 });
	});

	it('rejects non-uniform strips and oversized frames', () => {
		expect(() => detectStrip(makeImage(100, 96))).toThrow(/not a uniform strip/);
		expect(() => detectStrip(makeImage(1586, 992))).toThrow(/canvas cap/);
	});
});

describe('stripToDoc — exact palette path', () => {
	it('splits frames and maps colors 1:1 when they fit', () => {
		const img = makeImage(8, 4); // 2 frames of 4×4
		setPx(img, 0, 0, 255, 0, 0); // frame 0
		setPx(img, 1, 1, 0, 255, 0); // frame 0
		setPx(img, 4, 2, 255, 0, 0); // frame 1, same red
		setPx(img, 7, 3, 0, 0, 255); // frame 1

		const doc = stripToDoc(img, 'test');
		expect(doc.meta).toMatchObject({ name: 'test', width: 4, height: 4, fps: 8 });
		expect(doc.frames).toHaveLength(2);
		expect(doc.palette).toEqual(['#ff0000', '#00ff00', '#0000ff']);

		const f0 = doc.frames[0].layers[0].pixels;
		const f1 = doc.frames[1].layers[0].pixels;
		expect(f0[0]).toBe(1); // red
		expect(f0[1 * 4 + 1]).toBe(2); // green
		expect(f1[2 * 4 + 0]).toBe(1); // same red, same index
		expect(f1[3 * 4 + 3]).toBe(3); // blue
		expect(f0[2]).toBe(0); // untouched → transparent
	});

	it('thresholds alpha: below 128 transparent, above opaque', () => {
		const img = makeImage(4, 4);
		setPx(img, 0, 0, 10, 20, 30, ALPHA_THRESHOLD - 1);
		setPx(img, 1, 0, 10, 20, 30, ALPHA_THRESHOLD);
		const doc = stripToDoc(img, 'alpha');
		expect(doc.frames[0].layers[0].pixels[0]).toBe(0);
		expect(doc.frames[0].layers[0].pixels[1]).toBe(1);
	});

	it('applies manifest frameMs to every frame', () => {
		const img = makeImage(8, 4);
		const doc = stripToDoc(img, 'timed', { frameMs: 220 });
		expect(doc.frames.map((f) => f.durationMs)).toEqual([220, 220]);
	});
});

describe('stripToDoc — quantization path', () => {
	it('reduces >64 colors to a valid ≤64-entry palette covering every pixel', () => {
		const img = makeImage(16, 16); // 256 pixels, 200 unique colors
		for (let i = 0; i < 200; i++) {
			setPx(img, i % 16, Math.floor(i / 16), i, 255 - i, (i * 7) % 256);
		}
		const doc = stripToDoc(img, 'noisy');
		expect(doc.palette.length).toBeLessThanOrEqual(MAX_PALETTE);
		expect(doc.palette.length).toBeGreaterThan(0);
		const pixels = doc.frames[0].layers[0].pixels;
		for (let i = 0; i < 200; i++) {
			expect(pixels[i]).toBeGreaterThan(0);
			expect(pixels[i]).toBeLessThanOrEqual(doc.palette.length);
		}
		// remaining pixels stay transparent
		expect(pixels[255]).toBe(0);
		// palette entries must be renderable
		expect(() => buildLut(doc.palette)).not.toThrow();
	});

	it('quantized colors stay near the originals', () => {
		const img = makeImage(16, 16);
		for (let i = 0; i < 256; i++) setPx(img, i % 16, (i / 16) | 0, 200, (i * 5) % 40, 10);
		const doc = stripToDoc(img, 'reds');
		// all source pixels are strong red; every palette entry should be too
		for (const hexColor of doc.palette) {
			const packed = packColor(hexColor);
			const r = packed & 0xff;
			expect(r).toBeGreaterThan(150);
		}
	});
});

describe('manifestEntryFor', () => {
	const manifest = JSON.stringify({
		schemaVersion: 1,
		animations: {
			idle: { src: 'sprites/idle.png', frames: 8, frameMs: 220, loop: true },
			sick: { src: 'sprites/sick-idle.png', frames: 3, frameMs: 340 }
		}
	});

	it('matches by src basename', () => {
		expect(manifestEntryFor(manifest, 'sick-idle.png')).toEqual({ frames: 3, frameMs: 340 });
		expect(manifestEntryFor(manifest, 'idle.png')).toEqual({ frames: 8, frameMs: 220 });
	});

	it('returns null for unknown files or manifests without animations', () => {
		expect(manifestEntryFor(manifest, 'nope.png')).toBeNull();
		expect(manifestEntryFor('{}', 'idle.png')).toBeNull();
	});

	it('throws on malformed JSON', () => {
		expect(() => manifestEntryFor('nope', 'idle.png')).toThrow(/JSON/);
	});
});
