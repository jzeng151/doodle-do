<script lang="ts">
	import { onMount } from 'svelte';
	import type { Doc } from '$lib/core/document';
	import { createDefaultDoc, EditorSession } from '$lib/editor/session.svelte';
	import { attachAutosave, loadAutosave } from '$lib/io/autosave';
	import FocusMode from '$lib/modes/focus/FocusMode.svelte';

	let session = $state<EditorSession | null>(null);
	let detachAutosave: (() => void) | null = null;

	function startSession(doc: Doc) {
		detachAutosave?.();
		const next = new EditorSession(doc);
		detachAutosave = attachAutosave(next.bus, () => (next.autosavedAt = new Date()));
		session = next;
	}

	function onOpenDoc(doc: Doc | null) {
		// null = "New" — a fresh default document
		if (doc) startSession(doc);
		else startSession(createDefaultDoc());
	}

	onMount(() => {
		loadAutosave().then((saved) => startSession(saved ?? createDefaultDoc()));
		return () => detachAutosave?.();
	});
</script>

<svelte:head>
	<title>Doodle-Do</title>
	<meta name="description" content="Frame-by-frame pixel animation tool that teaches you as you work" />
</svelte:head>

{#if session}
	{#key session}
		<FocusMode {session} {onOpenDoc} />
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
