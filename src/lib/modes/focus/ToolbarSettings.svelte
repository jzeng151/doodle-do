<script module lang="ts">
	export type ToolbarLayout = 'essentials' | 'full' | 'custom';
	export type ToolbarGroupId =
		| 'tools'
		| 'tool-options'
		| 'selection'
		| 'layer-transform'
		| 'history'
		| 'canvas-view'
		| 'onion-skin';
	export type ToolbarToolId =
		| 'pencil'
		| 'line'
		| 'rectangle'
		| 'ellipse'
		| 'move'
		| 'stamp'
		| 'eraser'
		| 'fill'
		| 'eyedropper'
		| 'select'
		| 'lasso'
		| 'wand'
		| 'polygon';
</script>

<script lang="ts">
	let {
		layout,
		customGroups,
		customTools,
		onLayoutChange,
		onCustomGroupsChange,
		onCustomToolsChange,
		onReset,
		onOpenToolLessons
	}: {
		layout: ToolbarLayout;
		customGroups: readonly ToolbarGroupId[];
		customTools: readonly ToolbarToolId[];
		onLayoutChange: (layout: ToolbarLayout) => void;
		onCustomGroupsChange: (groups: ToolbarGroupId[]) => void;
		onCustomToolsChange: (tools: ToolbarToolId[]) => void;
		onReset: () => void;
		onOpenToolLessons?: () => void;
	} = $props();

	let popoverEl: HTMLElement;
	let isOpen = $state(false);
	const popoverId = $props.id();
	const enabledGroups = $derived(new Set(customGroups));
	const enabledTools = $derived(new Set(customTools));

	const layouts: { id: ToolbarLayout; label: string }[] = [
		{ id: 'essentials', label: 'Essentials' },
		{ id: 'full', label: 'Full' },
		{ id: 'custom', label: 'Custom' }
	];
	const groups: { id: ToolbarGroupId; label: string }[] = [
		{ id: 'tools', label: 'Drawing tools' },
		{ id: 'tool-options', label: 'Active tool options' },
		{ id: 'selection', label: 'Selection controls' },
		{ id: 'layer-transform', label: 'Layer transforms' },
		{ id: 'history', label: 'Undo and redo' },
		{ id: 'canvas-view', label: 'Canvas view' },
		{ id: 'onion-skin', label: 'Onion skin' }
	];
	const tools: { id: ToolbarToolId; label: string }[] = [
		{ id: 'pencil', label: 'Pencil' },
		{ id: 'line', label: 'Line' },
		{ id: 'rectangle', label: 'Rectangle' },
		{ id: 'ellipse', label: 'Ellipse' },
		{ id: 'move', label: 'Move' },
		{ id: 'stamp', label: 'Stamp' },
		{ id: 'eraser', label: 'Eraser' },
		{ id: 'fill', label: 'Fill' },
		{ id: 'eyedropper', label: 'Eyedropper' },
		{ id: 'select', label: 'Select' },
		{ id: 'lasso', label: 'Lasso' },
		{ id: 'wand', label: 'Wand' },
		{ id: 'polygon', label: 'Polygon' }
	];

	export function open() {
		popoverEl.showPopover();
	}

	export function close() {
		popoverEl.hidePopover();
	}

	export function toggle() {
		popoverEl.togglePopover();
	}

	function setGroup(id: ToolbarGroupId, checked: boolean) {
		onCustomGroupsChange(groups.map((group) => group.id).filter((group) => group === id ? checked : enabledGroups.has(group)));
	}

	function setTool(id: ToolbarToolId, checked: boolean) {
		onCustomToolsChange(tools.map((tool) => tool.id).filter((tool) => tool === id ? checked : enabledTools.has(tool)));
	}

	function openLessons() {
		close();
		onOpenToolLessons?.();
	}
</script>

<button
	class="trigger"
	type="button"
	popovertarget={popoverId}
	aria-haspopup="true"
	aria-expanded={isOpen}
>
	Toolbar
</button>

<section
	bind:this={popoverEl}
	id={popoverId}
	class="settings"
	popover="auto"
	aria-labelledby={`${popoverId}-title`}
	ontoggle={(event) => (isOpen = event.newState === 'open')}
>
	<header>
		<h2 id={`${popoverId}-title`}>Toolbar settings</h2>
		<button class="close" type="button" onclick={close}>Close</button>
	</header>

	<fieldset class="layouts">
		<legend>Layout</legend>
		{#each layouts as option (option.id)}
			<label>
				<input
					type="radio"
					name={`${popoverId}-layout`}
					value={option.id}
					checked={layout === option.id}
					onchange={() => onLayoutChange(option.id)}
				/>
				<span>{option.label}</span>
			</label>
		{/each}
	</fieldset>

	{#if layout === 'custom'}
		<fieldset class="tools">
			<legend>Visible tools</legend>
			{#each tools as tool (tool.id)}
				<label>
					<input
						type="checkbox"
						checked={enabledTools.has(tool.id)}
						onchange={(event) => setTool(tool.id, event.currentTarget.checked)}
					/>
					<span>{tool.label}</span>
				</label>
			{/each}
		</fieldset>
		<fieldset class="groups">
			<legend>Visible groups</legend>
			{#each groups as group (group.id)}
				<label>
					<input
						type="checkbox"
						checked={enabledGroups.has(group.id)}
						onchange={(event) => setGroup(group.id, event.currentTarget.checked)}
					/>
					<span>{group.label}</span>
				</label>
			{/each}
		</fieldset>
	{/if}

	<div class="actions">
		<button type="button" onclick={onReset}>Reset toolbar defaults</button>
		{#if onOpenToolLessons}<button type="button" class="lessons" onclick={openLessons}>Open tool lessons</button>{/if}
	</div>
</section>

<style>
	.settings {
		position: fixed;
		inset: 1rem 1rem auto auto;
		width: min(22rem, calc(100vw - 1rem));
		max-height: calc(100dvh - 2rem);
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		overflow: auto;
		background: var(--paper);
		color: var(--ink);
		border: 3px solid var(--edge);
		border-radius: 0;
	}
	.settings::backdrop { background: transparent; }
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0.75rem;
		border-bottom: 2px solid var(--edge);
		background-image: radial-gradient(circle, color-mix(in srgb, var(--ink) 15%, transparent) 1px, transparent 1px);
		background-size: 7px 7px;
	}
	h2 {
		margin: 0;
		padding-right: 0.25rem;
		background: var(--paper);
		font-size: 0.9375rem;
	}
	.close {
		min-height: 28px;
		background: var(--paper);
	}
	fieldset {
		margin: 0;
		padding: 0.75rem;
		border: 0;
	}
	fieldset + fieldset { border-top: 2px solid var(--edge); }
	legend {
		padding: 0;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.layouts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2px;
	}
	.layouts legend { margin-bottom: 0.5rem; }
	.layouts label {
		position: relative;
		display: grid;
		min-width: 0;
	}
	.layouts input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.layouts span {
		display: grid;
		place-items: center;
		min-height: 32px;
		padding: 0.3em 0.45em;
		box-sizing: border-box;
		border: 2px solid var(--edge);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		cursor: pointer;
	}
	.layouts input:checked + span {
		background: var(--ink);
		color: var(--paper);
	}
	.layouts input:focus-visible + span {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	.groups, .tools {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem 0.75rem;
	}
	.groups legend, .tools legend { margin-bottom: 0.4rem; }
	.groups label, .tools label {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 32px;
		line-height: 1.25;
	}
	.groups input, .tools input {
		width: 1.1rem;
		height: 1.1rem;
		min-height: 0;
		margin: 0;
		accent-color: var(--ink);
	}
	.actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 6px;
		padding: 0.75rem;
		border-top: 2px solid var(--edge);
	}
	.lessons {
		background: var(--ink);
		color: var(--paper);
	}
	@media (pointer: coarse) {
		.layouts span, .groups label, .tools label, .groups input, .tools input { min-height: 44px; }
	}

	@media (max-width: 420px) {
		.settings {
			position: fixed;
			inset: auto 0.5rem 0.5rem;
			width: auto;
			margin: 0;
		}
		.groups, .tools, .actions { grid-template-columns: 1fr; }
	}
</style>
