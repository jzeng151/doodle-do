<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { downloadBlob, saveProjectToDisk } from '$lib/io/files';
	import { exportGif } from '$lib/io/export/gif';
	import { exportFramePngs } from '$lib/io/export/frames';
	import { doodledoJson, renderSheet, sheetLayout, texturePackerJson } from '$lib/io/export/spritesheet';
	import ActionMenu from '../ActionMenu.svelte';
	import SidePanel from '../SidePanel.svelte';
	import EditorCanvas from '../focus/EditorCanvas.svelte';
	import FrameStrip from '../focus/FrameStrip.svelte';
	import Toolbar from '../focus/Toolbar.svelte';

	let { session, fork }: { session: EditorSession; fork: EditorSession } = $props();
	const currentFrames = $derived((session.version, session.doc.frames.length));
	const forkFrames = $derived((fork.version, fork.doc.frames.length));
	let busy = $state(false);
	let error = $state('');
	let linkedZoom = $state(false);
	const active = $derived(session.comparisonActiveSide === 'fork' ? fork : session);
	const currentName = $derived((session.version, session.doc.meta.name));
	const comparisonName = $derived((fork.version, fork.doc.meta.name));
	$effect(() => {
		if (!linkedZoom || session.zoom === fork.zoom) return;
		if (session.comparisonActiveSide === 'fork') session.zoom = fork.zoom;
		else fork.zoom = session.zoom;
	});

	function forkName() {
		return `${(fork.doc.meta.name || 'untitled').replace(/[^\w-]+/g, '-')}-fork`;
	}

	async function run(label: string, action: () => Promise<void>) {
		busy = true;
		error = '';
		fork.lineEnd();
		fork.shapeEnd();
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
			const savingFork = fork;
			const commits = savingFork.unsavedCommits;
			if (!(await saveProjectToDisk(savingFork.doc, forkName()))) return;
			savingFork.savedToDiskAt = new Date();
			savingFork.unsavedCommits -= commits;
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

<div class="editor-switch" role="group" aria-label="Active comparison editor">
	<button aria-pressed={session.comparisonActiveSide === 'current'} onclick={() => (session.comparisonActiveSide = 'current')}>Edit A</button>
	<button aria-pressed={session.comparisonActiveSide === 'fork'} onclick={() => (session.comparisonActiveSide = 'fork')}>Edit B</button>
	<span>Inspector: {session.comparisonActiveSide === 'fork' ? `B · ${comparisonName}` : `A · ${currentName}`}</span>
	<label><input type="checkbox" bind:checked={linkedZoom} onchange={() => { if (linkedZoom) session.zoom = fork.zoom = Math.min(session.zoom, fork.zoom); }} />Link zoom</label>
</div>
<div class="compare-editing">
<div class="fork-editors" role="region" aria-label="Side-by-side editors">
	<section class="editor-pane" aria-labelledby="current-editor-heading" data-editor-branch="current" class:inactive={session.comparisonActiveSide !== 'current'} onfocusin={() => (session.comparisonActiveSide = 'current')}>
		<header class="pane-heading">
			<div class="pane-title">
				<strong id="current-editor-heading">A · {currentName}</strong>
				<span>{currentFrames} frames · Save/export target</span>
				<span>{session.unsavedCommits > 0 ? 'Not saved to disk' : session.savedToDiskAt ? 'Project saved' : 'Current project'}</span>
			</div>
			<div class="pane-actions">
				<button onclick={() => session.swapComparisonFork()}>Swap with fork</button>
			</div>
		</header>
		<Toolbar {session} />
		<div class="work-area">
			<EditorCanvas {session} branch="current" />
		</div>
		<FrameStrip {session} />
	</section>

	<section class="editor-pane" aria-labelledby="fork-editor-heading" data-editor-branch="fork" class:inactive={session.comparisonActiveSide !== 'fork'} onfocusin={() => (session.comparisonActiveSide = 'fork')}>
		<header class="pane-heading">
			<div class="pane-title">
				<strong id="fork-editor-heading">B · {comparisonName}{session.comparisonFromFile ? '' : ' (fork)'}</strong>
				<span>{forkFrames} frames · {fork.unsavedCommits > 0 ? 'Not saved to disk' : fork.savedToDiskAt ? 'Project saved' : session.comparisonFromFile ? 'File loaded' : 'Session only'}</span>
			</div>
			<div class="pane-actions">
				<button onclick={applyFork}>Apply as current</button>
				<button disabled={busy} onclick={saveFork}>Save project</button>
				<ActionMenu label="Export comparison" buttonText="Export">
				<p>Sheet export downloads a PNG and two JSON files.</p>
				<button disabled={busy} onclick={exportForkSheet}>Export sheet</button>
				<button disabled={busy} onclick={exportForkGif}>Export GIF</button>
				<button disabled={busy} onclick={exportForkFrames}>Export frames</button>
				</ActionMenu>
			</div>
			<span class="error" aria-live="polite">{error}</span>
		</header>
		<Toolbar session={fork} />
		<div class="work-area">
			<EditorCanvas session={fork} branch="fork" />
		</div>
		<FrameStrip session={fork} />
	</section>
</div>

	<div class="shared-inspector" data-editor-branch={session.comparisonActiveSide}>
		{#key active}
			<SidePanel session={active} />
		{/key}
	</div>
</div>

<style>
	.editor-switch { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 4px 12px; background: var(--paper); }
	.editor-switch span { flex: 1; font-size: .75rem; overflow-wrap: anywhere; }
	.editor-switch label { display: flex; align-items: center; gap: 4px; }
	.compare-editing { display: flex; flex: 1; min-height: 0; overflow: auto; }
	.shared-inspector { display: flex; min-height: 0; position: sticky; top: 0; align-self: stretch; }
	.fork-editors {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		background: var(--paper-2);
	}
	.editor-pane {
		min-width: 0;
		min-height: max-content;
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
	.pane-title { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .75rem; }
	.pane-heading strong { font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; }
	.pane-heading span { color: var(--gray); font-size: .6875rem; font-variant-numeric: tabular-nums; }
	.pane-actions { display: flex; align-items: center; gap: 4px; min-height: 2rem; overflow-x: auto; }
	.pane-actions button { flex: none; }
	.error:empty { display: none; }
	.work-area { display: flex; flex: 1; min-height: 360px; }
	@media (max-width: 860px) {
		.compare-editing { flex: none; flex-direction: column; }
		.fork-editors { display: block; }
		.compare-editing { overflow: visible; }
		.editor-pane.inactive { display: none; }
		.editor-pane + .editor-pane { border: 0; }
		.shared-inspector { display: block; position: static; }
	}
</style>
