<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { downloadBlob, saveProjectToDisk } from '$lib/io/files';
	import { exportGif } from '$lib/io/export/gif';
	import { exportFramePngs } from '$lib/io/export/frames';
	import { doodledoJson, renderSheet, sheetLayout, texturePackerJson } from '$lib/io/export/spritesheet';
	import SidePanel from '../SidePanel.svelte';
	import EditorCanvas from '../focus/EditorCanvas.svelte';
	import FrameStrip from '../focus/FrameStrip.svelte';
	import Toolbar from '../focus/Toolbar.svelte';

	let { session, fork }: { session: EditorSession; fork: EditorSession } = $props();
	const currentFrames = $derived((session.version, session.doc.frames.length));
	const forkFrames = $derived((fork.version, fork.doc.frames.length));
	let busy = $state(false);
	let error = $state('');

	function forkName() {
		return `${(fork.doc.meta.name || 'untitled').replace(/[^\w-]+/g, '-')}-fork`;
	}

	async function run(label: string, action: () => Promise<void>) {
		busy = true;
		error = '';
		fork.lineEnd();
		fork.commitFloating();
		try {
			await action();
		} catch (cause) {
			error = `${label} failed: ${cause instanceof Error ? cause.message : cause}`;
		} finally {
			busy = false;
		}
	}

	const saveFork = () =>
		run('Save', async () => {
			await saveProjectToDisk(fork.doc, forkName());
			fork.savedToDiskAt = new Date();
			fork.unsavedCommits = 0;
		});

	const exportForkSheet = () =>
		run('Export', async () => {
			const doc = fork.doc;
			const layout = sheetLayout(doc.frames.length, doc.meta.width, doc.meta.height);
			const image = `${forkName()}.png`;
			downloadBlob(await renderSheet(doc, fork.compositor, layout), image);
			downloadBlob(
				new Blob([texturePackerJson(doc, layout, image)], { type: 'application/json' }),
				`${forkName()}.json`
			);
			downloadBlob(
				new Blob([doodledoJson(doc, layout, image)], { type: 'application/json' }),
				`${forkName()}.doodledo.json`
			);
		});

	const exportForkGif = () =>
		run('GIF export', async () =>
			downloadBlob(await exportGif(fork.doc), `${forkName()}.gif`)
		);

	const exportForkFrames = () =>
		run('Frame export', async () =>
			downloadBlob(
				await exportFramePngs(fork.doc, fork.compositor),
				`${forkName()}-frames.zip`
			)
		);

	function applyFork() {
		if (window.confirm('Replace the current document with this fork? You can undo this change.')) {
			session.applyComparisonFork();
		}
	}
</script>

<div class="fork-editors" role="region" aria-label="Side-by-side editors">
	<section class="editor-pane" aria-labelledby="current-editor-heading" data-editor-branch="current">
		<header class="pane-heading">
			<div class="pane-title">
				<strong id="current-editor-heading">Current</strong>
				<span>{currentFrames} frames · Save/export target</span>
			</div>
			<div class="pane-actions">
				<button onclick={() => session.swapComparisonFork()}>Swap with fork</button>
			</div>
		</header>
		<Toolbar {session} />
		<div class="work-area">
			<EditorCanvas {session} branch="current" />
			<SidePanel {session} />
		</div>
		<FrameStrip {session} />
	</section>

	<section class="editor-pane" aria-labelledby="fork-editor-heading" data-editor-branch="fork">
		<header class="pane-heading">
			<div class="pane-title">
				<strong id="fork-editor-heading">Fork</strong>
				<span>{forkFrames} frames · Session only</span>
			</div>
			<div class="pane-actions">
				<button onclick={applyFork}>Apply as current</button>
				<button disabled={busy} onclick={saveFork}>Save project</button>
				<button disabled={busy} onclick={exportForkSheet}>Export sheet</button>
				<button disabled={busy} onclick={exportForkGif}>Export GIF</button>
				<button disabled={busy} onclick={exportForkFrames}>Export frames</button>
			</div>
			<span class="error" aria-live="polite">{error}</span>
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
		flex-direction: column;
		gap: .4rem;
		padding: .5rem .75rem;
		border-bottom: 2px solid var(--edge);
		background: var(--paper);
	}
	.pane-title { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
	.pane-heading strong { font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; }
	.pane-heading span { color: var(--gray); font-size: .6875rem; font-variant-numeric: tabular-nums; }
	.pane-actions { display: flex; align-items: center; gap: 4px; min-height: 2rem; overflow-x: auto; }
	.pane-actions button { flex: none; }
	.error:empty { display: none; }
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
