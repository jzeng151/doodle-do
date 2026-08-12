import { describe, expect, it } from 'vitest';
import { combinedOnionSequence, onionSequence } from './onion';

describe('onion sequence', () => {
	it('wraps, orders far-to-near, fades toward distance, and avoids duplicate frames', () => {
		expect(onionSequence(0, 5, 3, -1)).toEqual([
			{ frame: 2, fade: 1 / 3 }, { frame: 3, fade: 2 / 3 }, { frame: 4, fade: 1 }
		]);
		expect(onionSequence(0, 2, 8, 1)).toEqual([{ frame: 1, fade: 1 }]);
		expect(onionSequence(0, 2, 3, -1)).toEqual([{ frame: 1, fade: 1 }]);
		const seen = new Set([0]);
		expect(onionSequence(0, 2, 1, -1, seen)).toHaveLength(1);
		expect(onionSequence(0, 2, 1, 1, seen)).toHaveLength(0);
	});

	it('keeps the closest occurrence across both directions', () => {
		const ghosts = combinedOnionSequence(0, 5, 4, 1);
		expect(ghosts.find(({ frame }) => frame === 1)).toMatchObject({ direction: 1, step: 1, fade: 1 });
	});
});
