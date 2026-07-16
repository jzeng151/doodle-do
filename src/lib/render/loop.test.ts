import { describe, expect, it } from 'vitest';
import { nextLoopFrame } from './loop';

describe('nextLoopFrame (playback range)', () => {
	it('advances within the range and wraps from end to start', () => {
		expect(nextLoopFrame(1, 1, 3)).toBe(2);
		expect(nextLoopFrame(2, 1, 3)).toBe(3);
		expect(nextLoopFrame(3, 1, 3)).toBe(1);
	});

	it('snaps a frame outside the range to the start', () => {
		expect(nextLoopFrame(0, 2, 3)).toBe(2);
		expect(nextLoopFrame(5, 1, 3)).toBe(1);
	});

	it('holds still on a single-frame range', () => {
		expect(nextLoopFrame(2, 2, 2)).toBe(2);
	});
});
