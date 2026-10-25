const PATTERNS = {
	2: [1, 0, 0, 1],
	3: [1, 0, 1, 0, 1, 0, 1, 0, 1],
	4: [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
	5: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
};

export function ditherValue(
	x: number,
	y: number,
	primary: number,
	secondary: number | undefined,
	size: 0 | 2 | 3 | 4 | 5
): number {
	if (!size || secondary === undefined) return primary;
	const pattern = PATTERNS[size];
	return pattern[(y % size + size) % size * size + (x % size + size) % size]
		? primary
		: secondary;
}
