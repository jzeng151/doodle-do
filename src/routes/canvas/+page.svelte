<script lang="ts">
	import { onMount } from 'svelte';
	import type { Doc } from '$lib/core/document';
	import { createDefaultDoc, EditorSession } from '$lib/editor/session.svelte';
	import { attachAutosave, loadAutosave } from '$lib/io/autosave';
	import { connectAgentBridge } from '$lib/agent/bridge';
	import { tips } from '$lib/learn/tips';
	import AppStyles from '$lib/AppStyles.svelte';
	import Workspace from '$lib/modes/Workspace.svelte';

	const T15_UNSAVED_MS = 20 * 60_000;

	let session = $state<EditorSession | null>(null);
	let detachAutosave: (() => void) | null = null;

	function startSession(doc: Doc, isNew: boolean) {
		detachAutosave?.();
		const next = new EditorSession(doc);
		detachAutosave = attachAutosave(next.bus, () => (next.autosavedAt = new Date()), () => next.autosaveSnapshot());
		session = next;
		if (isNew) tips.fire('T01');
	}

	function onOpenDoc(doc: Doc | null, isNew = false) {
		startSession(doc ?? createDefaultDoc(), isNew || !doc);
	}

	onMount(() => {
		const disconnectAgent = connectAgentBridge(() => session);
		loadAutosave().then((saved) => startSession(saved ?? createDefaultDoc(), !saved));

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
	<title>Doodle-Do canvas</title>
</svelte:head>

<AppStyles />
{#if session}
	{#key session}
		<Workspace {session} {onOpenDoc} />
	{/key}
{/if}
