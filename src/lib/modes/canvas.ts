import { buildLut } from '$lib/core/palette';
import type { FloatingSelection } from '$lib/tools/selection';
import type { EditorSession } from '$lib/editor/session.svelte';

const floatCache = new WeakMap<object, { version: number; documentVersion: number; canvas: HTMLCanvasElement }>();
const frameCache = new WeakMap<EditorSession, { version: number; overlayVersion: number; frames: Map<number, HTMLCanvasElement> }>();

export function floatingCanvas(selection: FloatingSelection, palette: string[], documentVersion: number) {
	const cached = floatCache.get(selection);
	if (cached?.version === selection.version && cached.documentVersion === documentVersion) return cached.canvas;
	const canvas = document.createElement('canvas');
	canvas.width = selection.renderRect.w;
	canvas.height = selection.renderRect.h;
	const ctx = canvas.getContext('2d')!;
	const image = ctx.createImageData(canvas.width, canvas.height);
	const rgba = new Uint32Array(image.data.buffer);
	const lut = buildLut(palette);
	for (let i = 0; i < selection.buffer.length; i++) rgba[i] = lut[selection.buffer[i]];
	ctx.putImageData(image, 0, 0);
	floatCache.set(selection, { version: selection.version, documentVersion, canvas });
	return canvas;
}

export function floatingFrameCanvas(session: EditorSession, frame: number): HTMLCanvasElement | null {
	const floating = session.floatingSelections(frame);
	if (!floating.length) return null;
	let cached = frameCache.get(session);
	if (!cached || cached.version !== session.version || cached.overlayVersion !== session.overlayVersion) {
		cached = { version: session.version, overlayVersion: session.overlayVersion, frames: new Map() };
		frameCache.set(session, cached);
	}
	const hit = cached.frames.get(frame);
	if (hit) return hit;
	const { width, height } = session.doc.meta;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	for (const [layerIndex, layer] of session.doc.frames[frame].layers.entries()) {
		if (!layer.visible) continue;
		const selections = floating.filter((selection) => selection.layerIndex === layerIndex);
		let source = session.compositor.layerCanvas(layer.pixels);
		if (selections.length) {
			const layerCanvas = document.createElement('canvas');
			layerCanvas.width = width;
			layerCanvas.height = height;
			const layerCtx = layerCanvas.getContext('2d')!;
			layerCtx.drawImage(source, 0, 0);
			for (const selection of selections) {
				const rect = selection.renderRect;
				layerCtx.drawImage(floatingCanvas(selection, session.doc.palette, session.version), rect.x, rect.y);
			}
			source = layerCanvas;
		}
		ctx.globalAlpha = 'opacity' in layer && typeof layer.opacity === 'number' ? layer.opacity : 1;
		ctx.drawImage(source, 0, 0);
	}
	ctx.globalAlpha = 1;
	cached.frames.set(frame, canvas);
	return canvas;
}

export function canvasPoint(e: PointerEvent, canvas: HTMLCanvasElement) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: ((e.clientX - rect.left - canvas.clientLeft) / canvas.clientWidth) * canvas.width,
		y: ((e.clientY - rect.top - canvas.clientTop) / canvas.clientHeight) * canvas.height
	};
}

export function brushBounds(x: number, y: number, size: number, width: number, height: number) {
	const r = size >> 1;
	const brushX = x - r;
	const brushY = y - r;
	const x0 = Math.max(0, brushX);
	const y0 = Math.max(0, brushY);
	return {
		x: x0,
		y: y0,
		w: Math.max(0, Math.min(width, brushX + size) - x0),
		h: Math.max(0, Math.min(height, brushY + size) - y0)
	};
}
