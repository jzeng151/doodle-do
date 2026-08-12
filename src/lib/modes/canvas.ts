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
