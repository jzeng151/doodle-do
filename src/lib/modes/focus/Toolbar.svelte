<script lang="ts">
	import ActionMenu from '../ActionMenu.svelte';
	import { onMount } from 'svelte';
	import { SELECT_TOOLS, type EditorSession, type Tool } from '$lib/editor/session.svelte';
	import {
		TOOLBAR_GROUP_IDS,
		TOOLBAR_TOOLS,
		toolbarPreferences,
		type ToolbarGroupId,
		type ToolbarToolId
	} from '$lib/settings/toolbar';
		import ToolbarSettings from './ToolbarSettings.svelte';

	let {
		session,
		onLearn,
		onOpenToolLessons
	}: {
		session: EditorSession;
		onLearn?: (tool: Tool) => void;
		onOpenToolLessons?: () => void;
	} = $props();

	const baseTools = TOOLBAR_TOOLS.filter(({ id }) => id !== 'stamp');
	const stampTool = TOOLBAR_TOOLS.find(({ id }) => id === 'stamp')!;
	const tools = $derived(session.stamp ? [...baseTools, stampTool] : baseTools);
	let preferences = $state(toolbarPreferences.snapshot);
	let toolbarSettings: ToolbarSettings | undefined;
	let moreToolsOpen = $state(false);
	const moreToolsId = $props.id();
	const orderedTools = $derived.by(() => {
		const available = new Map(tools.map((tool) => [tool.id, tool]));
		return preferences.toolOrder
			.map((id) => available.get(id))
			.filter((tool): tool is (typeof tools)[number] => !!tool);
	});
	const visibleTools = $derived(orderedTools.filter((tool) => toolbarPreferences.isToolVisible(tool.id as ToolbarToolId) || tool.id === session.tool));
	const hiddenTools = $derived(groupVisible('tools')
		? orderedTools.filter((tool) => !visibleTools.some((visible) => visible.id === tool.id))
		: orderedTools);
	const activeTool = $derived(tools.find((tool) => tool.id === session.tool) ?? tools[0]);
	const customGroups = $derived(TOOLBAR_GROUP_IDS.filter((id) => preferences.groupVisibility[id]));
	const customTools = $derived(preferences.toolOrder.filter((id) => preferences.toolVisibility[id]));

	const canUndo = $derived((session.version, session.bus.canUndo));
	const canRedo = $derived((session.version, session.bus.canRedo));
	const canvasWidth = $derived((session.version, session.doc.meta.width));
	const canvasHeight = $derived((session.version, session.doc.meta.height));
	const zoomLabel = $derived(`${Number((session.mode === 'grid' ? session.gridZoom : session.zoom).toFixed(2))}×`);
	const mirrorDrawingTools: Tool[] = ['pencil', 'eraser', 'line', 'rectangle', 'ellipse'];
	const supportsDrawingMirror = $derived(mirrorDrawingTools.includes(session.tool));
	const supportsSelectionMirror = $derived(SELECT_TOOLS.includes(session.tool));

	function zoomOut() {
		if (session.mode === 'grid') {
			session.zoomGridBy(-1);
			return;
		}
		session.zoom = Math.max(0.25, session.zoom - (session.zoom <= 1 ? 0.25 : 2));
	}

	function zoomIn() {
		if (session.mode === 'grid') {
			session.zoomGridBy(1);
			return;
		}
		session.zoom = Math.min(24, session.zoom + (session.zoom < 1 ? 0.25 : 2));
	}

	function groupVisible(id: ToolbarGroupId): boolean {
		void preferences;
		return toolbarPreferences.isGroupVisible(id);
	}

	function toolDisabled(tool: Tool): boolean {
		return SELECT_TOOLS.includes(tool) && session.mode !== 'focus' && session.mode !== 'compare';
	}


	function setCustomGroups(groups: ToolbarGroupId[]) {
		for (const id of TOOLBAR_GROUP_IDS) toolbarPreferences.setGroupVisible(id, groups.includes(id));
	}

	function setCustomTools(tools: ToolbarToolId[]) {
		for (const id of preferences.toolOrder) toolbarPreferences.setToolVisible(id, tools.includes(id));
	}

	function setToolOrder(tools: ToolbarToolId[]) {
		toolbarPreferences.setToolOrder(tools);
	}

	function resetToolbar() {
		toolbarPreferences.reset();
		toolbarPreferences.setChooserSeen();
	}

	function selectHiddenTool(tool: Tool) {
		session.setTool(tool);
		moreToolsOpen = false;
	}

	onMount(() => {
		const stop = toolbarPreferences.subscribe((next) => {
			preferences = next;
			if (next.layout === 'essentials') session.selectionMode = 'replace';
		});
		return stop;
	});
</script>

<div class="toolbar">
	<div class="quick-controls">
	{#if groupVisible('history')}
	<div class="group" role="group" aria-label="History">
		<button disabled={!canUndo} title="Undo (Ctrl+Z)" onclick={() => session.undo()}>Undo</button>
		<button disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" onclick={() => session.redo()}>Redo</button>
	</div>
	{/if}

	{#if groupVisible('canvas-view')}
	<div class="group" role="group" aria-label="Canvas view">
		<ActionMenu label="Canvas options" buttonText="View">
		<button aria-pressed={session.showGrid} class:active={session.showGrid} onclick={() => (session.showGrid = !session.showGrid)}>
			Grid
		</button>
		<button aria-pressed={session.tiledDrawing} class:active={session.tiledDrawing} title="Wrap drawing at canvas edges and show a repeat preview" onclick={() => { session.lineEnd(); session.shapeEnd(); session.tiledDrawing = !session.tiledDrawing; }}>Tile</button>
		</ActionMenu>
		<button aria-label="Zoom out" title="Zoom out" onclick={zoomOut}>−</button>
		<span class="zoom">{zoomLabel}</span>
		<button aria-label="Zoom in" title="Zoom in" onclick={zoomIn}>+</button>
	</div>
	{/if}

	</div>
	<div class="tool-controls">
	{#if groupVisible('tools')}
	<div class="group" role="group" aria-label="Tools">
		{#each visibleTools as t (t.id)}
			<button
				class:active={session.tool === t.id}
				aria-pressed={session.tool === t.id}
				disabled={toolDisabled(t.id)}
				title={`${t.description} (${t.key})${toolDisabled(t.id) ? '. Focus mode only' : ''}`}
				onclick={() => session.setTool(t.id)}
			>
				{t.shortLabel}
			</button>
		{/each}
	</div>
	{/if}
	{#if hiddenTools.length}
		{#if moreToolsOpen}
			<section id={moreToolsId} class="group more-tools" aria-label="More drawing tools">
				{#each hiddenTools as tool (tool.id)}
					<button
						disabled={toolDisabled(tool.id)}
						title={`${tool.description} (${tool.key})${toolDisabled(tool.id) ? '. Focus mode only' : ''}`}
						onclick={() => selectHiddenTool(tool.id)}
					>{tool.shortLabel}</button>
				{/each}
			</section>
		{/if}
		<div class="group"><button aria-expanded={moreToolsOpen} aria-controls={moreToolsId} onclick={() => (moreToolsOpen = !moreToolsOpen)}>More tools</button></div>
	{/if}
	<div class="group toolbar-actions">
		{#if onLearn}<button title={`Practice ${activeTool.label}`} onclick={() => onLearn?.(activeTool.id)}>Learn</button>{/if}
		<ToolbarSettings
			bind:this={toolbarSettings}
			layout={preferences.layout}
			{customGroups}
			{customTools}
			toolOrder={preferences.toolOrder}
			onLayoutChange={(layout) => toolbarPreferences.setLayout(layout)}
			onCustomGroupsChange={setCustomGroups}
			onCustomToolsChange={setCustomTools}
			onToolOrderChange={setToolOrder}
			onReset={resetToolbar}
			{onOpenToolLessons}
		/>
	</div>
	</div>
	<div class="context-controls" role="group" aria-label="Active tool options">
	{#if groupVisible('selection') && SELECT_TOOLS.includes(session.tool)}
		<div class="group" role="group" aria-label="Selection mode">
			{#each ['replace', 'add', 'subtract', 'intersect'] as mode}
				<button
					class:active={session.selectionMode === mode}
					aria-pressed={session.selectionMode === mode}
					onclick={() => (session.selectionMode = mode as typeof session.selectionMode)}
				>
					{mode[0].toUpperCase() + mode.slice(1)}
				</button>
			{/each}
			<button onclick={() => session.selectAll()}>All</button>
			<button onclick={() => session.deselect()}>Deselect</button>
			<button onclick={() => session.invertSelection()}>Invert</button>
			<button disabled={!session.canReselect} onclick={() => session.reselect()}>Reselect</button>
		</div>
	{/if}
	{#if groupVisible('selection') && session.selectionMask && !session.selectionGestureActive}
		<div class="group"><button onclick={() => session.captureSelectionStamp()}>Make stamp</button></div>
	{/if}
	{#if groupVisible('selection') && session.tool === 'stamp'}
		<div class="group" role="group" aria-label="Stamp transform">
			<button onclick={() => session.flipStamp()}>Flip stamp</button>
			<button onclick={() => session.rotateStamp()}>Turn stamp</button>
		</div>
	{/if}

	{#if groupVisible('tool-options')}
	<div class="group" role="group" aria-label="Brush settings">
		{#if supportsDrawingMirror}
		<label>
			Size
			<select bind:value={session.brushSize} onchange={() => { session.lineEnd(); session.shapeEnd(); }}>
				{#each [1, 2, 3, 4] as s (s)}
					<option value={s}>{s}px</option>
				{/each}
			</select>
		</label>
		{/if}
		{#if supportsDrawingMirror || supportsSelectionMirror}
			<button
				class:active={session.mirrorX}
				aria-pressed={session.mirrorX}
				aria-label="Mirror X"
				title="Mirror-draw: paint both halves at once"
				onclick={() => session.toggleMirror()}
			>
				Mirror X
			</button>
		{/if}
		{#if supportsDrawingMirror}
			<button class:active={session.mirrorY} aria-pressed={session.mirrorY} aria-label="Mirror Y" title="Mirror-draw across a horizontal axis" onclick={() => session.toggleMirrorY()}>Mirror Y</button>
			{#if session.mirrorX}<label>X axis<input type="number" min="0" max={canvasWidth - 1} step="0.5" value={session.mirrorAxisX} onchange={(e) => session.setMirrorAxis('x', e.currentTarget.valueAsNumber)} /></label>{/if}
			{#if session.mirrorY}<label>Y axis<input type="number" min="0" max={canvasHeight - 1} step="0.5" value={session.mirrorAxisY} onchange={(e) => session.setMirrorAxis('y', e.currentTarget.valueAsNumber)} /></label>{/if}
		{/if}
		{#if session.tool === 'pencil'}
			<button
				class:active={session.pixelPerfect}
				aria-pressed={session.pixelPerfect}
				title="Remove doubled pixels from freehand corners"
				onclick={() => (session.pixelPerfect = !session.pixelPerfect)}
			>
				Pixel perfect
			</button>
		{/if}
		{#if session.tool === 'fill'}
			<label title="How similar colors must be to the clicked color">
				Tolerance
				<input type="number" min="0" max="255" bind:value={session.fillTolerance} />
			</label>
			<button
				class:active={session.fillContiguous}
				aria-pressed={session.fillContiguous}
				title="Fill only the connected region or every matching pixel"
				onclick={() => (session.fillContiguous = !session.fillContiguous)}
			>
				{session.fillContiguous ? 'Connected' : 'All matching'}
			</button>
		{/if}
		{#if ['pencil', 'line', 'fill', 'rectangle', 'ellipse'].includes(session.tool)}
			<button
				class:active={session.ditherEnabled}
				aria-pressed={session.ditherEnabled}
				title="Alternate foreground and background colors in a fixed pattern"
				onclick={() => { session.lineEnd(); session.shapeEnd(); session.ditherEnabled = !session.ditherEnabled; }}
			>
				Dither
			</button>
			{#if session.ditherEnabled}
				<label>Pattern<select value={session.ditherSize} onchange={(e) => { session.lineEnd(); session.shapeEnd(); session.ditherSize = Number(e.currentTarget.value) as 2 | 3 | 4 | 5; }}>{#each [2, 3, 4, 5] as size}<option value={size}>{size}×{size}</option>{/each}</select></label>
			{/if}
		{/if}
		{#if session.tool === 'rectangle' || session.tool === 'ellipse'}
			<button
				class:active={session.shapeFilled}
				aria-pressed={session.shapeFilled}
				title="Fill the shape"
				onclick={() => { session.shapeEnd(); session.shapeFilled = !session.shapeFilled; }}
			>
				Filled
			</button>
		{/if}
	</div>
	{/if}

	{#if groupVisible('layer-transform')}
	<div class="group" role="group" aria-label="Flip layer">
		<button title="Flip layer horizontally" onclick={() => session.flip('horizontal')}>Flip H</button>
		<button title="Flip layer vertically" onclick={() => session.flip('vertical')}>Flip V</button>
	</div>

	{#if session.hasSelection}
	<div class="group" role="group" aria-label="Rotate selection">
		<button aria-label="Turn selection left 90 degrees" disabled={!session.hasSelection} title="Snap to the next 90-degree orientation left" onclick={() => session.rotateSelectionQuarter(-1)}>↶90°</button>
		<button aria-label="Turn selection right 90 degrees" disabled={!session.hasSelection} title="Snap to the next 90-degree orientation right" onclick={() => session.rotateSelectionQuarter(1)}>↷90°</button>
		<button
			aria-label="Rotate selection left 15 degrees"
			disabled={!session.hasSelection}
			title="Rotate selection 15 degrees left"
			onclick={() => session.rotateSelectionBy(-Math.PI / 12)}
		>
			−15°
		</button>
		<button
			aria-label="Rotate selection right 15 degrees"
			disabled={!session.hasSelection}
			title="Rotate selection 15 degrees right"
			onclick={() => session.rotateSelectionBy(Math.PI / 12)}
		>
			+15°
		</button>
	</div>
	{/if}
	{/if}

	</div>
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 2px solid var(--edge);
		background: var(--paper);
		align-items: center;
		flex-shrink: 0;
	}
	.quick-controls, .tool-controls, .context-controls {
		display: flex;
		align-items: center;
		gap: .25rem;
	}
	.quick-controls { flex-wrap: wrap; }
	.tool-controls {
		position: relative;
		flex: 1 1 18rem;
		min-width: 0;
		flex-wrap: wrap;
	}
	.context-controls { width: 100%; flex-wrap: wrap; border-top: 1px solid var(--gray); padding-top: 4px; }
	.context-controls:empty { display: none; }
	.tool-controls :global([aria-label="Tools"]) { flex: 0 1 auto; min-width: 0; flex-wrap: wrap; }
	.group {
		display: flex;
		flex: none;
		max-width: 100%;
		flex-wrap: wrap;
		gap: 2px;
		align-items: center;
	}
	.group + .group {
		padding-left: 0.375rem;
		border-left: 2px solid var(--edge);
	}
	.zoom {
		min-width: 2.5em;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	label {
		display: flex;
		gap: 0.35em;
		align-items: center;
	}
	label input[type='number'] { width: 4rem; }
	.toolbar-actions { margin-left: auto; }
	@media (max-width: 720px) {
		.toolbar { flex: none; }
	}
</style>
