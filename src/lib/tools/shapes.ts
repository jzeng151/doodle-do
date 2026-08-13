export interface Point {
	x: number;
	y: number;
}

function pointCollector(wrap?: { width: number; height: number }) {
	const points: Point[] = [];
	const seen = wrap ? new Set<number>() : null;
	return {
		points,
		add(x: number, y: number) {
			if (wrap) {
				x = (x % wrap.width + wrap.width) % wrap.width;
				y = (y % wrap.height + wrap.height) % wrap.height;
				const index = y * wrap.width + x;
				if (seen!.has(index)) return;
				seen!.add(index);
			}
			points.push({ x, y });
		}
	};
}

export function boundedTileEndpoint(origin: number, value: number, span: number): number {
	const delta = value - origin;
	if (Math.abs(delta) <= span) return value;
	const remainder = Math.abs(delta) % span;
	return origin + Math.sign(delta) * (remainder ? span + remainder : span);
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

export function rectanglePoints(a: Point, b: Point, filled: boolean, bounds?: { width: number; height: number; padding?: number }, wrap?: { width: number; height: number }): Point[] {
	const { x0, y0, x1, y1, ix0, iy0, ix1, iy1 } = shapeBounds(a, b, bounds);
	const { points, add } = pointCollector(wrap);
	for (let y = iy0; y <= iy1; y++) {
		for (let x = ix0; x <= ix1; x++) {
			if (filled || x === x0 || x === x1 || y === y0 || y === y1) add(x, y);
		}
	}
	return points;
}

export function ellipsePoints(a: Point, b: Point, filled: boolean, bounds?: { width: number; height: number; padding?: number }, wrap?: { width: number; height: number }): Point[] {
	const { x0, y0, x1, y1, ix0, iy0, ix1, iy1 } = shapeBounds(a, b, bounds);
	if (x0 === x1 || y0 === y1) return rectanglePoints(a, b, true, bounds, wrap);
	const cx = (x0 + x1) / 2;
	const cy = (y0 + y1) / 2;
	const rx = (x1 - x0 + 1) / 2;
	const ry = (y1 - y0 + 1) / 2;
	const inside = (x: number, y: number) =>
		((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
	const { points, add } = pointCollector(wrap);
	if (wrap) {
		const rowSpan = (y: number): [number, number] | null => {
			const term = 1 - ((y - cy) / ry) ** 2;
			if (term < 0) return null;
			const reach = rx * Math.sqrt(term);
			let lo = Math.max(ix0, Math.ceil(cx - reach));
			let hi = Math.min(ix1, Math.floor(cx + reach));
			while (lo <= hi && !inside(lo, y)) lo++;
			while (hi >= lo && !inside(hi, y)) hi--;
			return lo <= hi ? [lo, hi] : null;
		};
		const addRange = (lo: number, hi: number, y: number) => {
			if (lo > hi) return;
			if (hi - lo + 1 >= wrap.width) hi = lo + wrap.width - 1;
			for (let x = lo; x <= hi; x++) add(x, y);
		};
		for (let y = iy0; y <= iy1; y++) {
			const span = rowSpan(y);
			if (!span) continue;
			const [lo, hi] = span;
			if (filled) addRange(lo, hi, y);
			else {
				add(lo, y);
				add(hi, y);
				for (const adjacent of [rowSpan(y - 1), rowSpan(y + 1)]) {
					if (!adjacent) addRange(lo, hi, y);
					else {
						addRange(lo, Math.min(hi, adjacent[0] - 1), y);
						addRange(Math.max(lo, adjacent[1] + 1), hi, y);
					}
				}
			}
			if (points.length === wrap.width * wrap.height) break;
		}
	} else {
		for (let y = iy0; y <= iy1; y++) {
			for (let x = ix0; x <= ix1; x++) {
				if (!inside(x, y)) continue;
				if (filled || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) add(x, y);
			}
		}
	}
	for (const point of [
		{ x: Math.floor(cx), y: y0 }, { x: Math.ceil(cx), y: y0 },
		{ x: Math.floor(cx), y: y1 }, { x: Math.ceil(cx), y: y1 },
		{ x: x0, y: Math.floor(cy) }, { x: x0, y: Math.ceil(cy) },
		{ x: x1, y: Math.floor(cy) }, { x: x1, y: Math.ceil(cy) }
	]) if (point.x >= ix0 && point.x <= ix1 && point.y >= iy0 && point.y <= iy1) add(point.x, point.y);
	return points;
}
