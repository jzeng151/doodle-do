import { describe, expect, it, vi } from 'vitest';
import { createDoc } from '../core/document';
import { EditorSession, type Tool } from './session.svelte';

vi.stubGlobal('$state', <T>(value: T) => value);

const paintTools = ['pencil', 'line', 'rectangle', 'ellipse', 'fill'] as const;

function paint(session: EditorSession, tool: typeof paintTools[number], colorValue: number, secondaryColorValue?: number): void {
	session.tool = tool;
	if (tool === 'pencil') {
		session.strokeBegin(0, 0, colorValue, secondaryColorValue);
		session.strokeMove(1, 0);
		session.strokeEnd();
	} else if (tool === 'line') {
		session.lineBegin(0, 0, colorValue, secondaryColorValue);
		session.lineMove(1, 0);
		session.lineEnd();
	} else if (tool === 'fill') {
		session.fill(0, 0, colorValue, secondaryColorValue);
	} else {
		session.shapeBegin(0, 0, colorValue, secondaryColorValue);
		session.shapeMove(1, 1);
		session.shapeEnd();
	}
}

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

	it.each(paintTools)('%s credits visible secondary paint from a transparent-primary dither', (tool) => {
		const session = new EditorSession(createDoc({ width: 2, height: 2, palette: ['#000000'] }));
		session.ditherEnabled = true;
		const reported: Tool[] = [];
		session.onToolUse((usedTool) => reported.push(usedTool));

		paint(session, tool, 0, 1);

		expect(session.frame.layers[0].pixels.some((value) => value !== 0)).toBe(true);
		expect(reported).toEqual([tool]);
	});
});

describe('paint tool reporting', () => {
	it.each(paintTools)('%s ignores transparent secondary paint but credits visible paint', (tool) => {
		const erased = new EditorSession(createDoc({ width: 2, height: 2, palette: ['#000000'] }));
		erased.frame.layers[0].pixels.fill(1);
		const erasedReports: Tool[] = [];
		erased.onToolUse((usedTool) => erasedReports.push(usedTool));

		paint(erased, tool, 0);

		expect(erased.bus.canUndo).toBe(true);
		expect(erasedReports).toEqual([]);

		const painted = new EditorSession(createDoc({ width: 2, height: 2, palette: ['#000000'] }));
		const paintedReports: Tool[] = [];
		painted.onToolUse((usedTool) => paintedReports.push(usedTool));

		paint(painted, tool, 1);

		expect(painted.bus.canUndo).toBe(true);
		expect(paintedReports).toEqual([tool]);
	});
});
