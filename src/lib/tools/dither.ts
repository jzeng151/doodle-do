const BAYER_2 = [0, 2, 3, 1];
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function ditherValue(
	x: number,
	y: number,
	primary: number,
	secondary: number | undefined,
	size: 0 | 2 | 4
): number {
	if (!size || secondary === undefined) return primary;
	const matrix = size === 2 ? BAYER_2 : BAYER_4;
	return matrix[(y % size + size) % size * size + (x % size + size) % size] < matrix.length / 2
		? primary
		: secondary;
}
