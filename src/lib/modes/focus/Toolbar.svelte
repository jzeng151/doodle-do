<script lang="ts">
	import { SELECT_TOOLS, type EditorSession, type Tool } from '$lib/editor/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const tools: { id: Tool; label: string; key: string; description: string }[] = [
		{ id: 'pencil', label: 'Pencil', key: 'B', description: 'Draw pixels with the selected color' },
		{ id: 'eraser', label: 'Eraser', key: 'E', description: 'Remove pixels from the current layer' },
		{ id: 'fill', label: 'Fill', key: 'G', description: 'Fill a connected area with the selected color' },
		{ id: 'eyedropper', label: 'Pick', key: 'I', description: 'Pick a color from the canvas' },
		{ id: 'select', label: 'Select', key: 'M', description: 'Select a rectangular area' },
		{ id: 'lasso', label: 'Lasso', key: 'L', description: 'Draw a freehand selection' },
		{ id: 'wand', label: 'Wand', key: 'W', description: 'Select connected pixels of the same color' },
		{ id: 'polygon', label: 'Polygon', key: 'P', description: 'Select an area by placing points' }
	];

	const canUndo = $derived((session.version, session.bus.canUndo));
	const canRedo = $derived((session.version, session.bus.canRedo));
</script>

<div class="toolbar">
	<div class="group" role="group" aria-label="Tools">
		{#each tools as t (t.id)}
			<button
				class:active={session.tool === t.id}
				aria-pressed={session.tool === t.id}
				disabled={SELECT_TOOLS.includes(t.id) && session.mode !== 'focus'}
				title={`${t.description} (${t.key})${SELECT_TOOLS.includes(t.id) && session.mode !== 'focus' ? ' — Focus mode only' : ''}`}
				onclick={() => session.setTool(t.id)}
			>
				{t.label}
			</button>
		{/each}
	</div>

	<div class="group">
		<label>
			Size
			<select bind:value={session.brushSize}>
				{#each [1, 2, 3, 4] as s (s)}
					<option value={s}>{s}px</option>
				{/each}
			</select>
		</label>
		<button
			class:active={session.mirrorX}
			aria-pressed={session.mirrorX}
			title="Mirror-draw: paint both halves at once"
			onclick={() => session.toggleMirror()}
		>
			Mirror
		</button>
	</div>

	<div class="group">
		<button title="Flip layer horizontally" onclick={() => session.flip('horizontal')}>Flip H</button>
		<button title="Flip layer vertically" onclick={() => session.flip('vertical')}>Flip V</button>
	</div>

	<div class="group">
		<button disabled={!canUndo} title="Undo (Ctrl+Z)" onclick={() => session.undo()}>Undo</button>
		<button disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" onclick={() => session.redo()}>Redo</button>
	</div>

	<div class="group">
		<button aria-pressed={session.showGrid} class:active={session.showGrid} onclick={() => (session.showGrid = !session.showGrid)}>
			Grid
		</button>
		<button aria-label="Zoom out" title="Zoom out" onclick={() => (session.zoom = Math.max(2, session.zoom - 2))}>−</button>
		<span class="zoom">{session.zoom}×</span>
		<button aria-label="Zoom in" title="Zoom in" onclick={() => (session.zoom = Math.min(24, session.zoom + 2))}>+</button>
	</div>

	<div class="group onion">
		<button
			class:active={session.onionEnabled}
			aria-pressed={session.onionEnabled}
			title="Onion skin: previous frame red, next frame green"
			onclick={() => session.toggleOnion()}
		>
			Onion
		</button>
		<input
			type="range"
			min="0.1"
			max="0.8"
			step="0.05"
			bind:value={session.onionOpacity}
			disabled={!session.onionEnabled}
			title="Onion skin opacity"
			aria-label="Onion skin opacity"
		/>
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 2px solid var(--edge);
		background: var(--paper);
		align-items: center;
	}
	.group {
		display: flex;
		gap: 2px;
		align-items: center;
	}
	.group + .group {
		padding-left: 0.75rem;
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
	.onion input {
		width: 72px;
		accent-color: var(--ink);
	}
	@media (max-width: 720px) {
		.toolbar { flex-wrap: nowrap; overflow-x: auto; }
		.group { flex: none; }
	}
</style>
