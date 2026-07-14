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

	let {
		session,
		onOpenDoc
	}: { session: EditorSession; onOpenDoc: (doc: Doc | null, isNew?: boolean) => void } = $props();

	let busy = $state(false);
	let error = $state('');
	let newDialog: NewDocDialog;
	let tipsHidden = $state(false);
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
	const openClick = () =>
		run('Open', async () => {
			const doc = await openFromDisk();
			if (doc) onOpenDoc(doc);
		});

	function createNew(width: number, height: number) {
		onOpenDoc(createDoc({ width, height, palette: DEFAULT_PALETTE }), true);
	}

	function rename(e: Event) {
		// doc name is meta, not pixel data — not undoable, straight write is fine here
		session.doc.meta.name = (e.currentTarget as HTMLInputElement).value;
	}
</script>

<header class="bar">
	<span class="brand">Doodle-Do</span>
	<ModeSwitcher {session} />
	<input class="name" value={session.doc.meta.name} onchange={rename} aria-label="Document name" />
	<span class="status" aria-live="polite">
		{#if error}{error}{:else if session.autosavedAt}autosaved {session.autosavedAt.toLocaleTimeString()}{/if}
	</span>
	<div class="actions">
		<button onclick={() => newDialog.open()}>New</button>
		<button
			onclick={openClick}
			disabled={busy}
			title="Open a project file, or a sprite strip PNG (select its animations.json too for frame timing)"
		>
			Open
		</button>
		<button
			onclick={saveClick}
			disabled={busy}
			title="A project file on disk is the only copy you truly own"
		>
			Save project
		</button>
		<button onclick={exportSheet} disabled={busy} title="PNG sprite sheet + JSON for Phaser/Godot">
			Export sheet
		</button>
		<button onclick={exportGifClick} disabled={busy} title="Animated GIF, for showing off">
			Export GIF
		</button>
		<button onclick={exportFramesClick} disabled={busy} title="Individual frame PNGs, zipped">
			Export frames
		</button>
		<button
			class:active={!tipsHidden}
			title="Show or hide all tips"
			onclick={() => tips.setHideAll(!tips.hideAll)}
		>
			Tips
		</button>
	</div>
</header>

<NewDocDialog bind:this={newDialog} onCreate={createNew} />

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--edge);
	}
	.brand {
		font-weight: 700;
	}
	.name {
		width: 12em;
	}
	.status {
		flex: 1;
		font-size: 0.8rem;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.actions {
		display: flex;
		gap: 4px;
	}
</style>
