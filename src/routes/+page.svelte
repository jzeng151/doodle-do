<script lang="ts">
	import { onMount } from 'svelte';
	import type { Doc } from '$lib/core/document';
	import { createDefaultDoc, EditorSession } from '$lib/editor/session.svelte';
	import { attachAutosave, loadAutosave } from '$lib/io/autosave';
	import { connectAgentBridge } from '$lib/agent/bridge';
	import { PRODUCT_CONTENT } from '$lib/content/product';
	import { tips } from '$lib/learn/tips';
	import Landing from '$lib/landing/Landing.svelte';
	import Workspace from '$lib/modes/Workspace.svelte';

	const T15_UNSAVED_MS = 20 * 60_000;

	let session = $state<EditorSession | null>(null);
	let entered = $state(false);
	let hasAutosave = $state(false);
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

	function enterEditor() {
		entered = true;
		if (location.hash !== '#editor') history.replaceState(null, '', '#editor');
	}

	onMount(() => {
		if (location.hash === '#editor') entered = true;
		const disconnectAgent = connectAgentBridge(() => session);
		loadAutosave().then((saved) => {
			hasAutosave = Boolean(saved);
			if (saved) startSession(saved, false);
			else startSession(createDefaultDoc(), true);
		});
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
			disconnectAgent();
			detachAutosave?.();
		};
	});
</script>

<svelte:head>
	<title>Doodle-Do — frame-by-frame pixel animation</title>
	<meta name="description" content={PRODUCT_CONTENT.description} />
</svelte:head>

{#if !entered}
	<Landing ready={Boolean(session)} resume={hasAutosave} onStart={enterEditor} />
{:else if session}
	{#key session}
		<Workspace {session} {onOpenDoc} />
	{/key}
{/if}

<style>
	:global(:root) {
		--paper: #f2efe6;
		--paper-2: #e9e5d9;
		--ink: #111111;
		--gray: #6a675f;
		--edge: #111111;
		--accent: #111111;
		--spot: #b52e2e;
		--onion-prev: #d04648;
		--onion-next: #6daa2c;
	}
	:global(body) {
		margin: 0;
		font-family: "Zen Kaku Gothic New", "Noto Sans", system-ui, sans-serif;
		font-size: 0.8125rem;
		background: var(--paper);
		color: var(--ink);
	}
	:global(button) {
		min-height: 32px;
		background: var(--paper);
		color: inherit;
		border: 2px solid var(--edge);
		border-radius: 0;
		padding: 0.3em 0.6em;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: 0.04em;
	}
	:global(button:hover:not(:disabled)) {
		background: var(--paper-2);
		color: var(--ink);
	}
	:global(button:disabled) {
		opacity: 0.4;
		cursor: default;
	}
	:global(button.active) {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}
	:global(input, select) {
		min-height: 28px;
		background: var(--paper);
		color: inherit;
		border: 2px solid var(--edge);
		border-radius: 0;
		padding: 0.25em 0.4em;
		font: inherit;
	}
	:global(:focus-visible) {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	@media (pointer: coarse) {
		:global(button, input, select) { min-height: 44px; }
		:global(button) { min-width: 44px; }
	}
</style>
