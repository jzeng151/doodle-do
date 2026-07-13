<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { drawOnionGhost, ONION_NEXT_COLOR, ONION_PREV_COLOR } from '$lib/render/onion';

	let { session }: { session: EditorSession } = $props();

	let canvasEl: HTMLCanvasElement;

	const cssW = $derived(session.doc.meta.width * session.zoom);
	const cssH = $derived(session.doc.meta.height * session.zoom);

	function repaint() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

		const { frames } = session.doc;
		const f = session.currentFrame;
		if (session.onionEnabled && frames.length > 1) {
			// previous N=1 red, next N=1 green (§4.3 defaults), flattened composite
			const prev = (f - 1 + frames.length) % frames.length;
			const next = (f + 1) % frames.length;
			drawOnionGhost(ctx, session.compositor.frameCanvas(prev), ONION_PREV_COLOR, session.onionOpacity);
			if (next !== prev) {
				drawOnionGhost(ctx, session.compositor.frameCanvas(next), ONION_NEXT_COLOR, session.onionOpacity);
			}
		}
		ctx.drawImage(session.compositor.frameCanvas(f), 0, 0, canvasEl.width, canvasEl.height);

		if (session.showGrid && session.zoom >= 4) {
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (let x = 1; x < session.doc.meta.width; x++) {
				ctx.moveTo(x * session.zoom + 0.5, 0);
				ctx.lineTo(x * session.zoom + 0.5, canvasEl.height);
			}
			for (let y = 1; y < session.doc.meta.height; y++) {
				ctx.moveTo(0, y * session.zoom + 0.5);
				ctx.lineTo(canvasEl.width, y * session.zoom + 0.5);
			}
			ctx.stroke();
		}
	}

	$effect(() => {
		// repaint on any document change or relevant view-state change
		void session.version;
		void session.currentFrame;
		void session.zoom;
		void session.showGrid;
		void session.onionEnabled;
		void session.onionOpacity;
		repaint();
	});

	function pixelFromEvent(e: PointerEvent): { x: number; y: number } {
		const rect = canvasEl.getBoundingClientRect();
		return {
			x: Math.floor(((e.clientX - rect.left) / rect.width) * session.doc.meta.width),
			y: Math.floor(((e.clientY - rect.top) / rect.height) * session.doc.meta.height)
		};
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		const { x, y } = pixelFromEvent(e);
		switch (session.tool) {
			case 'pencil':
			case 'eraser':
				canvasEl.setPointerCapture(e.pointerId);
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

	function onPointerMove(e: PointerEvent) {
		if (!session.strokeActive) return;
		const { x, y } = pixelFromEvent(e);
		session.strokeMove(x, y);
	}

	function onWheel(e: WheelEvent) {
		if (!e.ctrlKey) return;
		e.preventDefault();
		session.zoom = Math.max(2, Math.min(24, session.zoom + (e.deltaY < 0 ? 1 : -1)));
	}
</script>

<div class="scroll" onwheel={onWheel}>
	<canvas
		bind:this={canvasEl}
		class="editor"
		data-tool={session.tool}
		width={cssW}
		height={cssH}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={() => session.strokeEnd()}
		onpointercancel={() => session.strokeEnd()}
	></canvas>
</div>

<style>
	.scroll {
		overflow: auto; /* pan = scroll */
		display: grid;
		place-items: center;
		flex: 1;
		min-height: 0;
		background: #23252a;
	}
	.editor {
		image-rendering: pixelated;
		background: repeating-conic-gradient(#3a3d44 0% 25%, #2e3036 0% 50%) 0 0 / 16px 16px;
		touch-action: none;
		cursor: crosshair;
	}
	.editor[data-tool='eyedropper'] {
		cursor: copy;
	}
</style>
