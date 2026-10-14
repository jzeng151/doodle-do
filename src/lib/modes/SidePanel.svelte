<script lang="ts">
	// Docked panel shared by focus and grid modes: the always-playing loop,
	// layers, and palette — all bound to the same session.
	import type { EditorSession } from '$lib/editor/session.svelte';
	import LayerPanel from './focus/LayerPanel.svelte';
	import LoopPreview from './focus/LoopPreview.svelte';
	import PalettePanel from './focus/PalettePanel.svelte';
	import TilePreview from './focus/TilePreview.svelte';

	let { session }: { session: EditorSession } = $props();
</script>

<aside>
	<PalettePanel {session} />
	<LayerPanel {session} />
	<LoopPreview {session} />
	{#if session.tiledDrawing}<TilePreview {session} />{/if}
</aside>

<style>
	aside {
		width: 248px;
		padding: 8px;
		flex-shrink: 0;
		border-left: 3px solid var(--edge);
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
		background: var(--paper-2);
	}
	aside :global(section) { padding: 4px; background: var(--paper); flex-shrink: 0; }
	aside :global(.layers) { flex: 1; flex-shrink: 1; }
	@media (max-width: 860px) {
		aside { width: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); border-left: 0; border-top: 4px solid var(--edge); overflow: visible; }
		aside :global(section) { min-width: 0; }
	}
	@media (max-width: 620px) {
		aside { grid-template-columns: 1fr; }
	}
</style>
