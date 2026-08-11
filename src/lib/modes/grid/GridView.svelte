<script lang="ts">
	// Grid mode (§3.3): all frames as simultaneously editable canvases +
	// docked live loop. Same tools, same commands — a stroke on any tile
	// targets that frame directly.
	import type { EditorSession } from '$lib/editor/session.svelte';
	import SidePanel from '../SidePanel.svelte';
	import FrameStrip from '../focus/FrameStrip.svelte';

	let { session }: { session: EditorSession } = $props();

	let tiles: (HTMLCanvasElement | undefined)[] = $state([]);
	let strokeTile = -1;

	const frameCount = $derived((session.version, session.doc.frames.length));
	const tileW = $derived((session.version, session.doc.meta.width * session.gridZoom));
	const tileH = $derived((session.version, session.doc.meta.height * session.gridZoom));

	$effect(() => {
		void session.version;
		void session.gridZoom;
		for (let i = 0; i < session.doc.frames.length; i++) {
			const el = tiles[i];
			if (!el) continue;
			const ctx = el.getContext('2d')!;
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, el.width, el.height);
			ctx.drawImage(session.compositor.frameCanvas(i), 0, 0, el.width, el.height);
		}
	});

	function pixelFromEvent(e: PointerEvent, el: HTMLCanvasElement) {
		const rect = el.getBoundingClientRect();
		return {
			x: Math.floor(((e.clientX - rect.left) / rect.width) * session.doc.meta.width),
			y: Math.floor(((e.clientY - rect.top) / rect.height) * session.doc.meta.height)
		};
	}

	function onPointerDown(e: PointerEvent, i: number) {
		if (e.button !== 0) return;
		const el = tiles[i]!;
		const { x, y } = pixelFromEvent(e, el);
		session.selectFrame(i);
		switch (session.tool) {
			case 'pencil':
			case 'eraser':
				el.setPointerCapture(e.pointerId);
				strokeTile = i;
				session.strokeBegin(x, y);
				break;
			case 'fill':
				session.fill(x, y);
				break;
			case 'eyedropper':
				session.eyedrop(x, y);
				break;
		}
	}

	function onPointerMove(e: PointerEvent, i: number) {
		if (strokeTile !== i || !session.strokeActive) return;
		const { x, y } = pixelFromEvent(e, tiles[i]!);
		session.strokeMove(x, y);
	}

	function onPointerUp() {
		strokeTile = -1;
		session.strokeEnd();
	}
</script>

<div class="middle">
	<div class="grid-area">
		<div class="grid-tools">
			<button title="Smaller tiles" onclick={() => (session.gridZoom = Math.max(1, session.gridZoom - 1))}>
				−
			</button>
			<span class="zoom">{session.gridZoom}×</span>
			<button title="Larger tiles" onclick={() => (session.gridZoom = Math.min(12, session.gridZoom + 1))}>
				+
			</button>
		</div>
		<div class="tiles" role="listbox" aria-label="Editable frames">
			{#each { length: frameCount } as _, i (i)}
				<div class="tile" class:active={i === session.currentFrame} role="option" aria-selected={i === session.currentFrame}>
					<span class="num">{i + 1}</span>
					<canvas
						bind:this={tiles[i]}
						width={tileW}
						height={tileH}
						onpointerdown={(e) => onPointerDown(e, i)}
						onpointermove={(e) => onPointerMove(e, i)}
						onpointerup={onPointerUp}
						onpointercancel={onPointerUp}
					></canvas>
				</div>
			{/each}
		</div>
	</div>
	<SidePanel {session} />
</div>
<FrameStrip {session} thumbs={false} />

<style>
	.middle {
		display: flex;
		flex: 1;
		min-height: 0;
	}
	.grid-area {
		flex: 1;
		min-width: 0;
		overflow: auto;
		background-color: var(--paper-2);
		background-image: radial-gradient(rgba(17,17,17,.22) .7px, transparent .9px);
		background-size: 6px 6px;
		padding: 0.75rem;
	}
	.grid-tools {
		display: flex;
		gap: 4px;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	.zoom {
		min-width: 2.5em;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.tiles {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-content: flex-start;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px;
		border: 3px solid transparent;
	}
	.tile.active {
		border-color: var(--ink);
		background: var(--paper);
	}
	.num {
		font-size: 0.625rem;
		font-weight: 900;
		letter-spacing: .1em;
		opacity: 0.7;
	}
	canvas {
		image-rendering: pixelated;
		background: repeating-conic-gradient(#ddd9ce 0% 25%, #f7f4ec 0% 50%) 0 0 / 16px 16px;
		border: 2px solid var(--ink);
		touch-action: none;
		cursor: crosshair;
	}
	@media (max-width: 860px) {
		.middle { flex: none; flex-direction: column; }
		.grid-area { min-height: 420px; }
	}
</style>
