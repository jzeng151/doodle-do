<script lang="ts">
	// Grid mode (§3.3): all frames as simultaneously editable canvases +
	// docked live loop. Same tools, same commands — a stroke on any tile
	// targets that frame directly.
	import type { EditorSession } from '$lib/editor/session.svelte';
	import SidePanel from '../SidePanel.svelte';
	import FrameStrip from '../focus/FrameStrip.svelte';
	import { brushBounds, canvasPoint, floatingCanvas } from '../canvas';

	let { session }: { session: EditorSession } = $props();

	let tiles: (HTMLCanvasElement | undefined)[] = $state([]);
	let strokeTile = -1;
	let moveTile = -1;
	let movePixel = { x: 0, y: 0 };
	let linePointer: number | null = null;
	let shapePointer: number | null = null;
	let focusedTile = $state(-1);
	let keyboardX = $state(0);
	let keyboardY = $state(0);
	let keyboardStatus = $state('');

	const frameCount = $derived((session.version, session.doc.frames.length));
	const tileW = $derived((session.version, session.doc.meta.width * session.gridZoom));
	const tileH = $derived((session.version, session.doc.meta.height * session.gridZoom));
	$effect(() => {
		void session.version;
		void session.gridZoom;
		void session.brushSize;
		void session.tool;
		void session.overlayVersion;
		void focusedTile;
		void keyboardX;
		void keyboardY;
		for (let i = 0; i < session.doc.frames.length; i++) {
			const el = tiles[i];
			if (!el) continue;
			const ctx = el.getContext('2d')!;
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, el.width, el.height);
			const floating = session.floatingSelections(i);
			if (!floating.length) ctx.drawImage(session.compositor.frameCanvas(i), 0, 0, el.width, el.height);
			else for (const [layerIndex, layer] of session.doc.frames[i].layers.entries()) {
				if (!layer.visible) continue;
				ctx.globalAlpha = layer.opacity ?? 1;
				ctx.drawImage(session.compositor.layerCanvas(layer.pixels), 0, 0, el.width, el.height);
				if (layerIndex !== session.currentLayer) continue;
				for (const selection of floating) {
					const rect = selection.renderRect;
					ctx.drawImage(floatingCanvas(selection, session.doc.palette, session.version), rect.x * session.gridZoom, rect.y * session.gridZoom, rect.w * session.gridZoom, rect.h * session.gridZoom);
				}
			}
			ctx.globalAlpha = 1;
			if (i === focusedTile) {
				const z = session.gridZoom;
				const size = ['pencil', 'eraser', 'line', 'rectangle', 'ellipse'].includes(session.tool) ? session.brushSize : 1;
				const bounds = brushBounds(
					keyboardX,
					keyboardY,
					size,
					session.doc.meta.width,
					session.doc.meta.height
				);
				ctx.strokeStyle = '#fff';
				ctx.lineWidth = 3;
				ctx.strokeRect(bounds.x * z + 1.5, bounds.y * z + 1.5, bounds.w * z - 3, bounds.h * z - 3);
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.strokeRect(bounds.x * z + 1.5, bounds.y * z + 1.5, bounds.w * z - 3, bounds.h * z - 3);
			}
		}
	});

	function pixelFromEvent(e: PointerEvent, el: HTMLCanvasElement) {
		const point = canvasPoint(e, el);
		return {
			x: Math.floor(point.x / session.gridZoom),
			y: Math.floor(point.y / session.gridZoom)
		};
	}

	function onPointerDown(e: PointerEvent, i: number) {
		if (e.button !== 0 && e.button !== 2) return;
		const backgroundAction = e.button === 2 || (e.button === 0 && e.ctrlKey);
		if (backgroundAction && !['pencil', 'eraser', 'line', 'rectangle', 'ellipse', 'fill', 'eyedropper'].includes(session.tool)) return;
		const el = tiles[i]!;
		el.focus();
		const { x, y } = pixelFromEvent(e, el);
		const colorValue = backgroundAction ? session.backgroundColorValue : session.colorValue;
		const secondaryColorValue = backgroundAction ? session.colorValue : session.backgroundColorValue;
		keyboardX = x;
		keyboardY = y;
		session.selectFrame(i);
		switch (session.tool) {
			case 'pencil':
			case 'eraser':
				el.setPointerCapture(e.pointerId);
				strokeTile = i;
				session.strokeBegin(x, y, colorValue, secondaryColorValue);
				break;
			case 'line':
				el.setPointerCapture(e.pointerId);
				strokeTile = i;
				linePointer = e.pointerId;
				session.lineBegin(x, y, colorValue, secondaryColorValue);
				break;
			case 'rectangle':
			case 'ellipse':
				el.setPointerCapture(e.pointerId);
				strokeTile = i;
				shapePointer = e.pointerId;
				session.shapeBegin(x, y, colorValue, secondaryColorValue);
				break;
			case 'move':
				el.setPointerCapture(e.pointerId);
				moveTile = i;
				movePixel = { x, y };
				session.beginLayerMove();
				break;
			case 'fill':
				session.fill(x, y, colorValue, secondaryColorValue);
				break;
			case 'eyedropper':
				session.eyedrop(x, y, backgroundAction);
				break;
			case 'stamp': session.placeStamp(x, y); break;
		}
	}

	function onPointerMove(e: PointerEvent, i: number) {
		const { x, y } = pixelFromEvent(e, tiles[i]!);
		keyboardX = Math.max(0, Math.min(session.doc.meta.width - 1, x));
		keyboardY = Math.max(0, Math.min(session.doc.meta.height - 1, y));
		if (strokeTile === i && session.strokeActive) {
			if (session.tool === 'line') session.lineMove(x, y, e.shiftKey);
			else if (session.tool === 'rectangle' || session.tool === 'ellipse') session.shapeMove(x, y);
			else session.strokeMove(x, y);
		}
		if (moveTile === i) {
			session.moveFloatingBy(x - movePixel.x, y - movePixel.y);
			movePixel = { x, y };
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (session.tool === 'line' && e.pointerId !== linePointer) return;
		if ((session.tool === 'rectangle' || session.tool === 'ellipse') && e.pointerId !== shapePointer) return;
		if (strokeTile >= 0 && session.tool === 'line') {
			const { x, y } = pixelFromEvent(e, tiles[strokeTile]!);
			session.lineMove(x, y, e.shiftKey);
		}
		if (strokeTile >= 0 && (session.tool === 'rectangle' || session.tool === 'ellipse')) {
			const { x, y } = pixelFromEvent(e, tiles[strokeTile]!);
			session.shapeMove(x, y);
		}
		strokeTile = -1;
		if (moveTile !== -1) session.endLayerMove();
		moveTile = -1;
		if (session.tool === 'line') {
			linePointer = null;
			session.lineEnd();
		}
		else if (session.tool === 'rectangle' || session.tool === 'ellipse') {
			shapePointer = null;
			session.shapeEnd();
		}
		else session.strokeEnd();
	}

	function onKeyDown(e: KeyboardEvent, i: number) {
		if (e.key === 'Escape' && (session.lineActive || session.shapeActive)) {
			e.preventDefault();
			e.stopPropagation();
			session.cancelLine();
			return;
		}
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
		};
		const move = moves[e.key];
		if (move) {
			e.preventDefault();
			e.stopPropagation();
			if (session.tool === 'move' && session.floating) session.moveFloatingBy(...move);
			else {
				keyboardX = Math.max(0, Math.min(session.doc.meta.width - 1, keyboardX + move[0]));
				keyboardY = Math.max(0, Math.min(session.doc.meta.height - 1, keyboardY + move[1]));
			}
			keyboardStatus = `Frame ${i + 1}, pixel ${keyboardX + 1}, ${keyboardY + 1}`;
			if (session.lineActive) session.lineMove(keyboardX, keyboardY, e.shiftKey);
			if (session.shapeActive) session.shapeMove(keyboardX, keyboardY);
			return;
		}
		if (e.key === 'Escape' && session.tool === 'move' && session.floating) {
			e.preventDefault();
			e.stopPropagation();
			session.cancelFloating();
			return;
		}
		if (e.key !== 'Enter' && e.key !== ' ') return;
		e.preventDefault();
		e.stopPropagation();
		if (session.tool === 'move' && session.floating) {
			session.endLayerMove();
			return;
		}
		session.selectFrame(i);
		switch (session.tool) {
			case 'pencil':
			case 'eraser':
				session.strokeBegin(keyboardX, keyboardY);
				session.strokeEnd();
				break;
			case 'line':
				if (session.lineActive) {
					session.lineMove(keyboardX, keyboardY, e.shiftKey);
					session.lineEnd();
				}
				else session.lineBegin(keyboardX, keyboardY);
				break;
			case 'rectangle':
			case 'ellipse':
				if (session.shapeActive) {
					session.shapeMove(keyboardX, keyboardY);
					session.shapeEnd();
				}
				else session.shapeBegin(keyboardX, keyboardY);
				break;
			case 'move':
				session.beginLayerMove();
				break;
			case 'fill': session.fill(keyboardX, keyboardY); break;
			case 'eyedropper': session.eyedrop(keyboardX, keyboardY); break;
			case 'stamp': session.placeStamp(keyboardX, keyboardY); break;
		}
	}
</script>

<div class="middle">
	<div class="grid-area">
		<div class="grid-tools">
			<button aria-label="Smaller tiles" title="Smaller tiles" onclick={() => (session.gridZoom = Math.max(1, session.gridZoom - 1))}>
				−
			</button>
			<span class="zoom">{session.gridZoom}×</span>
			<button aria-label="Larger tiles" title="Larger tiles" onclick={() => (session.gridZoom = Math.min(12, session.gridZoom + 1))}>
				+
			</button>
		</div>
		<p id="grid-canvas-help" class="sr-only">
			Arrow keys move the pixel cursor. Space or Enter uses the current tool. Tool letter shortcuts work
			while a frame canvas is focused.
		</p>
		<p class="sr-only" aria-live="polite">{keyboardStatus}</p>
		<div class="tiles" role="group" aria-label="Editable frames">
			{#each { length: frameCount } as _, i (i)}
				<div class="tile" class:active={i === session.currentFrame}>
					<span class="num">{i + 1}</span>
					<canvas
						bind:this={tiles[i]}
						data-editor-canvas
						tabindex="0"
						aria-label={`Editable frame ${i + 1} canvas`}
						aria-describedby="grid-canvas-help"
						width={tileW}
						height={tileH}
						style={`--checker-size:${session.gridZoom * 2}px`}
						onfocus={() => { focusedTile = i; if (session.currentFrame !== i) session.selectFrame(i); }}
						onblur={() => focusedTile === i && (focusedTile = -1)}
						onkeydown={(e) => onKeyDown(e, i)}
						onpointerdown={(e) => onPointerDown(e, i)}
						onpointermove={(e) => onPointerMove(e, i)}
						onpointerup={onPointerUp}
						onpointercancel={onPointerUp}
						oncontextmenu={(e) => e.preventDefault()}
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
		background-image: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%);
		background-size: var(--checker-size) var(--checker-size);
		border: 2px solid var(--ink);
		touch-action: none;
		cursor: crosshair;
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
	@media (max-width: 860px) {
		.middle { flex: none; flex-direction: column; }
		.grid-area { min-height: 420px; }
	}
</style>
