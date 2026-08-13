<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { floatingFrameCanvas } from '../canvas';
	let { session }: { session: EditorSession } = $props();
	let canvas: HTMLCanvasElement;
	const width = $derived((session.version, session.doc.meta.width * 3));
	const height = $derived((session.version, session.doc.meta.height * 3));
	$effect(() => {
		void session.version;
		void session.overlayVersion;
		void session.currentFrame;
		if (!canvas) return;
		const ctx = canvas.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const source = floatingFrameCanvas(session, session.currentFrame) ?? session.compositor.frameCanvas(session.currentFrame);
		for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) ctx.drawImage(source, x * session.doc.meta.width, y * session.doc.meta.height);
	});
</script>

<section aria-labelledby="tile-preview-heading">
	<h2 id="tile-preview-heading">Tile preview</h2>
	<canvas bind:this={canvas} {width} {height} aria-label="Three by three seamless tile preview"></canvas>
</section>

<style>
	section { display: grid; gap: .5rem; }
	h2 { margin: 0; font-size: .6875rem; letter-spacing: .14em; text-transform: uppercase; }
	canvas { width: 100%; image-rendering: pixelated; border: 2px solid var(--ink); background: var(--checker-light); }
</style>
