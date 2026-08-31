import type { EditorSession, Tool } from '../editor/session.svelte';
import { hasSampleablePixel } from '../tools/sample';

export interface ToolLesson {
	tool: Tool;
	title: string;
	shortcut: string;
	description: string;
	task: string;
	transient?: true;
}

const LESSONS_BY_TOOL = {
	pencil: lesson('pencil', 'Pencil', 'B', 'Draw pixels with the selected color.', 'Draw at least one pixel.'),
	line: lesson('line', 'Line', 'N', 'Draw a straight line.', 'Drag across the canvas to draw a line.'),
	rectangle: lesson('rectangle', 'Rectangle', 'R', 'Draw an outlined or filled rectangle.', 'Drag across the canvas to draw a rectangle.'),
	ellipse: lesson('ellipse', 'Ellipse', 'C', 'Draw an outlined or filled ellipse.', 'Drag across the canvas to draw an ellipse.'),
	move: lesson('move', 'Move', 'V', 'Move the active layer.', 'Drag the active layer to a new position.'),
	stamp: {
		...lesson('stamp', 'Stamp', 'S', 'Place a reusable copy of a captured selection.', 'Place a captured stamp on the canvas.'),
		transient: true
	},
	eraser: lesson('eraser', 'Eraser', 'E', 'Remove pixels from the current layer.', 'Erase at least one pixel.'),
	fill: lesson('fill', 'Fill', 'G', 'Fill an area with the selected color.', 'Fill an area on the canvas.'),
	eyedropper: lesson('eyedropper', 'Eyedropper', 'I', 'Pick a color from the canvas.', 'Pick a color from the canvas.'),
	select: lesson('select', 'Select', 'M', 'Select a rectangular area.', 'Drag a selection rectangle.'),
	lasso: lesson('lasso', 'Lasso', 'L', 'Draw a freehand selection.', 'Draw a loop around part of the artwork.'),
	wand: lesson('wand', 'Wand', 'W', 'Select connected pixels of the same color.', 'Select any connected area, including empty canvas.'),
	polygon: lesson('polygon', 'Polygon', 'P', 'Select an area by placing points.', 'Place points and close the polygon.')
} satisfies Record<Tool, ToolLesson>;

function lesson(tool: Tool, title: string, shortcut: string, description: string, task: string): ToolLesson {
	return { tool, title, shortcut, description, task };
}

export const TOOL_LESSONS: readonly ToolLesson[] = Object.values(LESSONS_BY_TOOL);
export const DEFAULT_TOOL_LESSONS: readonly ToolLesson[] = TOOL_LESSONS.filter((lesson) => !lesson.transient);
const ACTIVE_LAYER_TOOLS: readonly Tool[] = ['pencil', 'line', 'rectangle', 'ellipse', 'fill', 'stamp', 'move', 'eraser'];
const PAINT_TOOLS: readonly Tool[] = ['pencil', 'line', 'rectangle', 'ellipse', 'fill'];

export function toolLessonUnavailableReason(session: EditorSession, tool: Tool): string | null {
	if (tool === 'stamp' && !session.stamp) return 'Make a stamp from a selection first.';
	if (ACTIVE_LAYER_TOOLS.includes(tool) && session.currentLayerLocked) {
		return `Unlock the active layer before learning ${LESSONS_BY_TOOL[tool].title}.`;
	}
	if (PAINT_TOOLS.includes(tool) && session.colorValue === 0) {
		return `Choose a non-transparent foreground color before learning ${LESSONS_BY_TOOL[tool].title}.`;
	}
	if (tool === 'move' || tool === 'eraser') {
		if (!session.frame.layers[session.currentLayer].pixels.some(Boolean)) {
			return `Draw something on the active layer before learning ${LESSONS_BY_TOOL[tool].title}.`;
		}
	}
	if (tool === 'eyedropper' && !hasSampleablePixel(session.doc, session.currentFrame)) {
		return 'Draw something visible on this frame before learning Eyedropper.';
	}
	return null;
}

interface PersistedState {
	completed: Tool[];
}

type MiniStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'doodledo.toolLessons';
const TOOLS = new Set<Tool>(TOOL_LESSONS.map((lesson) => lesson.tool));

export class ToolLessonsEngine {
	current: ToolLesson | null = null;
	currentComplete = false;
	private state: PersistedState | null = null;
	private listeners: (() => void)[] = [];

	constructor(private readonly storage?: MiniStorage) {}

	private store(): MiniStorage | null {
		if (this.storage) return this.storage;
		return typeof localStorage === 'undefined' ? null : localStorage;
	}

	private load(): PersistedState {
		if (this.state) return this.state;
		try {
			const value: unknown = JSON.parse(this.store()?.getItem(STORAGE_KEY) ?? '');
			const completed = typeof value === 'object' && value !== null && Array.isArray((value as PersistedState).completed)
				? (value as PersistedState).completed.filter((tool): tool is Tool => TOOLS.has(tool))
				: [];
			this.state = { completed: [...new Set(completed)] };
		} catch {
			this.state = { completed: [] };
		}
		return this.state;
	}

	private notify(): void {
		for (const listener of this.listeners) listener();
	}

	private save(): void {
		try {
			this.store()?.setItem(STORAGE_KEY, JSON.stringify(this.load()));
		} catch {
			// Browser storage can be unavailable; lessons still work for this session.
		}
		this.notify();
	}

	get completed(): readonly Tool[] {
		return this.load().completed;
	}

	isCompleted(tool: Tool): boolean {
		return this.load().completed.includes(tool);
	}

	start(tool: Tool): boolean {
		const next = LESSONS_BY_TOOL[tool];
		if (!next) return false;
		this.current = next;
		this.currentComplete = false;
		this.notify();
		return true;
	}

	// Completion is intentionally driven only by a real editor action.
	reportAction(tool: Tool): boolean {
		if (!this.current || this.current.tool !== tool || this.currentComplete) return false;
		this.currentComplete = true;
		if (!this.isCompleted(tool)) this.load().completed.push(tool);
		this.save();
		return true;
	}

	skip(): void {
		if (!this.current) return;
		const index = DEFAULT_TOOL_LESSONS.findIndex((lesson) => lesson.tool === this.current?.tool);
		const next = DEFAULT_TOOL_LESSONS[index + 1];
		this.current = next ?? null;
		this.currentComplete = false;
		this.notify();
	}

	close(): void {
		if (!this.current) return;
		this.current = null;
		this.currentComplete = false;
		this.notify();
	}

	replay(tool: Tool): boolean {
		return this.start(tool);
	}

	onChange(listener: () => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((candidate) => candidate !== listener);
		};
	}
}

export const toolLessons = new ToolLessonsEngine();
