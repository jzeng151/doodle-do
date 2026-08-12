export interface Point {
	x: number;
	y: number;
}

export function rectanglePoints(a: Point, b: Point, filled: boolean): Point[] {
	const x0 = Math.min(a.x, b.x);
	const y0 = Math.min(a.y, b.y);
	const x1 = Math.max(a.x, b.x);
	const y1 = Math.max(a.y, b.y);
	const points: Point[] = [];
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			if (filled || x === x0 || x === x1 || y === y0 || y === y1) points.push({ x, y });
		}
	}
	return points;
}

export function ellipsePoints(a: Point, b: Point, filled: boolean): Point[] {
	const x0 = Math.min(a.x, b.x);
	const y0 = Math.min(a.y, b.y);
	const x1 = Math.max(a.x, b.x);
	const y1 = Math.max(a.y, b.y);
	if (x0 === x1 || y0 === y1) return rectanglePoints(a, b, true);
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
