<script lang="ts">
	// Docked panel shared by focus and grid modes: the always-playing loop,
	// layers, and palette — all bound to the same session.
	import type { EditorSession } from '$lib/editor/session.svelte';
	import LayerPanel from './focus/LayerPanel.svelte';
	import LoopPreview from './focus/LoopPreview.svelte';
	import PalettePanel from './focus/PalettePanel.svelte';

	let { session }: { session: EditorSession } = $props();
</script>

<aside>
	<LoopPreview {session} />
	<LayerPanel {session} />
	<PalettePanel {session} />
</aside>

<style>
	aside {
		width: 200px;
		padding: 0.75rem;
		border-left: 1px solid var(--edge);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		overflow-y: auto;
	}
</style>
