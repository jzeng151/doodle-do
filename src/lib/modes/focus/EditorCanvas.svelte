<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { buildLut } from '$lib/core/palette';
	import { drawOnionGhost, ONION_NEXT_COLOR, ONION_PREV_COLOR } from '$lib/render/onion';

	let { session }: { session: EditorSession } = $props();

	let canvasEl: HTMLCanvasElement;
	let selectDrag: 'marquee' | 'float' | null = null;
	let lastPixel = { x: 0, y: 0 };

	const cssW = $derived((session.version, session.doc.meta.width * session.zoom));
	const cssH = $derived((session.version, session.doc.meta.height * session.zoom));

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

		drawSelectionOverlay(ctx);
	}

	function drawSelectionOverlay(ctx: CanvasRenderingContext2D) {
		const z = session.zoom;
		const sel = session.floating;
		if (sel) {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(floatingCanvas(sel), sel.x * z, sel.y * z, sel.w * z, sel.h * z);
		}
		const rect = sel?.rect ?? session.marquee;
		if (rect) {
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 3]);
			ctx.strokeRect(rect.x * z + 0.5, rect.y * z + 0.5, rect.w * z - 1, rect.h * z - 1);
			ctx.strokeStyle = '#000';
			ctx.lineDashOffset = 4;
			ctx.strokeRect(rect.x * z + 0.5, rect.y * z + 0.5, rect.w * z - 1, rect.h * z - 1);
			ctx.setLineDash([]);
			ctx.lineDashOffset = 0;
		}
	}

	// the floating buffer rendered as RGBA, rebuilt only when content flips
	let floatCache: { sel: unknown; version: number; canvas: HTMLCanvasElement } | null = null;
	function floatingCanvas(sel: NonNullable<typeof session.floating>): HTMLCanvasElement {
		if (floatCache?.sel === sel && floatCache.version === sel.version) return floatCache.canvas;
		const canvas = document.createElement('canvas');
		canvas.width = sel.w;
		canvas.height = sel.h;
		const ctx = canvas.getContext('2d')!;
		const img = ctx.createImageData(sel.w, sel.h);
		const u32 = new Uint32Array(img.data.buffer);
		const lut = buildLut(session.doc.palette);
		for (let i = 0; i < sel.buffer.length; i++) u32[i] = lut[sel.buffer[i]];
		ctx.putImageData(img, 0, 0);
		floatCache = { sel, version: sel.version, canvas };
		return canvas;
	}

	$effect(() => {
		// repaint on any document change or relevant view-state change
		void session.version;
		void session.overlayVersion;
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
			case 'select': {
				canvasEl.setPointerCapture(e.pointerId);
				lastPixel = { x, y };
				const inFloating = session.floating?.contains(x, y);
				const inMarquee =
					!session.floating &&
					session.marquee &&
					x >= session.marquee.x &&
					x < session.marquee.x + session.marquee.w &&
					y >= session.marquee.y &&
					y < session.marquee.y + session.marquee.h;
				if (inFloating || inMarquee) {
					session.liftSelection(); // no-op when already floating
					selectDrag = 'float';
				} else {
					// click outside stamps the pending selection down (B5)
					session.beginMarquee(x, y);
					selectDrag = 'marquee';
				}
				break;
			}
		}
	}

	function onPointerMove(e: PointerEvent) {
		const { x, y } = pixelFromEvent(e);
		if (selectDrag === 'marquee') {
			session.updateMarquee(x, y);
			return;
		}
		if (selectDrag === 'float') {
			session.moveFloatingBy(x - lastPixel.x, y - lastPixel.y);
			lastPixel = { x, y };
			return;
		}
		if (session.strokeActive) session.strokeMove(x, y);
	}

	function onPointerUp() {
		if (selectDrag === 'marquee') session.endMarquee();
		selectDrag = null;
		session.strokeEnd();
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
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
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
	.editor[data-tool='select'] {
		cursor: default;
	}
</style>
