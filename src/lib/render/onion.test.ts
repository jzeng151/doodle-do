import { describe, expect, it } from 'vitest';
import { onionSequence } from './onion';

describe('onion sequence', () => {
	it('wraps, orders far-to-near, fades toward distance, and avoids duplicate frames', () => {
		expect(onionSequence(0, 5, 3, -1)).toEqual([
			{ frame: 2, fade: 1 / 3 }, { frame: 3, fade: 2 / 3 }, { frame: 4, fade: 1 }
		]);
		expect(onionSequence(0, 2, 8, 1)).toEqual([{ frame: 1, fade: 1 / 4 }]);
	});
});
