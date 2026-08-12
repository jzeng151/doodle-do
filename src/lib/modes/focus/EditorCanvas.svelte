<script lang="ts">
	import { flushSync } from 'svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { buildLut } from '$lib/core/palette';
	import { drawOnionGhost, ONION_NEXT_COLOR, ONION_PREV_COLOR } from '$lib/render/onion';
	import { brushBounds, canvasPoint } from '../canvas';

	let { session, branch }: { session: EditorSession; branch?: 'current' | 'fork' } = $props();

	let scrollEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let selectDrag: 'marquee' | 'lasso' | 'float' | 'rotate' | 'layer' | null = null;
	let rotateStart: { angle0: number; grab: number } | null = null;
	let dragMirrored = false; // float-drag started inside the mirror twin
	let lastPixel = { x: 0, y: 0 };
	let keyboardX = $state(0);
	let keyboardY = $state(0);
	let keyboardFocused = $state(false);
	let keyboardMarquee = $state(false);
	let keyboardStatus = $state('');
	let cameraPan = $state<{ x: number; y: number; left: number; top: number } | null>(null);

	// rotate-handle geometry in CSS px; e2e/selection.spec.ts mirrors these
	const HANDLE_OFFSET = 16;
	const HANDLE_R = 8;

	const renderZoom = $derived(Math.max(1, Math.ceil(session.zoom)));
	const canvasW = $derived((session.version, session.doc.meta.width * renderZoom));
	const canvasH = $derived((session.version, session.doc.meta.height * renderZoom));
	const cssW = $derived((session.version, session.doc.meta.width * session.zoom));
	const cssH = $derived((session.version, session.doc.meta.height * session.zoom));

	$effect(() => {
		void session.version;
		const { width, height } = session.doc.meta;
		const dimensions = `${width}x${height}`;
		if (!scrollEl || !canvasEl || dimensions === session.fitCheckedDimensions) return;
		session.fitCheckedDimensions = dimensions;
		const borderW = canvasEl.offsetWidth - canvasEl.clientWidth;
		const borderH = canvasEl.offsetHeight - canvasEl.clientHeight;
		const viewport = scrollEl.getBoundingClientRect();
		const availableW = Math.min(scrollEl.clientWidth, window.innerWidth - Math.max(0, viewport.left));
		const availableH = Math.min(scrollEl.clientHeight, window.innerHeight - Math.max(0, viewport.top));
		const fitZoom = Math.max(
			0.25,
			Math.floor(
				Math.min((availableW - borderW) / width, (availableH - borderH) / height) * 100
			) / 100
		);
		if (session.zoom > fitZoom) session.zoom = fitZoom;
	});

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
			if (session.onionPreviousEnabled) {
				drawOnionGhost(ctx, session.compositor.frameCanvas(prev), ONION_PREV_COLOR, session.onionOpacity * 0.55);
			}
			if (session.onionNextEnabled && (next !== prev || !session.onionPreviousEnabled)) {
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
			const z = renderZoom;
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (let x = 1; x < session.doc.meta.width; x++) {
				ctx.moveTo(x * z + 0.5, 0);
				ctx.lineTo(x * z + 0.5, canvasEl.height);
			}
			for (let y = 1; y < session.doc.meta.height; y++) {
				ctx.moveTo(0, y * z + 0.5);
				ctx.lineTo(canvasEl.width, y * z + 0.5);
			}
			ctx.stroke();
		}

		drawSelectionOverlay(ctx);
		if (keyboardFocused) drawKeyboardCursor(ctx);
	}

	function drawKeyboardCursor(ctx: CanvasRenderingContext2D) {
		const z = renderZoom;
		const size = ['pencil', 'eraser', 'line', 'rectangle', 'ellipse'].includes(session.tool) ? session.brushSize : 1;
		const bounds = brushBounds(
			keyboardX,
			keyboardY,
			size,
			session.doc.meta.width,
			session.doc.meta.height
		);
		ctx.save();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 3;
		ctx.strokeRect(bounds.x * z + 1.5, bounds.y * z + 1.5, bounds.w * z - 3, bounds.h * z - 3);
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		ctx.strokeRect(bounds.x * z + 1.5, bounds.y * z + 1.5, bounds.w * z - 3, bounds.h * z - 3);
		ctx.restore();
	}

	function drawSelectionOverlay(ctx: CanvasRenderingContext2D) {
		const z = renderZoom;
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
		const z = renderZoom;
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
		void session.brushSize;
		void session.tool;
		void session.showGrid;
		void session.onionEnabled;
		void session.onionPreviousEnabled;
		void session.onionNextEnabled;
		void session.onionOpacity;
		repaint();
	});

	function pixelFromEvent(e: PointerEvent): { x: number; y: number } {
		const { x, y } = pixelFromEventF(e);
		return { x: Math.floor(x), y: Math.floor(y) };
	}

	// fractional pixel coords, for smooth rotation angles
	function pixelFromEventF(e: PointerEvent): { x: number; y: number } {
		const point = canvasPoint(e, canvasEl);
		return { x: point.x / renderZoom, y: point.y / renderZoom };
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0 && e.button !== 2) return;
		const backgroundAction = e.button === 2 || (e.button === 0 && e.ctrlKey);
		if (backgroundAction && !['pencil', 'eraser', 'line', 'rectangle', 'ellipse', 'fill', 'eyedropper'].includes(session.tool)) return;
		canvasEl.focus();
		const { x, y } = pixelFromEvent(e);
		const colorValue = backgroundAction ? session.backgroundColorValue : session.colorValue;
		const secondaryColorValue = backgroundAction ? session.colorValue : session.backgroundColorValue;
		keyboardX = x;
		keyboardY = y;
		switch (session.tool) {
			case 'pencil':
			case 'eraser':
				canvasEl.setPointerCapture(e.pointerId);
				session.strokeBegin(x, y, colorValue, secondaryColorValue);
				break;
			case 'line':
				canvasEl.setPointerCapture(e.pointerId);
				session.lineBegin(x, y, colorValue, secondaryColorValue);
				break;
			case 'rectangle':
			case 'ellipse':
				canvasEl.setPointerCapture(e.pointerId);
				session.shapeBegin(x, y, colorValue, secondaryColorValue);
				break;
			case 'move':
				canvasEl.setPointerCapture(e.pointerId);
				lastPixel = { x, y };
				session.beginLayerMove();
				selectDrag = 'layer';
				break;
			case 'fill':
				session.fill(x, y, colorValue, secondaryColorValue);
				break;
			case 'eyedropper':
				session.eyedrop(x, y, backgroundAction);
				break;
			case 'select':
			case 'lasso':
			case 'wand':
			case 'polygon': {
				canvasEl.setPointerCapture(e.pointerId);
				lastPixel = { x, y };
				const f = pixelFromEventF(e);
				const { x: ex, y: ey } = canvasPoint(e, canvasEl);
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
					const z = renderZoom;
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
				if ((insideMain || insideTwin) && !e.shiftKey && session.selectionMode === 'replace') {
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
		const nextX = Math.max(0, Math.min(session.doc.meta.width - 1, x));
		const nextY = Math.max(0, Math.min(session.doc.meta.height - 1, y));
		const cursorMoved = nextX !== keyboardX || nextY !== keyboardY;
		keyboardX = nextX;
		keyboardY = nextY;
		if (selectDrag === 'marquee') {
			session.updateMarquee(x, y);
			return;
		}
		if (selectDrag === 'lasso') {
			const f = pixelFromEventF(e);
			session.updateLasso(f.x, f.y);
			return;
		}
		if (selectDrag === 'float' || selectDrag === 'layer') {
			const dx = x - lastPixel.x;
			session.moveFloatingBy(selectDrag === 'float' && dragMirrored ? -dx : dx, y - lastPixel.y);
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
		if (session.strokeActive) {
			if (session.tool === 'line') session.lineMove(x, y, e.shiftKey);
			else if (session.tool === 'rectangle' || session.tool === 'ellipse') session.shapeMove(x, y);
			else session.strokeMove(x, y);
		}
		else if (cursorMoved) repaint();
	}

	function onPointerUp() {
		if (selectDrag === 'layer') session.endLayerMove();
		if (selectDrag === 'marquee') session.endMarquee();
		if (selectDrag === 'lasso') session.endLasso();
		selectDrag = null;
		rotateStart = null;
		dragMirrored = false;
		if (session.tool === 'line') session.lineEnd();
		else if (session.tool === 'rectangle' || session.tool === 'ellipse') session.shapeEnd();
		else session.strokeEnd();
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.deltaY === 0) return;
		const before = canvasEl.getBoundingClientRect();
		const anchorX = Math.max(0, Math.min(1, (e.clientX - before.left) / before.width));
		const anchorY = Math.max(0, Math.min(1, (e.clientY - before.top) / before.height));
		const step = session.zoom < 1 ? 0.25 : 1;
		const zoom = Math.max(0.25, Math.min(24, session.zoom + (e.deltaY < 0 ? step : -step)));
		if (zoom === session.zoom) return;
		flushSync(() => (session.zoom = zoom));
		const after = canvasEl.getBoundingClientRect();
		scrollEl.scrollLeft += after.left + anchorX * after.width - e.clientX;
		scrollEl.scrollTop += after.top + anchorY * after.height - e.clientY;
	}

	function onCameraPointerDown(e: PointerEvent) {
		if (e.button !== 1) return;
		e.preventDefault();
		e.stopPropagation();
		cameraPan = {
			x: e.clientX,
			y: e.clientY,
			left: scrollEl.scrollLeft,
			top: scrollEl.scrollTop
		};
		scrollEl.setPointerCapture(e.pointerId);
	}

	function onCameraPointerMove(e: PointerEvent) {
		if (!cameraPan) return;
		e.preventDefault();
		scrollEl.scrollLeft = cameraPan.left - (e.clientX - cameraPan.x);
		scrollEl.scrollTop = cameraPan.top - (e.clientY - cameraPan.y);
	}

	function onCameraPointerUp(e: PointerEvent) {
		if (!cameraPan) return;
		cameraPan = null;
		if (scrollEl.hasPointerCapture(e.pointerId)) scrollEl.releasePointerCapture(e.pointerId);
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
			if (session.tool === 'move' && session.floating) session.moveFloatingBy(...move);
			else if (e.altKey && session.hasSelection) session.nudgeSelection(...move);
			else {
				keyboardX = Math.max(0, Math.min(session.doc.meta.width - 1, keyboardX + move[0]));
				keyboardY = Math.max(0, Math.min(session.doc.meta.height - 1, keyboardY + move[1]));
				if (keyboardMarquee) session.updateMarquee(keyboardX, keyboardY);
				keyboardStatus = `Pixel ${keyboardX + 1}, ${keyboardY + 1}`;
				if (session.lineActive) session.lineMove(keyboardX, keyboardY, e.shiftKey);
				if (session.shapeActive) session.shapeMove(keyboardX, keyboardY);
			}
			repaint();
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			keyboardMarquee = false;
			session.cancelLine();
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
			case 'line':
				if (session.lineActive) session.lineEnd();
				else session.lineBegin(keyboardX, keyboardY);
				break;
			case 'rectangle':
			case 'ellipse':
				if (session.shapeActive) session.shapeEnd();
				else session.shapeBegin(keyboardX, keyboardY);
				break;
			case 'move':
				if (session.floating) session.endLayerMove();
				else session.beginLayerMove();
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

<div
	class="scroll"
	class:panning={cameraPan !== null}
	role="region"
	aria-label="Canvas viewport"
	bind:this={scrollEl}
	onwheel={onWheel}
	onpointerdown={onCameraPointerDown}
	onpointermove={onCameraPointerMove}
	onpointerup={onCameraPointerUp}
	onpointercancel={onCameraPointerUp}
	onauxclick={(e) => e.preventDefault()}
>
	<p id="canvas-help" class="sr-only">
		Arrow keys move the pixel cursor. Space or Enter uses the current tool. Alt plus arrow keys moves a
		selection. Page Up and Page Down change frames. Tool letter shortcuts work while this canvas is focused.
	</p>
	<p class="sr-only" aria-live="polite">{keyboardStatus}</p>
	<canvas
		bind:this={canvasEl}
		class="editor"
		data-editor-canvas
		data-editor-branch={branch}
		data-tool={session.tool}
		tabindex="0"
		aria-label={`Editable pixel canvas, frame ${session.currentFrame + 1}, ${session.tool} tool`}
		aria-describedby="canvas-help"
		width={canvasW}
		height={canvasH}
		style={`width:${cssW}px;height:${cssH}px;--checker-size:${session.zoom * 2}px`}
		onfocus={() => ((keyboardFocused = true), repaint())}
		onblur={() => ((keyboardFocused = false), repaint())}
		onkeydown={onKeyDown}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		oncontextmenu={(e) => e.preventDefault()}
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
	.scroll.panning,
	.scroll.panning .editor {
		cursor: grabbing;
	}
	.editor {
		image-rendering: pixelated;
		background-image: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%);
		background-size: var(--checker-size) var(--checker-size);
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
	.editor[data-tool='move'] { cursor: move; }
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
