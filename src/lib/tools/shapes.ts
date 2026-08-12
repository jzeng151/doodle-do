export interface Point {
	x: number;
	y: number;
}

function clippedBounds(a: Point, b: Point, bounds?: { width: number; height: number }) {
	const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));
	const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
	const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
	return bounds
		? { x0: clamp(x0, bounds.width - 1), y0: clamp(y0, bounds.height - 1), x1: clamp(x1, bounds.width - 1), y1: clamp(y1, bounds.height - 1) }
		: { x0, y0, x1, y1 };
}

export function rectanglePoints(a: Point, b: Point, filled: boolean, bounds?: { width: number; height: number }): Point[] {
	const { x0, y0, x1, y1 } = clippedBounds(a, b, bounds);
	const points: Point[] = [];
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			if (filled || x === x0 || x === x1 || y === y0 || y === y1) points.push({ x, y });
		}
	}
	return points;
}

export function ellipsePoints(a: Point, b: Point, filled: boolean, bounds?: { width: number; height: number }): Point[] {
	const { x0, y0, x1, y1 } = clippedBounds(a, b, bounds);
	if (x0 === x1 || y0 === y1) return rectanglePoints({ x: x0, y: y0 }, { x: x1, y: y1 }, true);
	const cx = (x0 + x1) / 2;
	const cy = (y0 + y1) / 2;
	const rx = (x1 - x0 + 1) / 2;
	const ry = (y1 - y0 + 1) / 2;
	const inside = (x: number, y: number) =>
		((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
	const points: Point[] = [];
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			if (!inside(x, y)) continue;
			if (filled || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) {
				points.push({ x, y });
			}
		}
	}
	return points;
}
