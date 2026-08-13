<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { downloadBlob, openFromDisk, saveProjectToDisk } from '$lib/io/files';
	import { exportGif } from '$lib/io/export/gif';
	import { exportFramePngs } from '$lib/io/export/frames';
	import { doodledoJson, renderSheet, sheetLayout, texturePackerJson } from '$lib/io/export/spritesheet';
	import { createDoc, type Doc } from '$lib/core/document';
	import { DEFAULT_PALETTE } from '$lib/core/palette';
	import { tips } from '$lib/learn/tips';
	import { onMount } from 'svelte';
	import ModeSwitcher from '../ModeSwitcher.svelte';
	import NewDocDialog from './NewDocDialog.svelte';
	import ResizeDialog from './ResizeDialog.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';

	let {
		session,
		onOpenDoc
	}: { session: EditorSession; onOpenDoc: (doc: Doc | null, isNew?: boolean) => void } = $props();

	let busy = $state(false);
	let error = $state('');
	let newDialog: NewDocDialog;
	let resizeDialog: ResizeDialog;
	let confirm: ConfirmDialog;
	let tipsHidden = $state(false);

	// Guard against silently discarding work not saved to disk (unsavedCommits
	// resets only on "Save project"). Applies to both New and Open — each
	// replaces the session the same way.
	const DISCARD_NEW = "You have changes that aren't saved to disk. Start a new animation anyway?";
	const DISCARD_OPEN = "You have changes that aren't saved to disk. Open another file anyway?";
	onMount(() => {
		tipsHidden = tips.hideAll;
		return tips.onChange(() => (tipsHidden = tips.hideAll));
	});

	function baseName(): string {
		return (session.doc.meta.name || 'untitled').replace(/[^\w-]+/g, '-');
	}

	async function run(label: string, fn: () => Promise<void>) {
		busy = true;
		error = '';
		try {
			session.lineEnd();
			session.commitFloating(); // save/export must see the stamped document
			await fn();
		} catch (e) {
			error = `${label} failed: ${e instanceof Error ? e.message : e}`;
		} finally {
			busy = false;
		}
	}

	const exportSheet = () =>
		run('Export', async () => {
			tips.fire('T11');
			const doc = session.doc;
			const layout = sheetLayout(doc.frames.length, doc.meta.width, doc.meta.height);
			const image = `${baseName()}.png`;
			downloadBlob(await renderSheet(doc, session.compositor, layout), image);
			downloadBlob(
				new Blob([texturePackerJson(doc, layout, image)], { type: 'application/json' }),
				`${baseName()}.json`
			);
			downloadBlob(
				new Blob([doodledoJson(doc, layout, image)], { type: 'application/json' }),
				`${baseName()}.doodledo.json`
			);
		});

	const exportGifClick = () =>
		run('GIF export', async () => {
			tips.fire('T11');
			downloadBlob(await exportGif(session.doc), `${baseName()}.gif`);
		});

	const exportFramesClick = () =>
		run('Frame export', async () => {
			tips.fire('T11');
			downloadBlob(await exportFramePngs(session.doc, session.compositor), `${baseName()}-frames.zip`);
		});

	const saveClick = () =>
		run('Save', async () => {
			await saveProjectToDisk(session.doc);
			session.savedToDiskAt = new Date(); // resets the T15 reminder clock
			session.unsavedCommits = 0;
		});
	async function openClick() {
		session.lineEnd();
		if (session.unsavedCommits > 0 && !(await confirm.open(DISCARD_OPEN))) return;
		run('Open', async () => {
			const doc = await openFromDisk();
			if (doc) onOpenDoc(doc);
		});
	}

	async function newClick() {
		session.lineEnd();
		if (session.unsavedCommits > 0 && !(await confirm.open(DISCARD_NEW))) return;
		newDialog.open();
	}

	function createNew(width: number, height: number) {
		onOpenDoc(createDoc({ width, height, palette: DEFAULT_PALETTE }), true);
	}

	function resizeCanvas(width: number, height: number, mode: 'crop' | 'scale') {
		session.resizeCanvas(width, height, mode);
	}

	function rename(e: Event) {
		// doc name is meta, not pixel data — not undoable, straight write is fine here
		session.doc.meta.name = (e.currentTarget as HTMLInputElement).value;
	}
</script>

<header class="bar">
	<a class="home" href="/" aria-label="Doodle-Do home">
		<img class="mark" src="/assets/chicken-standing.png" alt="" /><span class="brand">Doodle-Do</span>
	</a>
	<ModeSwitcher {session} />
	<input class="name" value={session.doc.meta.name} onchange={rename} aria-label="Document name" />
	<span class="status" aria-live="polite">
		{#if error}{error}{:else if session.autosavedAt}autosaved {session.autosavedAt.toLocaleTimeString()}{/if}
	</span>
	<div class="actions">
		<button onclick={newClick}>New</button>
		<button onclick={() => resizeDialog.open(session.doc.meta.width, session.doc.meta.height)} title="Change the canvas size">
			Resize
		</button>
		<button
			onclick={openClick}
			disabled={busy}
			title="Open a project file or sprite strip PNG. Select its animations.json too if it contains frame timing."
		>
			Open
		</button>
		<button
			onclick={saveClick}
			disabled={busy}
			title="Save an editable project file to disk"
		>
			Save project
		</button>
		<button onclick={exportSheet} disabled={busy} title="PNG sprite sheet with JSON for Phaser and Godot">
			Export sheet
		</button>
		<button onclick={exportGifClick} disabled={busy} title="Animated GIF for sharing">
			Export GIF
		</button>
		<button onclick={exportFramesClick} disabled={busy} title="Individual frame PNGs, zipped">
			Export frames
		</button>
		<button
			class:active={!tipsHidden}
			aria-pressed={!tipsHidden}
			title="Show or hide all tips"
			onclick={() => tips.setHideAll(!tips.hideAll)}
		>
			Tips
		</button>
	</div>
</header>

<NewDocDialog bind:this={newDialog} onCreate={createNew} />
<ResizeDialog bind:this={resizeDialog} onResize={resizeCanvas} />
<ConfirmDialog bind:this={confirm} />

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.85rem;
		border-bottom: 4px solid var(--edge);
		background: var(--paper);
	}
	.mark { width: 28px; height: 28px; image-rendering: pixelated; }
	.home { display: flex; align-items: center; gap: .45rem; color: inherit; text-decoration: none; }
	.brand {
		font-size: 0.9375rem;
		font-weight: 950;
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}
	.name {
		width: 12em;
	}
	.status {
		flex: 1;
		font-size: 0.625rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.actions {
		display: flex;
		gap: 4px;
	}
	@media (max-width: 1050px) {
		.bar { flex-wrap: wrap; }
		.status { order: 3; flex: 1 1 12rem; min-width: 10rem; }
		.actions { width: 100%; overflow-x: auto; padding-bottom: .15rem; }
		.actions button { white-space: nowrap; }
	}
	@media (max-width: 620px) {
		.name { order: 3; width: 100%; }
		.status { order: 4; width: 100%; min-height: 1em; }
		.actions { order: 5; flex-wrap: wrap; overflow-x: visible; }
		.bar { gap: .45rem; }
	}
</style>
