import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Command } from '../core/commands';
import { CommandBus } from '../core/commands';
import { createDoc, type Doc } from '../core/document';
import { attachAutosave, AUTOSAVE_DEBOUNCE_MS } from './autosave';

function command(name: string): Command {
	return {
		kind: 'rename',
		byteSize: 64,
		do: (doc) => { doc.meta.name = name; },
		undo: () => {},
		serialize: () => ({ name }),
		dirty: () => ({ frame: null, rect: null, metadata: true })
	};
}

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => { resolve = done; });
	return { promise, resolve };
}

afterEach(() => vi.useRealTimers());

describe('attachAutosave', () => {
	it('serializes writes so an older snapshot cannot finish last', async () => {
		vi.useFakeTimers();
		const bus = new CommandBus(createDoc({ width: 1, height: 1, palette: ['#000000'] }));
		const first = deferred();
		const second = deferred();
		const started: string[] = [];
		const stored: string[] = [];
		const write = vi.fn((doc: Doc) => {
			started.push(doc.meta.name);
			const pending = started.length === 1 ? first : second;
			return pending.promise.then(() => { stored.push(doc.meta.name); });
		});
		attachAutosave(bus, undefined, () => structuredClone(bus.doc), write);

		bus.dispatch(command('older'));
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		bus.dispatch(command('newer'));
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(started).toEqual(['older']);

		first.resolve();
		await vi.waitFor(() => expect(started).toEqual(['older', 'newer']));
		second.resolve();
		await vi.waitFor(() => expect(stored).toEqual(['older', 'newer']));
	});

	it('flushes a pending snapshot when detached', async () => {
		vi.useFakeTimers();
		const bus = new CommandBus(createDoc({ width: 1, height: 1, palette: ['#000000'] }));
		const write = vi.fn().mockResolvedValue(undefined);
		const detach = attachAutosave(bus, undefined, () => structuredClone(bus.doc), write);
		bus.dispatch(command('latest'));
		detach();
		await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
		expect(write.mock.calls[0][0].meta.name).toBe('latest');
	});
});
