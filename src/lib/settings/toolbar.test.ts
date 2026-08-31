import { describe, expect, it, vi } from 'vitest';
import {
	TOOLBAR_GROUP_IDS,
	TOOL_IDS,
	ToolbarPreferences,
	defaultToolbarPreferences
} from './toolbar';

function fakeStorage(initial?: string): Storage & { data: Map<string, string> } {
	const data = new Map<string, string>();
	if (initial !== undefined) data.set('doodledo.toolbar', initial);
	return {
		data,
		get length() { return data.size; },
		clear: () => data.clear(),
		getItem: (key) => data.get(key) ?? null,
		key: (index) => [...data.keys()][index] ?? null,
		removeItem: (key) => void data.delete(key),
		setItem: (key, value) => void data.set(key, value)
	};
}

describe('ToolbarPreferences', () => {
	it('starts full and requests the chooser until a layout is chosen', () => {
		const preferences = new ToolbarPreferences(fakeStorage());
		expect(preferences.snapshot).toEqual(defaultToolbarPreferences());
		expect(preferences.needsChooser).toBe(true);

		preferences.chooseLayout('essentials');

		expect(preferences.snapshot.layout).toBe('essentials');
		expect(preferences.needsChooser).toBe(false);
	});

	it('persists custom group visibility, tool visibility, and tool order', () => {
		const storage = fakeStorage();
		const preferences = new ToolbarPreferences(storage);
		preferences.chooseLayout('custom');
		preferences.setGroupVisible('onion-skin', false);
		preferences.setToolVisible('wand', false);
		preferences.setToolOrder(['fill', 'pencil']);

		const restored = new ToolbarPreferences(storage);
		expect(restored.isGroupVisible('onion-skin')).toBe(false);
		expect(restored.isToolVisible('wand')).toBe(false);
		expect(restored.snapshot.toolOrder.slice(0, 2)).toEqual(['fill', 'pencil']);
		expect(restored.snapshot.toolOrder).toHaveLength(TOOL_IDS.length);
	});

	it('applies full and essentials presets without overwriting custom choices', () => {
		const preferences = new ToolbarPreferences(fakeStorage());
		preferences.setGroupVisible('history', false);
		preferences.setToolVisible('line', false);

		preferences.setLayout('full');
		expect(TOOLBAR_GROUP_IDS.every((id) => preferences.isGroupVisible(id))).toBe(true);
		expect(TOOL_IDS.every((id) => preferences.isToolVisible(id))).toBe(true);

		preferences.setLayout('essentials');
		expect(preferences.visibleTools()).toEqual(['pencil', 'eraser', 'fill', 'eyedropper', 'select']);
		expect(preferences.isGroupVisible('history')).toBe(true);
		expect(preferences.isGroupVisible('layer-transform')).toBe(false);

		preferences.setLayout('custom');
		expect(preferences.isGroupVisible('history')).toBe(false);
		expect(preferences.isToolVisible('line')).toBe(false);
	});

	it('recovers invalid and partial stored data with safe defaults', () => {
		expect(new ToolbarPreferences(fakeStorage('{bad')).snapshot).toEqual(defaultToolbarPreferences());

		const preferences = new ToolbarPreferences(fakeStorage(JSON.stringify({
			layout: 'custom',
			chooserSeen: true,
			toolOrder: ['fill', 'nope', 'fill'],
			toolVisibility: { fill: false },
			groupVisibility: { history: false }
		})));
		expect(preferences.snapshot.toolOrder.slice(0, 2)).toEqual(['fill', 'pencil']);
		expect(preferences.isToolVisible('fill')).toBe(false);
		expect(preferences.isToolVisible('pencil')).toBe(true);
		expect(preferences.isGroupVisible('history')).toBe(false);
		expect(preferences.isGroupVisible('tools')).toBe(true);
	});

	it('supports Svelte-style subscriptions and reset', () => {
		const storage = fakeStorage();
		const preferences = new ToolbarPreferences(storage);
		const listener = vi.fn();
		const unsubscribe = preferences.subscribe(listener);
		expect(listener).toHaveBeenCalledTimes(1);

		preferences.chooseLayout('custom');
		expect(listener).toHaveBeenCalledTimes(2);
		unsubscribe();
		preferences.reset();

		expect(listener).toHaveBeenCalledTimes(2);
		expect(preferences.snapshot).toEqual(defaultToolbarPreferences());
		expect(storage.getItem('doodledo.toolbar')).toBeNull();
	});
});
