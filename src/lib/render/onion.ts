// Onion-skin ghost rendering (§4.3): adjacent frames drawn as tinted
// silhouettes of the FLATTENED composite (per-layer ghosting is out of
// scope permanently). Previous = red, next = green.

export const ONION_PREV_COLOR = '#e03131';
export const ONION_NEXT_COLOR = '#2f9e44';

export function onionSequence(current: number, frameCount: number, distance: number, direction: -1 | 1, seen = new Set([current])) {
	distance = Math.max(1, Math.min(8, Math.round(distance || 1)));
	const frames: { frame: number; fade: number }[] = [];
	for (let step = 1; step <= distance; step++) {
		const frame = ((current + direction * step) % frameCount + frameCount) % frameCount;
		if (seen.has(frame)) continue;
		seen.add(frame);
		frames.push({ frame, fade: (distance - step + 1) / distance });
	}
	return frames.reverse();
}

export function combinedOnionSequence(current: number, frameCount: number, previous: number, next: number) {
	const closest = new Map<number, { frame: number; fade: number; direction: -1 | 1; step: number }>();
	for (const [distance, direction] of [[previous, -1], [next, 1]] as const) {
		if (distance <= 0) continue;
		const limit = Math.max(1, Math.min(8, Math.round(distance || 1)));
		for (let step = 1; step <= limit; step++) {
			const frame = ((current + direction * step) % frameCount + frameCount) % frameCount;
			if (frame === current || (closest.get(frame)?.step ?? Infinity) <= step) continue;
			closest.set(frame, { frame, fade: (limit - step + 1) / limit, direction, step });
		}
	}
	return [...closest.values()].sort((a, b) => b.step - a.step);
}

let scratch: HTMLCanvasElement | null = null;

export function drawOnionGhost(
	ctx: CanvasRenderingContext2D,
	frame: HTMLCanvasElement,
	color: string,
	alpha: number
): void {
	if (!scratch) scratch = document.createElement('canvas');
	if (scratch.width < frame.width || scratch.height < frame.height) {
		scratch.width = frame.width;
		scratch.height = frame.height;
	}
	const s = scratch.getContext('2d')!;
	s.clearRect(0, 0, scratch.width, scratch.height);
	s.drawImage(frame, 0, 0);
	s.globalCompositeOperation = 'source-in';
	s.fillStyle = color;
	s.fillRect(0, 0, frame.width, frame.height);
	s.globalCompositeOperation = 'source-over';

	ctx.globalAlpha = alpha;
	ctx.drawImage(
		scratch,
		0,
		0,
		frame.width,
		frame.height,
		0,
		0,
		ctx.canvas.width,
		ctx.canvas.height
	);
	ctx.globalAlpha = 1;
}
