<script lang="ts">
	import { onMount } from 'svelte';
	import type { Doc } from '$lib/core/document';
	import { createDefaultDoc, EditorSession } from '$lib/editor/session.svelte';
	import { attachAutosave, loadAutosave } from '$lib/io/autosave';
	import { tips } from '$lib/learn/tips';
	import Workspace from '$lib/modes/Workspace.svelte';

	const T15_UNSAVED_MS = 20 * 60_000;

	let session = $state<EditorSession | null>(null);
	let detachAutosave: (() => void) | null = null;

	function startSession(doc: Doc, isNew: boolean) {
		detachAutosave?.();
		const next = new EditorSession(doc);
		detachAutosave = attachAutosave(next.bus, () => (next.autosavedAt = new Date()));
		session = next;
		if (isNew) tips.fire('T01');
	}

	function onOpenDoc(doc: Doc | null, isNew = false) {
		if (doc) startSession(doc, isNew);
		else startSession(createDefaultDoc(), true);
	}

	onMount(() => {
		loadAutosave().then((saved) =>
			saved ? startSession(saved, false) : startSession(createDefaultDoc(), true)
		);
		// T15: gentle export reminder after 20+ minutes of work not saved to
		// disk — exempt from the frequency cap, respects the global toggle
		let lastReminder = 0;
		const timer = setInterval(() => {
			const s = session;
			if (!s || s.unsavedCommits === 0) return;
			const clock = Math.max(s.savedToDiskAt?.getTime() ?? 0, s.startedAt, lastReminder);
			if (Date.now() - clock > T15_UNSAVED_MS && tips.fire('T15')) lastReminder = Date.now();
		}, 60_000);
		return () => {
			clearInterval(timer);
			detachAutosave?.();
		};
	});
</script>

<svelte:head>
	<title>Doodle-Do</title>
	<meta name="description" content="Frame-by-frame pixel animation tool that teaches you as you work" />
</svelte:head>

{#if session}
	{#key session}
		<Workspace {session} {onOpenDoc} />
	{/key}
{/if}

<style>
	:global(:root) {
		--edge: #3d4048;
		--accent: #4dabf7;
	}
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		font-size: 0.9rem;
		background: #1a1b1e;
		color: #e7e9ec;
	}
	:global(button) {
		background: #2c2e33;
		color: inherit;
		border: 1px solid var(--edge);
		border-radius: 4px;
		padding: 0.3em 0.6em;
		cursor: pointer;
	}
	:global(button:hover:not(:disabled)) {
		background: #383b42;
	}
	:global(button:disabled) {
		opacity: 0.4;
		cursor: default;
	}
	:global(button.active) {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	:global(input, select) {
		background: #2c2e33;
		color: inherit;
		border: 1px solid var(--edge);
		border-radius: 4px;
		padding: 0.25em 0.4em;
	}
	:global(:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
</style>
