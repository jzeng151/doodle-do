<script lang="ts">
	// Focus mode (§3.3): one large canvas + onion skin + docked live loop
	// + frame strip.
	import type { EditorSession } from '$lib/editor/session.svelte';
	import SidePanel from '../SidePanel.svelte';
	import EditorCanvas from './EditorCanvas.svelte';
	import FrameStrip from './FrameStrip.svelte';

	let { session }: { session: EditorSession } = $props();
</script>

<div class="middle">
	<EditorCanvas {session} />
	<SidePanel {session} />
</div>
<FrameStrip {session} />

<style>
	.middle {
		display: flex;
		flex: 1;
		min-height: 0;
	}
</style>
