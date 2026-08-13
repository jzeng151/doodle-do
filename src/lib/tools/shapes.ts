export interface Point {
	x: number;
	y: number;
}

function shapeBounds(a: Point, b: Point, bounds?: { width: number; height: number; padding?: number }) {
	const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
	const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
	const padding = bounds?.padding ?? 0;
	return {
		x0, y0, x1, y1,
		ix0: bounds ? Math.max(-padding, x0) : x0,
		iy0: bounds ? Math.max(-padding, y0) : y0,
		ix1: bounds ? Math.min(bounds.width - 1 + padding, x1) : x1,
		iy1: bounds ? Math.min(bounds.height - 1 + padding, y1) : y1
	};
}

export function rectanglePoints(a: Point, b: Point, filled: boolean, bounds?: { width: number; height: number; padding?: number }): Point[] {
	const { x0, y0, x1, y1, ix0, iy0, ix1, iy1 } = shapeBounds(a, b, bounds);
	const points: Point[] = [];
	for (let y = iy0; y <= iy1; y++) {
		for (let x = ix0; x <= ix1; x++) {
			if (filled || x === x0 || x === x1 || y === y0 || y === y1) points.push({ x, y });
		}
	}
	return points;
}

export function ellipsePoints(a: Point, b: Point, filled: boolean, bounds?: { width: number; height: number; padding?: number }): Point[] {
	const { x0, y0, x1, y1, ix0, iy0, ix1, iy1 } = shapeBounds(a, b, bounds);
	if (x0 === x1 || y0 === y1) return rectanglePoints(a, b, true, bounds);
	const cx = (x0 + x1) / 2;
	const cy = (y0 + y1) / 2;
	const rx = (x1 - x0 + 1) / 2;
	const ry = (y1 - y0 + 1) / 2;
	const inside = (x: number, y: number) =>
		((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
	const points: Point[] = [];
	for (let y = iy0; y <= iy1; y++) {
		for (let x = ix0; x <= ix1; x++) {
			if (!inside(x, y)) continue;
			if (filled || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) {
				points.push({ x, y });
			}
		}
	}
	return points;
}
