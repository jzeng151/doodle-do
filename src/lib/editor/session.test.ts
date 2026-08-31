import { describe, expect, it, vi } from 'vitest';
import { createDoc } from '../core/document';
import { EditorSession, type Tool } from './session.svelte';

vi.stubGlobal('$state', <T>(value: T) => value);

describe('freehand tool reporting', () => {
	it.each([
		{ started: 'eraser', changed: 'pencil', pixel: 1 },
		{ started: 'pencil', changed: 'eraser', pixel: 0 }
	] as const)('credits $started when the current tool changes to $changed before stroke end', ({ started, changed, pixel }) => {
		const session = new EditorSession(createDoc({ width: 1, height: 1, palette: ['#000000'] }));
		session.frame.layers[0].pixels[0] = pixel;
		session.tool = started;
		const reported: Tool[] = [];
		session.onToolUse((tool) => reported.push(tool));

		session.strokeBegin(0, 0);
		session.tool = changed;
		session.strokeEnd();

		expect(reported).toEqual([started]);
	});
});
