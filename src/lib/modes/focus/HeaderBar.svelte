<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { downloadBlob, importStripFromDisk, openProjectFromDisk, saveProjectToDisk } from '$lib/io/files';
	import { exportGif } from '$lib/io/export/gif';
	import { doodledoJson, renderSheet, sheetLayout, texturePackerJson } from '$lib/io/export/spritesheet';
	import type { Doc } from '$lib/core/document';

	let {
		session,
		onOpenDoc
	}: { session: EditorSession; onOpenDoc: (doc: Doc | null) => void } = $props();

	let busy = $state(false);
	let error = $state('');

	function baseName(): string {
		return (session.doc.meta.name || 'untitled').replace(/[^\w-]+/g, '-');
	}

	async function run(label: string, fn: () => Promise<void>) {
		busy = true;
		error = '';
		try {
			await fn();
		} catch (e) {
			error = `${label} failed: ${e instanceof Error ? e.message : e}`;
		} finally {
			busy = false;
		}
	}

	const exportSheet = () =>
		run('Export', async () => {
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
			downloadBlob(await exportGif(session.doc), `${baseName()}.gif`);
		});

	const saveClick = () => run('Save', () => saveProjectToDisk(session.doc));
	const openClick = () => run('Open', async () => onOpenDoc(await openProjectFromDisk()));
	const importClick = () =>
		run('Import', async () => {
			const doc = await importStripFromDisk();
			if (doc) onOpenDoc(doc);
		});

	function newClick() {
		if (confirm('Start a new document? The current one stays in browser autosave until you draw again.')) {
			onOpenDoc(null);
		}
	}

	function rename(e: Event) {
		// doc name is meta, not pixel data — not undoable, straight write is fine here
		session.doc.meta.name = (e.currentTarget as HTMLInputElement).value;
	}
</script>

<header class="bar">
	<span class="brand">Doodle-Do</span>
	<input class="name" value={session.doc.meta.name} onchange={rename} aria-label="Document name" />
	<span class="status" aria-live="polite">
		{#if error}{error}{:else if session.autosavedAt}autosaved {session.autosavedAt.toLocaleTimeString()}{/if}
	</span>
	<div class="actions">
		<button onclick={newClick}>New</button>
		<button onclick={openClick} disabled={busy}>Open</button>
		<button
			onclick={importClick}
			disabled={busy}
			title="Import a sprite strip PNG (select its animations.json too for frame timing)"
		>
			Import strip
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
	</div>
</header>

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
