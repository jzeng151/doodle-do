// Benchmark scenarios (§5). Runs in the browser via the /bench route.
// Deterministic: seeded PRNG, fixed stroke script, so runs are comparable
// across machines and commits.
//
// Latency definition for the Phase 0 gate: synchronous cost from a pointer
// event being applied (StrokeBuilder.moveTo) through dirty-rect composite
// and blit to BOTH the editor canvas and the live-loop canvas. The display
// then presents on the next vsync; that part is not controllable by us.

import { createDoc, type Doc } from '../src/lib/core/document';
import { DEFAULT_PALETTE } from '../src/lib/core/palette';
import { CommandBus } from '../src/lib/core/commands';
import { Compositor } from '../src/lib/render/compositor';
import { StrokeBuilder } from '../src/lib/tools/pencil';

export interface Stats {
	count: number;
	mean: number;
	p50: number;
	p95: number;
	max: number;
}

export interface BenchResults {
	// The Phase 0 gate: 64×64, 4 layers
	strokeToLoop: Stats;
	strokeToLoopOutliers: { index: number; ms: number }[]; // top 5, to localize hitches
	strokeFinalize: Stats; // pointer-up: build command + dispatch + repaint
	// Informational (Phase 3 grid gate): full redraw of 12 frame thumbnails
	gridRedrawMs: number;
	// Informational: worst-case full composite at the 128×128 / 8-layer cap
	worstCaseCompositeMs: number;
	gate: { limitMs: number; passed: boolean };
}

function lcg(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 0xffffffff;
	};
}

function stats(samples: number[]): Stats {
	const sorted = [...samples].sort((a, b) => a - b);
	const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
	return {
		count: sorted.length,
		mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
		p50: at(0.5),
		p95: at(0.95),
		max: sorted[sorted.length - 1]
	};
}

function fillNoise(doc: Doc, rand: () => number, coverage: number): void {
	for (const frame of doc.frames) {
		for (const layer of frame.layers) {
			for (let i = 0; i < layer.pixels.length; i++) {
				layer.pixels[i] = rand() < coverage ? 1 + Math.floor(rand() * 15) : 0;
			}
		}
	}
}

function makeTarget(w: number, h: number): CanvasRenderingContext2D {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const ctx = c.getContext('2d')!;
	ctx.imageSmoothingEnabled = false;
	return ctx;
}

export const GATE_LIMIT_MS = 16;
const STROKES = 100;
const MOVES_PER_STROKE = 30;

export async function runBench(): Promise<BenchResults> {
	const rand = lcg(0xd00d1e);

	// --- Gate scenario: 64×64, 4 layers, 12 frames ---
	const doc = createDoc({
		width: 64,
		height: 64,
		palette: DEFAULT_PALETTE,
		frameCount: 12,
		layerCount: 4
	});
	fillNoise(doc, rand, 0.25);

	const bus = new CommandBus(doc);
	const compositor = new Compositor(doc);
	bus.onChange((region) => compositor.invalidate(region));
	const editor = makeTarget(64 * 8, 64 * 8);
	const loop = makeTarget(64 * 4, 64 * 4);

	const blit = (frame: number) => {
		const src = compositor.frameCanvas(frame); // recomposites dirty rect
		editor.drawImage(src, 0, 0, editor.canvas.width, editor.canvas.height);
		loop.drawImage(src, 0, 0, loop.canvas.width, loop.canvas.height);
	};

	// warm up JIT + canvases
	for (let f = 0; f < doc.frames.length; f++) compositor.frameCanvas(f);

	const moveSamples: number[] = [];
	const finalizeSamples: number[] = [];
	for (let s = 0; s < STROKES; s++) {
		// Yield to the compositor between strokes, like real pointer input does.
		// Without this, thousands of unpresented drawImage calls pile up and
		// Chrome eventually forces a ~300ms sync raster flush — a backpressure
		// artifact of the tight loop, not a latency the pipeline exhibits.
		await new Promise(requestAnimationFrame);
		const frame = s % doc.frames.length;
		const layer = s % 4;
		const builder = new StrokeBuilder(doc, frame, layer, 1 + (s % 15), 1 + (s % 2));
		let x = 4 + Math.floor(rand() * 56);
		let y = 4 + Math.floor(rand() * 56);
		builder.begin(x, y);
		compositor.invalidate({ frame, rect: { x, y, w: 2, h: 2 } });
		blit(frame);

		for (let m = 0; m < MOVES_PER_STROKE; m++) {
			x = Math.max(0, Math.min(63, x + Math.floor(rand() * 7) - 3));
			y = Math.max(0, Math.min(63, y + Math.floor(rand() * 7) - 3));
			const t0 = performance.now();
			const rect = builder.moveTo(x, y);
			if (rect) compositor.invalidate({ frame, rect });
			blit(frame);
			moveSamples.push(performance.now() - t0);
		}

		const t0 = performance.now();
		const cmd = builder.end();
		if (cmd) bus.dispatch(cmd, { applied: true });
		blit(frame);
		finalizeSamples.push(performance.now() - t0);
	}

	// --- Grid redraw: full recomposite + blit of all 12 frames ---
	const thumbs = Array.from({ length: doc.frames.length }, () => makeTarget(64, 64));
	compositor.invalidate({ frame: null, rect: null });
	const g0 = performance.now();
	for (let f = 0; f < doc.frames.length; f++) {
		thumbs[f].drawImage(compositor.frameCanvas(f), 0, 0);
	}
	const gridRedrawMs = performance.now() - g0;

	// --- Worst case: 128×128, 8 layers, full composite ---
	const worst = createDoc({
		width: 128,
		height: 128,
		palette: DEFAULT_PALETTE,
		frameCount: 1,
		layerCount: 8
	});
	fillNoise(worst, rand, 0.25);
	const worstComp = new Compositor(worst);
	worstComp.frameCanvas(0); // build cache
	worstComp.invalidate({ frame: null, rect: null });
	const w0 = performance.now();
	worstComp.frameCanvas(0);
	const worstCaseCompositeMs = performance.now() - w0;

	const strokeToLoop = stats(moveSamples);
	const strokeToLoopOutliers = moveSamples
		.map((ms, index) => ({ index, ms }))
		.sort((a, b) => b.ms - a.ms)
		.slice(0, 5);
	return {
		strokeToLoop,
		strokeToLoopOutliers,
		strokeFinalize: stats(finalizeSamples),
		gridRedrawMs,
		worstCaseCompositeMs,
		gate: { limitMs: GATE_LIMIT_MS, passed: strokeToLoop.p95 < GATE_LIMIT_MS }
	};
}
