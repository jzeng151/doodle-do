export const TOOLBAR_LAYOUTS = ['essentials', 'full', 'custom'] as const;
export type ToolbarLayout = (typeof TOOLBAR_LAYOUTS)[number];

export const TOOL_IDS = [
	'pencil',
	'line',
	'rectangle',
	'ellipse',
	'move',
	'stamp',
	'eraser',
	'fill',
	'eyedropper',
	'select',
	'lasso',
	'wand',
	'polygon'
] as const;
export type ToolbarToolId = (typeof TOOL_IDS)[number];

export const TOOLBAR_GROUP_IDS = [
	'tools',
	'tool-options',
	'selection',
	'layer-transform',
	'history',
	'canvas-view',
	'onion-skin'
] as const;
export type ToolbarGroupId = (typeof TOOLBAR_GROUP_IDS)[number];

export interface ToolbarPreferenceState {
	layout: ToolbarLayout;
	chooserSeen: boolean;
	toolOrder: ToolbarToolId[];
	toolVisibility: Record<ToolbarToolId, boolean>;
	groupVisibility: Record<ToolbarGroupId, boolean>;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Subscriber = (state: ToolbarPreferenceState) => void;

const STORAGE_KEY = 'doodledo.toolbar';
const ESSENTIAL_TOOLS = new Set<ToolbarToolId>(['pencil', 'eraser', 'fill', 'eyedropper', 'select']);
const ESSENTIAL_GROUPS = new Set<ToolbarGroupId>([
	'tools',
	'tool-options',
	'history',
	'canvas-view',
	'onion-skin'
]);

function flags<T extends string>(ids: readonly T[]): Record<T, boolean> {
	return Object.fromEntries(ids.map((id) => [id, true])) as Record<T, boolean>;
}

export function defaultToolbarPreferences(): ToolbarPreferenceState {
	return {
		layout: 'full',
		chooserSeen: false,
		toolOrder: [...TOOL_IDS],
		toolVisibility: flags(TOOL_IDS),
		groupVisibility: flags(TOOLBAR_GROUP_IDS)
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeIds<T extends string>(value: unknown, allowed: readonly T[]): T[] {
	if (!Array.isArray(value)) return [...allowed];
	const valid = new Set(allowed);
	const result = value.filter((id): id is T => typeof id === 'string' && valid.has(id as T));
	return [...new Set(result), ...allowed.filter((id) => !result.includes(id))];
}

function normalizeFlags<T extends string>(value: unknown, ids: readonly T[]): Record<T, boolean> {
	const source = isRecord(value) ? value : {};
	return Object.fromEntries(ids.map((id) => [id, typeof source[id] === 'boolean' ? source[id] : true])) as Record<T, boolean>;
}

function normalize(value: unknown): ToolbarPreferenceState {
	const source = isRecord(value) ? value : {};
	return {
		layout: TOOLBAR_LAYOUTS.includes(source.layout as ToolbarLayout)
			? (source.layout as ToolbarLayout)
			: 'full',
		chooserSeen: typeof source.chooserSeen === 'boolean' ? source.chooserSeen : false,
		toolOrder: normalizeIds(source.toolOrder, TOOL_IDS),
		toolVisibility: normalizeFlags(source.toolVisibility, TOOL_IDS),
		groupVisibility: normalizeFlags(source.groupVisibility, TOOLBAR_GROUP_IDS)
	};
}

export class ToolbarPreferences {
	private state: ToolbarPreferenceState;
	private readonly listeners = new Set<Subscriber>();

	constructor(private readonly injectedStorage?: StorageLike) {
		this.state = this.load();
	}

	private storage(): StorageLike | null {
		if (this.injectedStorage) return this.injectedStorage;
		try {
			return typeof localStorage === 'undefined' ? null : localStorage;
		} catch {
			return null;
		}
	}

	private load(): ToolbarPreferenceState {
		try {
			const saved = this.storage()?.getItem(STORAGE_KEY);
			return saved === null || saved === undefined ? defaultToolbarPreferences() : normalize(JSON.parse(saved));
		} catch {
			return defaultToolbarPreferences();
		}
	}

	private save(): void {
		try {
			this.storage()?.setItem(STORAGE_KEY, JSON.stringify(this.state));
		} catch {
			// The in-memory preference remains usable when storage is unavailable or full.
		}
		for (const listener of this.listeners) listener(this.snapshot);
	}

	get snapshot(): ToolbarPreferenceState {
		return structuredClone(this.state);
	}

	get needsChooser(): boolean {
		return !this.state.chooserSeen;
	}

	chooseLayout(layout: ToolbarLayout): void {
		this.state.layout = layout;
		this.state.chooserSeen = true;
		this.save();
	}

	setLayout(layout: ToolbarLayout): void {
		this.state.layout = layout;
		this.save();
	}

	setChooserSeen(seen = true): void {
		this.state.chooserSeen = seen;
		this.save();
	}

	setToolVisible(id: ToolbarToolId, visible: boolean): void {
		this.state.toolVisibility[id] = visible;
		this.save();
	}

	setGroupVisible(id: ToolbarGroupId, visible: boolean): void {
		this.state.groupVisibility[id] = visible;
		this.save();
	}

	setToolOrder(ids: readonly ToolbarToolId[]): void {
		this.state.toolOrder = normalizeIds(ids, TOOL_IDS);
		this.save();
	}

	isToolVisible(id: ToolbarToolId): boolean {
		if (this.state.layout === 'full') return true;
		if (this.state.layout === 'essentials') return ESSENTIAL_TOOLS.has(id);
		return this.state.toolVisibility[id];
	}

	isGroupVisible(id: ToolbarGroupId): boolean {
		if (this.state.layout === 'full') return true;
		if (this.state.layout === 'essentials') return ESSENTIAL_GROUPS.has(id);
		return this.state.groupVisibility[id];
	}

	visibleTools(): ToolbarToolId[] {
		return this.state.toolOrder.filter((id) => this.isToolVisible(id));
	}

	reset(): void {
		this.state = defaultToolbarPreferences();
		try {
			this.storage()?.removeItem(STORAGE_KEY);
		} catch {
			// Reset still applies in memory when storage is unavailable.
		}
		for (const listener of this.listeners) listener(this.snapshot);
	}

	subscribe(listener: Subscriber): () => void {
		this.listeners.add(listener);
		listener(this.snapshot);
		return () => this.listeners.delete(listener);
	}
}

export const toolbarPreferences = new ToolbarPreferences();
