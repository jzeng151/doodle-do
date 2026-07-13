<script lang="ts">
	// Phase 0 spike page: pencil + frames + live loop. No UI polish (§7).
	import { onMount } from 'svelte';
	import { createDoc } from '$lib/core/document';
	import { DEFAULT_PALETTE } from '$lib/core/palette';
	import { CommandBus } from '$lib/core/commands';
	import { Compositor } from '$lib/render/compositor';
	import { LoopPlayer } from '$lib/render/loop';
	import { StrokeBuilder } from '$lib/tools/pencil';

	const SCALE = 12;
	const doc = createDoc({ width: 32, height: 32, palette: DEFAULT_PALETTE });

	let editorEl: HTMLCanvasElement;
	let loopEl: HTMLCanvasElement;
	let bus: CommandBus;
	let compositor: Compositor;
	let stroke: StrokeBuilder | null = null;

	let currentFrame = $state(0);
	let colorValue = $state(1); // pixel value; palette[colorValue - 1]
	let canUndo = $state(false);
	let canRedo = $state(false);

	function repaintEditor() {
		const ctx = editorEl.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, editorEl.width, editorEl.height);
		ctx.drawImage(compositor.frameCanvas(currentFrame), 0, 0, editorEl.width, editorEl.height);
	}

	onMount(() => {
		bus = new CommandBus(doc);
		compositor = new Compositor(doc);
		bus.onChange((region) => {
			compositor.invalidate(region);
			repaintEditor();
			canUndo = bus.canUndo;
			canRedo = bus.canRedo;
		});
		const loop = new LoopPlayer(doc, compositor, loopEl);
		loop.start();
		repaintEditor();
		return () => loop.stop();
	});

	function pixelFromEvent(e: PointerEvent): { x: number; y: number } {
		const rect = editorEl.getBoundingClientRect();
		return {
			x: Math.floor(((e.clientX - rect.left) / rect.width) * doc.meta.width),
			y: Math.floor(((e.clientY - rect.top) / rect.height) * doc.meta.height)
		};
	}

	function onPointerDown(e: PointerEvent) {
		editorEl.setPointerCapture(e.pointerId);
		stroke = new StrokeBuilder(doc, currentFrame, 0, colorValue);
		const { x, y } = pixelFromEvent(e);
		const rect = stroke.begin(x, y);
		if (rect) bus.emitChange({ frame: currentFrame, rect });
	}

	function onPointerMove(e: PointerEvent) {
		if (!stroke) return;
		const { x, y } = pixelFromEvent(e);
		const rect = stroke.moveTo(x, y);
		if (rect) bus.emitChange({ frame: currentFrame, rect });
	}

	function onPointerUp() {
		if (!stroke) return;
		const cmd = stroke.end();
		stroke = null;
		if (cmd) bus.dispatch(cmd, { applied: true });
	}

	function selectFrame(i: number) {
		currentFrame = i;
		repaintEditor();
	}
</script>

<main>
	<h1>Doodle-Do — Phase 0 spike</h1>

	<div class="workspace">
		<canvas
			bind:this={editorEl}
			class="editor"
			width={doc.meta.width * SCALE}
			height={doc.meta.height * SCALE}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
		></canvas>

		<div class="side">
			<canvas
				bind:this={loopEl}
				class="loop"
				width={doc.meta.width * 4}
				height={doc.meta.height * 4}
			></canvas>
			<div class="frames">
				{#each doc.frames as _, i (i)}
					<button class:active={i === currentFrame} onclick={() => selectFrame(i)}>
						Frame {i + 1}
					</button>
				{/each}
			</div>
			<div class="history">
				<button disabled={!canUndo} onclick={() => bus.undo()}>Undo</button>
				<button disabled={!canRedo} onclick={() => bus.redo()}>Redo</button>
			</div>
			<div class="palette">
				<button
					class="swatch eraser"
					class:active={colorValue === 0}
					title="Eraser"
					aria-label="Eraser"
					onclick={() => (colorValue = 0)}
				></button>
				{#each doc.palette as hex, i (i)}
					<button
						class="swatch"
						class:active={colorValue === i + 1}
						style="background: {hex}"
						title={hex}
						aria-label={hex}
						onclick={() => (colorValue = i + 1)}
					></button>
				{/each}
			</div>
		</div>
	</div>
</main>

<style>
	main {
		font-family: system-ui, sans-serif;
		padding: 1rem;
	}
	.workspace {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
	}
	canvas {
		image-rendering: pixelated;
		/* checkerboard transparency background */
		background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
		border: 1px solid #999;
	}
	.editor {
		touch-action: none;
		cursor: crosshair;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.palette {
		display: grid;
		grid-template-columns: repeat(6, 24px);
		gap: 4px;
	}
	.swatch {
		width: 24px;
		height: 24px;
		border: 1px solid #999;
		padding: 0;
		cursor: pointer;
	}
	.swatch.active {
		outline: 2px solid #000;
	}
	.eraser {
		background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 8px 8px;
	}
	.frames,
	.history {
		display: flex;
		gap: 4px;
	}
	button.active {
		font-weight: bold;
	}
</style>
