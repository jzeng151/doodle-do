<script lang="ts">
	// Canvas renderer for the mockup artwork. Nearest-neighbour only: the real
	// document model is 1-bit alpha with no anti-aliasing, and a mockup that
	// smooths its sprites is lying about the medium.
	import { onMount } from 'svelte';
	import { hexAt, SPRITE_H, SPRITE_W, WALK, WALK_MS } from './sprites';

	let {
		frames = WALK,
		frame = 0,
		playing = false,
		fps = 8,
		scale = 4,
		onion = 0,
		grid = false,
		class: klass = ''
	}: {
		frames?: Uint8Array[];
		frame?: number;
		playing?: boolean;
		fps?: number;
		scale?: number;
		/** Onion-skin opacity; 0 disables. Previous frame red, next frame green. */
		onion?: number;
		grid?: boolean;
		class?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let live = $state(0);

	const shown = $derived(playing ? live : frame);

	function paint(px: Uint8Array, ctx: CanvasRenderingContext2D, tint: string | null, alpha: number) {
		ctx.globalAlpha = alpha;
		for (let y = 0; y < SPRITE_H; y++) {
			for (let x = 0; x < SPRITE_W; x++) {
				const v = px[y * SPRITE_W + x];
				if (!v) continue;
				ctx.fillStyle = tint ?? hexAt(v)!;
				ctx.fillRect(x * scale, y * scale, scale, scale);
			}
		}
		ctx.globalAlpha = 1;
	}

	$effect(() => {
		const ctx = canvas?.getContext('2d');
		if (!ctx) return;
		const i = shown;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (onion > 0) {
			paint(frames[(i - 1 + frames.length) % frames.length], ctx, '#d04648', onion);
			paint(frames[(i + 1) % frames.length], ctx, '#6daa2c', onion);
		}
		paint(frames[i], ctx, null, 1);
		if (grid) {
			ctx.strokeStyle = 'rgba(255,255,255,0.09)';
			ctx.lineWidth = 1;
			for (let x = 1; x < SPRITE_W; x++) {
				ctx.beginPath();
				ctx.moveTo(x * scale + 0.5, 0);
				ctx.lineTo(x * scale + 0.5, SPRITE_H * scale);
				ctx.stroke();
			}
			for (let y = 1; y < SPRITE_H; y++) {
				ctx.beginPath();
				ctx.moveTo(0, y * scale + 0.5);
				ctx.lineTo(SPRITE_W * scale, y * scale + 0.5);
				ctx.stroke();
			}
		}
	});

	onMount(() => {
		if (!playing) return;
		const step = WALK_MS[0] ?? 1000 / fps;
		const timer = setInterval(() => (live = (live + 1) % frames.length), step);
		return () => clearInterval(timer);
	});
</script>

<canvas
	bind:this={canvas}
	width={SPRITE_W * scale}
	height={SPRITE_H * scale}
	class={klass}
	aria-label="Four-frame white chicken walk cycle, drawn in Doodle-Do"
></canvas>

<style>
	canvas {
		image-rendering: pixelated;
		display: block;
	}
</style>
