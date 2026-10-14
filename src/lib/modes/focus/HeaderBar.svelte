<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { downloadBlob, openFromDisk, openChickenExample, saveProjectToDisk } from '$lib/io/files';
	import { exportGif } from '$lib/io/export/gif';
	import { exportFramePngs } from '$lib/io/export/frames';
	import { doodledoJson, renderSheet, sheetLayout, texturePackerJson } from '$lib/io/export/spritesheet';
	import { createDoc, type Doc } from '$lib/core/document';
	import { DEFAULT_PALETTE } from '$lib/core/palette';
	import { tips } from '$lib/learn/tips';
	import { onMount } from 'svelte';
	import ActionMenu from '../ActionMenu.svelte';
	import { TOOLBAR_TOOLS } from '$lib/settings/toolbar';
	import ModeSwitcher from '../ModeSwitcher.svelte';
	import NewDocDialog from './NewDocDialog.svelte';
	import ResizeDialog from './ResizeDialog.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';

	let {
		session,
		onOpenDoc
	}: { session: EditorSession; onOpenDoc: (doc: Doc | null, isNew?: boolean) => void } = $props();

	let busy = $state(false);
	let busyLabel = $state('');
	let error = $state('');
	let newDialog: NewDocDialog;
	let resizeDialog: ResizeDialog;
	let confirm: ConfirmDialog;
	let confirmingLeave = false;
	let allowNavigation = false;
	let tipsHidden = $state(false);
	const documentName = $derived((session.version, session.doc.meta.name));
	const showExample = $derived(documentName === 'Untitled' && session.unsavedCommits === 0 && !session.savedToDiskAt);

	// Browser autosave does not replace an explicit "Save project" to disk.
	const DISCARD_NEW = "You have changes that aren't saved to disk. Start a new animation anyway?";
	const DISCARD_OPEN = "You have changes that aren't saved to disk. Open another file anyway?";
	const DISCARD_LEAVE = "You have changes that aren't saved to disk. Leave the editor anyway?";

	function hasUnsavedWork(): boolean {
		return [session, session.comparisonSession].some((editor) => {
			if (!editor) return false;
			editor.lineEnd();
			editor.shapeEnd();
			return editor.unsavedCommits > 0 || editor.floating !== null;
		});
	}

	beforeNavigate(async (navigation) => {
		if (allowNavigation) {
			allowNavigation = false;
			return;
		}
		if (!navigation.willUnload && navigation.to?.route.id === navigation.from?.route.id) return;
		if (!hasUnsavedWork()) return;
		navigation.cancel();
		// Closing or reloading uses the browser's native warning dialog.
		if (navigation.type === 'leave' || !navigation.to || confirmingLeave) return;
		confirmingLeave = true;
		try {
			if (!(await confirm.open(DISCARD_LEAVE))) return;
			allowNavigation = true;
			if (navigation.type === 'popstate') history.go(navigation.delta);
			else if (navigation.willUnload) location.assign(navigation.to.url);
			else await goto(navigation.to.url);
		} finally {
			confirmingLeave = false;
		}
	});

	onMount(() => {
		tipsHidden = tips.hideAll;
		return tips.onChange(() => (tipsHidden = tips.hideAll));
	});

	function baseName(): string {
		return (session.doc.meta.name || 'untitled').replace(/[^\w-]+/g, '-');
	}

	async function run(label: string, fn: () => Promise<void>, editor = session) {
		if (busy) return;
		busy = true;
		busyLabel = `${label} in progress…`;
		error = '';
		try {
			editor.lineEnd();
			editor.shapeEnd();
			editor.commitFloating(); // save/export must see the stamped document
			await fn();
		} catch (e) {
			error = `${label} failed: ${e instanceof Error ? e.message : e}`;
		} finally {
			busy = false;
			busyLabel = '';
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

	const saveClick = (editor = session) =>
		run('Save', async () => {
			const savingSession = editor;
			const commits = savingSession.unsavedCommits;
			if (!(await saveProjectToDisk(savingSession.doc))) return;
			savingSession.savedToDiskAt = new Date(); // resets the T15 reminder clock
			savingSession.unsavedCommits -= commits;
		}, editor);
	async function openClick() {
		if (hasUnsavedWork() && !(await confirm.open(DISCARD_OPEN))) return;
		run('Open', async () => {
			const doc = await openFromDisk();
			if (doc) onOpenDoc(doc);
		});
	}

	async function newClick() {
		if (hasUnsavedWork() && !(await confirm.open(DISCARD_NEW))) return;
		newDialog.open();
	}

	async function exampleClick() {
		if (hasUnsavedWork() && !(await confirm.open(DISCARD_OPEN))) return;
		await run('Load example', async () => onOpenDoc(await openChickenExample(), true));
	}

	function saveShortcut(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
		event.preventDefault();
		const target = event.target as HTMLElement;
		const editor = session.mode === 'compare' && target.closest('[data-editor-branch="fork"]')
			? session.comparisonSession ?? session : session;
		void saveClick(editor);
	}

	function createNew(width: number, height: number) {
		onOpenDoc(createDoc({ width, height, palette: DEFAULT_PALETTE }), true);
	}

	function resizeCanvas(width: number, height: number, mode: 'crop' | 'scale' | 'scale2x') {
		session.resizeCanvas(width, height, mode);
	}

	function rename(e: Event) {
		session.rename((e.currentTarget as HTMLInputElement).value);
	}
</script>

<svelte:window onkeydown={saveShortcut} />

<header class="bar">
	<a class="home" href="/" aria-label="Doodle-Do home">
		<img class="mark" src="/assets/chicken-standing.png" alt="" /><span class="brand">Doodle-Do</span>
	</a>
	<ModeSwitcher {session} />
	<input class="name" value={documentName} onchange={rename} aria-label="Document name" />
	<span class="status" aria-live="polite">
		{#if error}{error}{:else if busyLabel}{busyLabel}{:else}
			{#if session.autosaveError}Autosave failed: {session.autosaveError}. Save a project file.
			{:else if session.autosavePending}Autosaving…
			{:else if session.autosavedAt}Browser autosaved {session.autosavedAt.toLocaleTimeString()}{/if}
			{#if (session.unsavedCommits > 0 || session.savedToDiskAt) && (session.autosaveError || session.autosavePending || session.autosavedAt)} · {/if}
			{#if session.unsavedCommits > 0}Not saved to disk
			{:else if session.savedToDiskAt}Project saved{/if}
		{/if}
	</span>
	<div class="actions" aria-busy={busy}>
		{#if showExample}<button onclick={exampleClick} disabled={busy}>Try chicken example</button>{/if}
		<ActionMenu label="File">
		<button onclick={newClick}>New animation</button>
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
			{#if !showExample}<button onclick={exampleClick} disabled={busy}>Try chicken example</button>{/if}
		</ActionMenu>
		<button
			onclick={() => saveClick()}
			disabled={busy}
			title="Save an editable project file to disk (Ctrl/Cmd+S)"
			aria-keyshortcuts="Control+s Meta+s"
		>
			Save project
		</button>
		<ActionMenu label="Export">
		<p>Sprite sheet: one PNG, TexturePacker JSON, and Doodle-Do JSON. Allow all three downloads.</p>
		<button onclick={exportSheet} disabled={busy} title="PNG sprite sheet with JSON for Phaser and Godot">
			Export sheet
		</button>
		<button onclick={exportGifClick} disabled={busy} title="Animated GIF for sharing">
			Export GIF
		</button>
		<button onclick={exportFramesClick} disabled={busy} title="Individual frame PNGs, zipped">
			Export frames
		</button>
		</ActionMenu>
		<ActionMenu label="Help">
		<button
			class:active={!tipsHidden}
			aria-pressed={!tipsHidden}
			title="Show or hide all tips"
			onclick={() => tips.setHideAll(!tips.hideAll)}
		>
			Tips
		</button>
		<details>
			<summary>Keyboard shortcuts</summary>
			<p>Ctrl/Cmd + S: save project<br />Ctrl/Cmd + Z: undo<br />Ctrl/Cmd + Shift + Z: redo</p>
			<p>With canvas focus: {TOOLBAR_TOOLS.map((tool) => `${tool.key} ${tool.label}`).join(' · ')}.</p>
			<p>Arrow keys: move pixel cursor. Space/Enter: use tool. Page Up/Down: change frame. 1–4: change view. X: swap colors. O: onion skin. [ / ]: brush size.</p>
			<p>Ctrl/Cmd + A: select all. D: deselect; Shift + D: reselect. J: extract selection. Shift + I: invert selection. Alt + arrows: move selection.</p>
		</details>
		</ActionMenu>
	</div>
</header>

<NewDocDialog bind:this={newDialog} onCreate={createNew} />
<ResizeDialog bind:this={resizeDialog} onResize={resizeCanvas} />
<ConfirmDialog bind:this={confirm} />

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
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
		font-size: 0.6875rem;
		color: var(--gray);
		flex-basis: 10rem;
		overflow-wrap: anywhere;
	}
	.actions {
		display: flex;
		gap: 4px;
	}
	@media (max-width: 1050px) {
		.bar { flex-wrap: wrap; }
		.status { order: 3; flex: 1 1 12rem; min-width: 10rem; }
		.actions { width: 100%; overflow-x: auto; padding-bottom: .15rem; }
		.actions :global(button) { white-space: nowrap; }
	}
	@media (max-width: 620px) {
		.name { order: 3; width: 100%; }
		.status { order: 4; width: 100%; min-height: 1em; }
		.actions { order: 5; flex-wrap: wrap; overflow-x: visible; }
		.bar { gap: .45rem; }
	}
</style>
