import { describe, expect, it, vi } from 'vitest';
import type { EditorSession, Tool } from '../editor/session.svelte';
import { DEFAULT_TOOL_LESSONS, TOOL_LESSONS, ToolLessonsEngine, toolLessonUnavailableReason } from './tool-lessons';

function fakeStorage(value?: string): Pick<Storage, 'getItem' | 'setItem'> & { value?: string } {
	return {
		value,
		getItem() { return this.value ?? null; },
		setItem(_key, next) { this.value = next; }
	};
}

describe('tool lesson catalog', () => {
	it('covers every editor tool and keeps transient Stamp out of the default sequence', () => {
		const tools: Tool[] = ['pencil', 'line', 'rectangle', 'ellipse', 'move', 'stamp', 'eraser', 'fill', 'eyedropper', 'select', 'lasso', 'wand', 'polygon'];
		expect(TOOL_LESSONS.map((lesson) => lesson.tool)).toEqual(tools);
		expect(TOOL_LESSONS.find((lesson) => lesson.tool === 'stamp')?.transient).toBe(true);
		expect(DEFAULT_TOOL_LESSONS.some((lesson) => lesson.tool === 'stamp')).toBe(false);
		expect(TOOL_LESSONS.find((lesson) => lesson.tool === 'move')).toMatchObject({
			description: 'Move the active layer.',
			task: 'Drag the active layer to a new position.'
		});
	});

	it('explains prerequisites for lessons that cannot work on a blank canvas', () => {
		const pixels = new Uint8Array(4);
		const context = {
			stamp: null as EditorSession['stamp'],
			currentLayer: 0,
			currentLayerLocked: false,
			colorValue: 1,
			frame: { layers: [{ pixels, visible: true }] }
		};
		const session = context as unknown as EditorSession;
		expect(toolLessonUnavailableReason(session, 'move')).toContain('Draw something');
		expect(toolLessonUnavailableReason(session, 'eraser')).toContain('Draw something');
		expect(toolLessonUnavailableReason(session, 'eyedropper')).toContain('Draw something visible');
		expect(toolLessonUnavailableReason(session, 'pencil')).toBeNull();
		context.colorValue = 0;
		for (const tool of ['pencil', 'line', 'rectangle', 'ellipse', 'fill'] as Tool[]) {
			expect(toolLessonUnavailableReason(session, tool)).toContain('Choose a non-transparent foreground color');
		}
		context.colorValue = 1;

		pixels[0] = 1;
		expect(toolLessonUnavailableReason(session, 'move')).toBeNull();
		expect(toolLessonUnavailableReason(session, 'eraser')).toBeNull();
		expect(toolLessonUnavailableReason(session, 'eyedropper')).toBeNull();

		context.currentLayerLocked = true;
		for (const tool of ['pencil', 'line', 'rectangle', 'ellipse', 'fill', 'move', 'eraser'] as Tool[]) {
			expect(toolLessonUnavailableReason(session, tool)).toBe(`Unlock the active layer before learning ${TOOL_LESSONS.find((lesson) => lesson.tool === tool)!.title}.`);
		}
		expect(toolLessonUnavailableReason(session, 'stamp')).toBe('Make a stamp from a selection first.');
		context.stamp = { width: 1, height: 1, pixels: new Uint8Array([1]) };
		expect(toolLessonUnavailableReason(session, 'stamp')).toBe('Unlock the active layer before learning Stamp.');
	});
});

describe('ToolLessonsEngine', () => {
	it('starts only when asked and completes only from the matching real tool action', () => {
		const engine = new ToolLessonsEngine(fakeStorage());
		expect(engine.current).toBeNull();
		expect(engine.start('line')).toBe(true);
		expect(engine.reportAction('pencil')).toBe(false);
		expect(engine.currentComplete).toBe(false);
		expect(engine.reportAction('line')).toBe(true);
		expect(engine.currentComplete).toBe(true);
		expect(engine.isCompleted('line')).toBe(true);
		expect(engine.reportAction('line')).toBe(false);
	});

	it('supports skipping, closing, and replaying completed lessons', () => {
		const engine = new ToolLessonsEngine(fakeStorage());
		engine.start('pencil');
		engine.reportAction('pencil');
		engine.skip();
		expect(engine.current?.tool).toBe('line');
		engine.close();
		expect(engine.current).toBeNull();
		expect(engine.isCompleted('pencil')).toBe(true);
		engine.replay('pencil');
		expect(engine.current?.tool).toBe('pencil');
		expect(engine.currentComplete).toBe(false);
		expect(engine.isCompleted('pencil')).toBe(true);
	});

	it('persists completions and recovers from corrupt or invalid storage', () => {
		const storage = fakeStorage();
		const first = new ToolLessonsEngine(storage);
		first.start('fill');
		first.reportAction('fill');
		expect(new ToolLessonsEngine(storage).completed).toEqual(['fill']);
		expect(new ToolLessonsEngine(fakeStorage('{bad json')).completed).toEqual([]);
		expect(new ToolLessonsEngine(fakeStorage('{"completed":["fill","missing",7]}')).completed).toEqual(['fill']);
	});

	it('notifies subscribers about visible state changes', () => {
		const engine = new ToolLessonsEngine(fakeStorage());
		const listener = vi.fn();
		const unsubscribe = engine.onChange(listener);
		engine.start('eraser');
		engine.reportAction('eraser');
		engine.close();
		expect(listener).toHaveBeenCalledTimes(3);
		unsubscribe();
		engine.start('fill');
		expect(listener).toHaveBeenCalledTimes(3);
	});
});
