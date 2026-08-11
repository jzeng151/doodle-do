// Tips engine (Appendix A). Hard rules: never modal (the UI renders a
// toast), at most one tip visible at a time, each tip fires at most `cap`
// times ever (tracked in localStorage), every tip individually dismissible
// forever, global hide-all toggle. T15 is exempt from the cap but respects
// the toggle. Copy is final-draft per the appendix.

export interface Tip {
	id: string;
	copy: string;
	cap: number | null; // null = exempt (T15)
}

export const TIPS: Record<string, Tip> = Object.fromEntries(
	(
		[
			['T01', 'The loop preview is already playing. Every edit appears there right away.', 2],
			['T02', 'The red ghost is your previous frame. Draw where things have moved to, not where they were.', 2],
			['T03', 'Duplicating a frame and nudging a few pixels is a common way to animate. Small changes between frames usually make motion look smoother.', 2],
			['T04', "Onion skin is useful even when you know what you're doing. If it gets in the way, lower its opacity with the slider.", 1],
			['T05', 'For tiny areas the pencil is usually faster and more precise than fill.', 2],
			['T06', 'Pixel art often works well with a small palette. Try the starter palette if choosing colors is slowing you down.', 1],
			['T07', 'Palette lock is on. You can only draw with colors already in the palette, which helps keep the artwork consistent.', 1],
			['T08', 'Changing a palette color updates every pixel that uses it. This can recolor a whole character at once.', 1],
			['T09', 'Pixel animation often runs at 6 to 10 FPS. Raising the frame rate means drawing more frames. Good in-betweens matter more than speed.', 2],
			['T10', 'A tight four-frame loop can read better than a loose eight-frame loop. Check the preview before adding more frames.', 1],
			['T11', 'The sprite sheet export includes JSON files for Phaser and Godot. Use GIF when you only need to share the animation.', 2],
			['T12', 'Move through the animation one frame at a time and notice how little changes. Turn on onion skin when you need the neighboring frames as a guide.', 2],
			['T13', 'Mirror paints both sides at once, which works well for front-facing characters. Turn it off for asymmetrical motion such as a walk cycle.', 1],
			['T14', 'Click anywhere outside to stamp it down. Undo removes the whole move in one step.', 2],
			['T15', 'Autosave keeps a browser copy. Save a project file if you want an editable copy on disk.', null],
			['T16', 'Hold Shift to add another region to the selection. Rotate it from the toolbar, or drag the handle while holding Shift to snap the angle.', 2],
			['T17', 'Use Lasso (L), Wand (W), or Polygon (P) when a rectangle does not fit the shape.', 2],
			['T18', 'Click to place corners. Click the first corner again, or press Enter, to close the shape. Esc discards it.', 2],
			['T19', 'Ctrl+J moves the selection onto its own layer so you can move it independently.', 2],
			['T20', 'Arrow keys nudge a selection one pixel at a time.', 2],
			['T21', "Set From and To to repeat only the frames you're working on.", 2],
			['T22', 'Merge down combines the current layer with the layer below it.', 2],
			['T23', 'Send to frame can copy or move a layer to another frame. Use it to reuse a background.', 2],
			['T24', 'Mirror is on. Your selection has a twin across the centerline, and both copies move and rotate together.', 2],
			['T25', 'Ctrl-click frames in the strip to edit several at once; Shift-click selects a range.', 2],
			['T26', 'Bulk edit is on. Strokes, fills, and selection moves affect every highlighted frame. Click a frame without a modifier key to edit only that one.', 2]
		] as [string, string, number | null][]
	).map(([id, copy, cap]) => [id, { id, copy, cap }])
);

interface PersistedState {
	counts: Record<string, number>;
	dismissed: string[];
	hideAll: boolean;
}

type MiniStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'doodledo.tips';

export class TipsEngine {
	current: Tip | null = null;
	private state: PersistedState | null = null;
	private sessionShown = new Set<string>();
	private listeners: (() => void)[] = [];

	constructor(private readonly storage?: MiniStorage) {}

	private store(): MiniStorage | null {
		if (this.storage) return this.storage;
		return typeof localStorage === 'undefined' ? null : localStorage;
	}

	private load(): PersistedState {
		if (!this.state) {
			try {
				this.state = JSON.parse(this.store()?.getItem(STORAGE_KEY) ?? '');
			} catch {
				this.state = null;
			}
			this.state ??= { counts: {}, dismissed: [], hideAll: false };
		}
		return this.state;
	}

	private save(): void {
		this.store()?.setItem(STORAGE_KEY, JSON.stringify(this.load()));
		for (const l of this.listeners) l();
	}

	get hideAll(): boolean {
		return this.load().hideAll;
	}

	setHideAll(value: boolean): void {
		this.load().hideAll = value;
		if (value) this.current = null;
		this.save();
	}

	// Returns true when the tip is now showing.
	fire(id: string): boolean {
		const tip = TIPS[id];
		if (!tip) return false;
		const state = this.load();
		if (state.hideAll) return false;
		if (this.current) return false; // one tip at a time
		if (state.dismissed.includes(id)) return false;
		if (tip.cap !== null) {
			if (this.sessionShown.has(id)) return false; // once per session
			if ((state.counts[id] ?? 0) >= tip.cap) return false;
		}

		state.counts[id] = (state.counts[id] ?? 0) + 1;
		this.sessionShown.add(id);
		this.current = tip;
		this.save();
		return true;
	}

	dismiss(): void {
		this.current = null;
		for (const l of this.listeners) l();
	}

	dismissForever(): void {
		if (!this.current) return;
		const state = this.load();
		if (!state.dismissed.includes(this.current.id)) state.dismissed.push(this.current.id);
		this.current = null;
		this.save();
	}

	onChange(listener: () => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}
}

export const tips = new TipsEngine();
