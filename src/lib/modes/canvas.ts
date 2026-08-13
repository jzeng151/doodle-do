import { buildLut } from '$lib/core/palette';
import type { FloatingSelection } from '$lib/tools/selection';

const floatCache = new WeakMap<object, { version: number; documentVersion: number; canvas: HTMLCanvasElement }>();

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
