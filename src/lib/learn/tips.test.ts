import { describe, expect, it } from 'vitest';
import { TIPS, TipsEngine } from './tips';

function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v)
	};
}

describe('TipsEngine', () => {
	it('fires a tip once per session and enforces the lifetime cap', () => {
		const storage = fakeStorage();
		let engine = new TipsEngine(storage);
		expect(engine.fire('T01')).toBe(true); // cap 2, count 1
		engine.dismiss();
		expect(engine.fire('T01')).toBe(false); // same session

		engine = new TipsEngine(storage); // new session
		expect(engine.fire('T01')).toBe(true); // count 2
		engine.dismiss();

		engine = new TipsEngine(storage);
		expect(engine.fire('T01')).toBe(false); // cap reached forever
	});

	it('shows at most one tip at a time', () => {
		const engine = new TipsEngine(fakeStorage());
		expect(engine.fire('T01')).toBe(true);
		expect(engine.fire('T03')).toBe(false);
		engine.dismiss();
		expect(engine.fire('T03')).toBe(true);
	});

	it('dismiss-forever survives sessions', () => {
		const storage = fakeStorage();
		let engine = new TipsEngine(storage);
		engine.fire('T02');
		engine.dismissForever();
		engine = new TipsEngine(storage);
		expect(engine.fire('T02')).toBe(false);
	});

	it('hide-all blocks everything including the cap-exempt T15', () => {
		const storage = fakeStorage();
		const engine = new TipsEngine(storage);
		engine.setHideAll(true);
		expect(engine.fire('T01')).toBe(false);
		expect(engine.fire('T15')).toBe(false);
		engine.setHideAll(false);
		expect(engine.fire('T15')).toBe(true);
	});

	it('T15 is exempt from the lifetime cap', () => {
		const storage = fakeStorage();
		for (let session = 0; session < 5; session++) {
			const engine = new TipsEngine(storage);
			expect(engine.fire('T15')).toBe(true);
			engine.dismiss();
		}
	});

	it('unknown ids are ignored', () => {
		expect(new TipsEngine(fakeStorage()).fire('T99')).toBe(false);
	});

	it('catalog matches Appendix A caps plus the feature tips', () => {
		expect(Object.keys(TIPS)).toHaveLength(27); // T01-T15 Appendix A, T16-T27 features
		expect(TIPS.T04.cap).toBe(1);
		expect(TIPS.T09.cap).toBe(2);
		expect(TIPS.T15.cap).toBeNull();
	});
});

describe('feature tip catalog (selection, layers, loop range, compare)', () => {
	it('defines capped tips for the new features', () => {
		for (const id of ['T16', 'T17', 'T18', 'T19', 'T20', 'T21', 'T22', 'T23', 'T24', 'T25', 'T26', 'T27']) {
			expect(TIPS[id], id).toBeDefined();
			expect(TIPS[id].copy.length, id).toBeGreaterThan(20);
			expect(TIPS[id].cap, id).not.toBeNull();
		}
	});
});
