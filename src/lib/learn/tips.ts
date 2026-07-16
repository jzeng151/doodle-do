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
			['T01', 'Your animation is already playing in the loop preview — everything you draw shows up there instantly.', 2],
			['T02', 'The red ghost is your previous frame. Draw where things *have moved to*, not where they were.', 2],
			['T03', 'Nice — duplicating and nudging is how most animation actually gets made. Small changes between frames read as smooth motion.', 2],
			['T04', 'Onion skin is training wheels that pros never take off. You can lower its opacity instead in the slider.', 1],
			['T05', 'For tiny areas the pencil is usually faster and more precise than fill.', 2],
			['T06', 'Great pixel art usually uses surprisingly few colors. Try a starter palette — limits make choices easier.', 1],
			['T07', 'Locked: you can only place palette colors now. This is how artists keep a piece looking coherent.', 1],
			['T08', 'Every pixel using that color just updated. Recolor whole characters this way — try a night-time version.', 1],
			['T09', 'Classic pixel animation often runs at 6–10 FPS. More frames per second means more frames to draw — smoothness comes from good in-betweens, not speed.', 2],
			['T10', "Longer isn't always better — a tight 4-frame loop often reads better than a loose 8. The loop preview never lies.", 1],
			['T11', 'Sprite sheet + JSON drops straight into Phaser or Godot. GIF is for showing off.', 2],
			['T12', 'Scrub through frame by frame — notice how little actually changes between frames. Use Trace to draw over it.', 2],
			['T13', "Both sides at once — perfect for front-facing characters. Turn it off for walk cycles; walking isn't symmetrical.", 1],
			['T14', 'Click anywhere outside to stamp it down. Undo removes the whole move in one step.', 2],
			['T15', 'Your work autosaves in the browser, but a project file on disk is the only copy you truly own.', null],
			['T16', 'Shift adds another region to the selection. Drag the handle above it to rotate, and hold Shift to snap the angle.', 2],
			['T17', "Rectangles aren't the only option: Lasso (L), Wand (W), and Polygon (P) select any shape.", 2],
			['T18', 'Click to place corners. Click the first corner again, or press Enter, to close the shape. Esc discards it.', 2],
			['T19', 'Ctrl+J lifts the selection onto its own layer, ready to move independently.', 2],
			['T20', 'Arrow keys nudge a selection one pixel at a time.', 2],
			['T21', 'Use From and To under the scrubber to loop just a few frames while you polish them.', 2],
			['T22', 'Done sketching on a separate layer? Merge down flattens it into the layer below in one step.', 2],
			['T23', 'Send to frame copies or moves a layer to another frame. Handy for reusing a background everywhere.', 2],
			['T24', 'Mirror is on, so your selection has a twin across the centerline. Moves and rotations stay symmetric.', 2],
			['T25', 'Ctrl-click frames in the strip to edit several at once; Shift-click selects a range.', 2],
			['T26', 'Bulk edit is on: strokes, fills, and selection moves hit every highlighted frame. Plain-click a frame to edit one again.', 2]
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
