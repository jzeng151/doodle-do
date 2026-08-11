<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { buildLut } from '$lib/core/palette';
	import { drawOnionGhost, ONION_NEXT_COLOR, ONION_PREV_COLOR } from '$lib/render/onion';

	let { session }: { session: EditorSession } = $props();

	let canvasEl: HTMLCanvasElement;
	let selectDrag: 'marquee' | 'lasso' | 'float' | 'rotate' | null = null;
	let rotateStart: { angle0: number; grab: number } | null = null;
	let dragMirrored = false; // float-drag started inside the mirror twin
	let lastPixel = { x: 0, y: 0 };
	let keyboardX = $state(0);
	let keyboardY = $state(0);
	let keyboardFocused = $state(false);
	let keyboardMarquee = $state(false);
	let keyboardStatus = $state('');

	// rotate-handle geometry in CSS px; e2e/selection.spec.ts mirrors these
	const HANDLE_OFFSET = 16;
	const HANDLE_R = 8;

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
			drawOnionGhost(ctx, session.compositor.frameCanvas(prev), ONION_PREV_COLOR, session.onionOpacity * 0.55);
			if (next !== prev) {
				drawOnionGhost(ctx, session.compositor.frameCanvas(next), ONION_NEXT_COLOR, session.onionOpacity);
			}
		}
		if (session.bulkFrames.length > 1) {
			// bulk edit: the other set frames stacked under the active one
			ctx.globalAlpha = 0.35;
			for (const bf of session.bulkFrames) {
				if (bf === f) continue;
				ctx.drawImage(session.compositor.frameCanvas(bf), 0, 0, canvasEl.width, canvasEl.height);
			}
			ctx.globalAlpha = 1;
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
		if (keyboardFocused) drawKeyboardCursor(ctx);
	}

	function drawKeyboardCursor(ctx: CanvasRenderingContext2D) {
		const z = session.zoom;
		ctx.save();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 3;
		ctx.strokeRect(keyboardX * z + 1.5, keyboardY * z + 1.5, z - 3, z - 3);
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		ctx.strokeRect(keyboardX * z + 1.5, keyboardY * z + 1.5, z - 3, z - 3);
		ctx.restore();
	}

	function drawSelectionOverlay(ctx: CanvasRenderingContext2D) {
		const z = session.zoom;
		const sel = session.floating;
		if (sel) {
			ctx.imageSmoothingEnabled = false;
			for (const s of [session.floatingTwin, sel]) {
				if (!s) continue;
				const r = s.renderRect;
				ctx.drawImage(floatingCanvas(s), r.x * z, r.y * z, r.w * z, r.h * z);
				// rotated group outline
				dashedStroke(ctx, () => {
					ctx.beginPath();
					for (const [i, [cx, cy]] of s.corners().entries()) {
						if (i === 0) ctx.moveTo(cx * z, cy * z);
						else ctx.lineTo(cx * z, cy * z);
					}
					ctx.closePath();
					ctx.stroke();
				});
			}
		} else if (session.selectionMask) {
			// marching ants around the baked mask
			const mask = session.selectionMask;
			const { width: w, height: h } = session.doc.meta;
			const ants = () =>
				dashedStroke(ctx, () => {
					ctx.beginPath();
					for (let y = 0; y < h; y++) {
						for (let x = 0; x < w; x++) {
							if (!mask[y * w + x]) continue;
							if (!mask[y * w + x - 1] || x === 0) {
								ctx.moveTo(x * z + 0.5, y * z);
								ctx.lineTo(x * z + 0.5, (y + 1) * z);
							}
							if (!mask[y * w + x + 1] || x === w - 1) {
								ctx.moveTo((x + 1) * z - 0.5, y * z);
								ctx.lineTo((x + 1) * z - 0.5, (y + 1) * z);
							}
							if (y === 0 || !mask[(y - 1) * w + x]) {
								ctx.moveTo(x * z, y * z + 0.5);
								ctx.lineTo((x + 1) * z, y * z + 0.5);
							}
							if (y === h - 1 || !mask[(y + 1) * w + x]) {
								ctx.moveTo(x * z, (y + 1) * z - 0.5);
								ctx.lineTo((x + 1) * z, (y + 1) * z - 0.5);
							}
						}
					}
					ctx.stroke();
				});
			ants();
			if (session.mirrorX) {
				// the twin the selection will lift with, drawn mirrored
				ctx.save();
				ctx.translate(w * z, 0);
				ctx.scale(-1, 1);
				ants();
				ctx.restore();
			}
		}
		if (session.pendingRect) {
			const m = session.pendingRect;
			dashedStroke(ctx, () =>
				ctx.strokeRect(m.x * z + 0.5, m.y * z + 0.5, m.w * z - 1, m.h * z - 1)
			);
		}
		const path = session.lassoPath ?? session.polygonVerts;
		if (path?.length) {
			dashedStroke(ctx, () => {
				ctx.beginPath();
				for (const [i, p] of path.entries()) {
					if (i === 0) ctx.moveTo(p.x * z, p.y * z);
					else ctx.lineTo(p.x * z, p.y * z);
				}
				ctx.stroke();
			});
			if (session.polygonVerts) {
				// mark the first vertex: clicking it closes the polygon
				ctx.beginPath();
				ctx.arc(path[0].x * z, path[0].y * z, 4, 0, Math.PI * 2);
				ctx.fillStyle = '#fff';
				ctx.fill();
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}
		const hp = handleScreenPos();
		if (hp) {
			ctx.beginPath();
			ctx.arc(hp.x, hp.y, 4, 0, Math.PI * 2);
			ctx.fillStyle = '#fff';
			ctx.fill();
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}

	// the marquee dash style (white dashes over black), shared by rects and polygons
	function dashedStroke(ctx: CanvasRenderingContext2D, stroke: () => void) {
		ctx.lineWidth = 1;
		ctx.setLineDash([4, 3]);
		ctx.strokeStyle = '#fff';
		stroke();
		ctx.strokeStyle = '#000';
		ctx.lineDashOffset = 4;
		stroke();
		ctx.setLineDash([]);
		ctx.lineDashOffset = 0;
	}

	// corners of the group bbox (floating: rotated; baked mask: its extents)
	function groupCorners(): [number, number][] | null {
		if (session.floating) return session.floating.corners();
		const b = session.selectionBounds();
		if (!b) return null;
		return [
			[b.x, b.y],
			[b.x + b.w, b.y],
			[b.x + b.w, b.y + b.h],
			[b.x, b.y + b.h]
		];
	}

	// rotate handle: offset outward from the top-edge midpoint along the
	// rotated up-vector, clamped into the canvas so it stays grabbable
	function handleScreenPos(): { x: number; y: number } | null {
		const c = groupCorners();
		if (!c) return null;
		const z = session.zoom;
		const midX = ((c[0][0] + c[1][0]) / 2) * z;
		const midY = ((c[0][1] + c[1][1]) / 2) * z;
		const cx = ((c[0][0] + c[2][0]) / 2) * z;
		const cy = ((c[0][1] + c[2][1]) / 2) * z;
		const len = Math.hypot(midX - cx, midY - cy) || 1;
		return {
			x: Math.min(cssW - HANDLE_R, Math.max(HANDLE_R, midX + ((midX - cx) / len) * HANDLE_OFFSET)),
			y: Math.min(cssH - HANDLE_R, Math.max(HANDLE_R, midY + ((midY - cy) / len) * HANDLE_OFFSET))
		};
	}

	// floating buffers rendered as RGBA, rebuilt when the content re-rasterizes
	// (keyed per selection: a mirror twin renders alongside the main)
	const floatCache = new WeakMap<object, { version: number; canvas: HTMLCanvasElement }>();
	function floatingCanvas(sel: NonNullable<typeof session.floating>): HTMLCanvasElement {
		const cached = floatCache.get(sel);
		if (cached && cached.version === sel.version) return cached.canvas;
		const canvas = document.createElement('canvas');
		const { w, h } = sel.renderRect;
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d')!;
		const img = ctx.createImageData(w, h);
		const u32 = new Uint32Array(img.data.buffer);
		const lut = buildLut(session.doc.palette);
		for (let i = 0; i < sel.buffer.length; i++) u32[i] = lut[sel.buffer[i]];
		ctx.putImageData(img, 0, 0);
		floatCache.set(sel, { version: sel.version, canvas });
		return canvas;
	}

	$effect(() => {
		// repaint on any document change or relevant view-state change
		void session.version;
		void session.overlayVersion;
		void session.currentFrame;
		void session.bulkFrames;
		void session.zoom;
		void session.showGrid;
		void session.onionEnabled;
		void session.onionOpacity;
		repaint();
	});

	function pixelFromEvent(e: PointerEvent): { x: number; y: number } {
		const { x, y } = pixelFromEventF(e);
		return { x: Math.floor(x), y: Math.floor(y) };
	}

	// fractional pixel coords, for smooth rotation angles
	function pixelFromEventF(e: PointerEvent): { x: number; y: number } {
		const rect = canvasEl.getBoundingClientRect();
		return {
			x: ((e.clientX - rect.left) / rect.width) * session.doc.meta.width,
			y: ((e.clientY - rect.top) / rect.height) * session.doc.meta.height
		};
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		canvasEl.focus();
		const { x, y } = pixelFromEvent(e);
		keyboardX = x;
		keyboardY = y;
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
			case 'select':
			case 'lasso':
			case 'wand':
			case 'polygon': {
				canvasEl.setPointerCapture(e.pointerId);
				lastPixel = { x, y };
				const f = pixelFromEventF(e);
				const box = canvasEl.getBoundingClientRect();
				const ex = e.clientX - box.left;
				const ey = e.clientY - box.top;
				// 1) rotate handle beats everything
				const hp = handleScreenPos();
				if (hp && Math.hypot(ex - hp.x, ey - hp.y) <= HANDLE_R) {
					session.liftSelection(); // no-op when already floating
					const sel = session.floating!;
					const gx = sel.bbox.x + sel.bbox.w / 2 + sel.dx;
					const gy = sel.bbox.y + sel.bbox.h / 2 + sel.dy;
					rotateStart = { angle0: sel.angle, grab: Math.atan2(f.y - gy, f.x - gx) };
					selectDrag = 'rotate';
					break;
				}
				// 2) an in-progress polygon consumes clicks: near the first
				// vertex closes it, anywhere else adds a vertex
				if (session.tool === 'polygon' && session.polygonVerts) {
					const z = session.zoom;
					const first = session.polygonVerts[0];
					if (Math.hypot(ex - first.x * z, ey - first.y * z) <= HANDLE_R) {
						session.closePolygon();
					} else {
						session.polygonAdd(f.x, f.y);
					}
					break;
				}
				// 3) click inside the selection (or its mirror twin) moves it
				// (shift starts an additive gesture instead)
				const mx = session.doc.meta.width - 1 - x;
				const insideMain = session.floating
					? session.floating.contains(x, y)
					: session.selectionContains(x, y);
				const insideTwin = session.floating
					? (session.floatingTwin?.contains(x, y) ?? false)
					: session.mirrorX && session.selectionContains(mx, y);
				if ((insideMain || insideTwin) && !e.shiftKey) {
					session.liftSelection(); // no-op when already floating
					// dragging the twin: mirror the deltas so it follows the pointer
					dragMirrored = insideTwin && !insideMain;
					selectDrag = 'float';
					break;
				}
				// 4) otherwise start this tool's gesture; without shift it
				// replaces the selection (committing any pending float, B5)
				const additive = e.shiftKey && !session.floating;
				switch (session.tool) {
					case 'select':
						session.beginMarquee(x, y, additive);
						selectDrag = 'marquee';
						break;
					case 'lasso':
						session.beginLasso(f.x, f.y, additive);
						selectDrag = 'lasso';
						break;
					case 'wand':
						session.wandSelect(x, y, additive);
						break;
					case 'polygon':
						session.polygonAdd(f.x, f.y, additive);
						break;
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
		if (selectDrag === 'lasso') {
			const f = pixelFromEventF(e);
			session.updateLasso(f.x, f.y);
			return;
		}
		if (selectDrag === 'float') {
			const dx = x - lastPixel.x;
			session.moveFloatingBy(dragMirrored ? -dx : dx, y - lastPixel.y);
			lastPixel = { x, y };
			return;
		}
		if (selectDrag === 'rotate') {
			const sel = session.floating;
			if (sel && rotateStart) {
				const p = pixelFromEventF(e);
				const gx = sel.bbox.x + sel.bbox.w / 2 + sel.dx;
				const gy = sel.bbox.y + sel.bbox.h / 2 + sel.dy;
				let a = rotateStart.angle0 + Math.atan2(p.y - gy, p.x - gx) - rotateStart.grab;
				if (e.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12); // snap 15°
				session.rotateFloating(a);
			}
			return;
		}
		if (session.strokeActive) session.strokeMove(x, y);
	}

	function onPointerUp() {
		if (selectDrag === 'marquee') session.endMarquee();
		if (selectDrag === 'lasso') session.endLasso();
		selectDrag = null;
		rotateStart = null;
		dragMirrored = false;
		session.strokeEnd();
	}

	function onWheel(e: WheelEvent) {
		if (!e.ctrlKey) return;
		e.preventDefault();
		session.zoom = Math.max(2, Math.min(24, session.zoom + (e.deltaY < 0 ? 1 : -1)));
	}

	function onKeyDown(e: KeyboardEvent) {
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		};
		const move = moves[e.key];
		if (move) {
			e.preventDefault();
			e.stopPropagation();
			if (e.altKey && session.hasSelection) session.nudgeSelection(...move);
			else {
				keyboardX = Math.max(0, Math.min(session.doc.meta.width - 1, keyboardX + move[0]));
				keyboardY = Math.max(0, Math.min(session.doc.meta.height - 1, keyboardY + move[1]));
				if (keyboardMarquee) session.updateMarquee(keyboardX, keyboardY);
				keyboardStatus = `Pixel ${keyboardX + 1}, ${keyboardY + 1}`;
			}
			repaint();
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			keyboardMarquee = false;
			session.cancelFloating();
			return;
		}
		if (e.key !== 'Enter' && e.key !== ' ') return;
		e.preventDefault();
		e.stopPropagation();
		if (e.key === 'Enter' && session.floating) {
			session.commitFloating();
			return;
		}
		switch (session.tool) {
			case 'pencil':
			case 'eraser':
				session.strokeBegin(keyboardX, keyboardY);
				session.strokeEnd();
				break;
			case 'fill':
				session.fill(keyboardX, keyboardY);
				break;
			case 'eyedropper':
				session.eyedrop(keyboardX, keyboardY);
				break;
			case 'wand':
				session.wandSelect(keyboardX, keyboardY, e.shiftKey);
				break;
			case 'select':
				if (keyboardMarquee) session.endMarquee();
				else session.beginMarquee(keyboardX, keyboardY, e.shiftKey);
				keyboardMarquee = !keyboardMarquee;
				break;
			case 'polygon':
				if (e.key === 'Enter' && session.polygonVerts) session.closePolygon();
				else session.polygonAdd(keyboardX, keyboardY, e.shiftKey);
				break;
			case 'lasso':
				keyboardStatus = 'Lasso needs a pointer. Choose Select or Wand for keyboard selection.';
				break;
		}
	}
</script>

<div class="scroll" onwheel={onWheel}>
	<p id="canvas-help" class="sr-only">
		Arrow keys move the pixel cursor. Space or Enter uses the current tool. Alt plus arrow keys moves a
		selection. Page Up and Page Down change frames. Tool letter shortcuts work while this canvas is focused.
	</p>
	<p class="sr-only" aria-live="polite">{keyboardStatus}</p>
	<canvas
		bind:this={canvasEl}
		class="editor"
		data-editor-canvas
		data-tool={session.tool}
		tabindex="0"
		aria-label={`Editable pixel canvas, frame ${session.currentFrame + 1}, ${session.tool} tool`}
		aria-describedby="canvas-help"
		width={cssW}
		height={cssH}
		onfocus={() => ((keyboardFocused = true), repaint())}
		onblur={() => ((keyboardFocused = false), repaint())}
		onkeydown={onKeyDown}
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
		background-color: var(--paper-2);
		background-image: radial-gradient(rgba(17, 17, 17, 0.3) 0.8px, transparent 1px);
		background-size: 9px 9px;
	}
	.editor {
		image-rendering: pixelated;
		background: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 16px 16px;
		border: 3px solid var(--ink);
		touch-action: none;
		cursor: crosshair;
	}
	.editor[data-tool='eyedropper'] {
		cursor: copy;
	}
	.editor[data-tool='select'] {
		cursor: default;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
