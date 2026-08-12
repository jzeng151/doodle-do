<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import SidePanel from '../SidePanel.svelte';
	import EditorCanvas from '../focus/EditorCanvas.svelte';
	import FrameStrip from '../focus/FrameStrip.svelte';
	import Toolbar from '../focus/Toolbar.svelte';

	let { session, fork }: { session: EditorSession; fork: EditorSession } = $props();
	const currentFrames = $derived((session.version, session.doc.frames.length));
	const forkFrames = $derived((fork.version, fork.doc.frames.length));
</script>

<div class="fork-editors" role="region" aria-label="Side-by-side editors">
	<section class="editor-pane" aria-labelledby="current-editor-heading">
		<header class="pane-heading">
			<strong id="current-editor-heading">Current</strong>
			<span>{currentFrames} frames · Save/export target</span>
		</header>
		<Toolbar {session} />
		<div class="work-area">
			<EditorCanvas {session} branch="current" />
			<SidePanel {session} />
		</div>
		<FrameStrip {session} />
	</section>

	<section class="editor-pane" aria-labelledby="fork-editor-heading">
		<header class="pane-heading">
			<strong id="fork-editor-heading">Fork</strong>
			<span>{forkFrames} frames · Session only</span>
		</header>
		<Toolbar session={fork} />
		<div class="work-area">
			<EditorCanvas session={fork} branch="fork" />
			<SidePanel session={fork} />
		</div>
		<FrameStrip session={fork} />
	</section>
</div>

<style>
	.fork-editors {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		background: var(--paper-2);
	}
	.editor-pane {
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.editor-pane + .editor-pane { border-left: 4px solid var(--edge); }
	.pane-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: .75rem;
		padding: .5rem .75rem;
		border-bottom: 2px solid var(--edge);
		background: var(--paper);
	}
	.pane-heading strong { font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; }
	.pane-heading span { color: var(--gray); font-size: .6875rem; font-variant-numeric: tabular-nums; }
	.work-area { display: flex; flex: 1; min-height: 0; }
	@media (max-width: 1000px) {
		.fork-editors {
			grid-template-columns: 1fr;
			grid-auto-rows: minmax(700px, 1fr);
			overflow-y: auto;
		}
		.editor-pane + .editor-pane { border-left: 0; border-top: 4px solid var(--edge); }
	}
</style>
