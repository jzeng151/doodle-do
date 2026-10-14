<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { openFromDisk } from '$lib/io/files';
	import ConfirmDialog from '../focus/ConfirmDialog.svelte';
	import AnimationComparison from './AnimationComparison.svelte';
	import ForkEditors from './ForkEditors.svelte';

	let { session }: { session: EditorSession } = $props();
	let screen = $state<'edit' | 'playback'>('edit');
	let confirm: ConfirmDialog;
	let busy = $state(false);
	let error = $state('');
	const fork = $derived((session.comparisonVersion, session.comparisonSession as EditorSession));

	function resetFork() {
		if (window.confirm('Discard the fork edits and copy the current document into it again?')) {
			session.resetComparisonFork();
		}
	}

	async function loadComparison() {
		busy = true;
		error = '';
		try {
			const doc = await openFromDisk();
			if (!doc) return;
			fork.lineEnd();
			fork.shapeEnd();
			if ((fork.unsavedCommits > 0 || fork.floating) && !(await confirm.open('The comparison has changes not saved to disk. Replace it with this file?'))) return;
			session.loadComparison(doc);
		} catch (cause) {
			error = `Load comparison failed: ${cause instanceof Error ? cause.message : cause}`;
		} finally {
			busy = false;
		}
	}

	function showPlayback() {
		session.lineEnd();
		session.shapeEnd();
		fork.lineEnd();
		fork.shapeEnd();
		session.commitFloating();
		fork.commitFloating();
		screen = 'playback';
	}
</script>

<section class="compare-view" aria-label="Compare view">
	<header class="view-bar">
		<div class="tabs" role="group" aria-label="Compare screen">
			<button
				class:active={screen === 'edit'}
				aria-pressed={screen === 'edit'}
				onclick={() => (screen = 'edit')}
			>
				Edit side by side
			</button>
			<button
				class:active={screen === 'playback'}
				aria-pressed={screen === 'playback'}
				onclick={showPlayback}
			>
				Compare animations
			</button>
		</div>
		<button disabled={busy} onclick={loadComparison} title="Load a project or sprite strip into comparison B">Load comparison</button>
		{#if screen === 'edit'}
			<button title="Discard fork edits and copy the current document again" onclick={resetFork}>
				Reset fork
			</button>
		{/if}
	</header>

	{#if error}<p class="error" role="alert">{error}</p>{/if}
	{#if screen === 'edit'}
		<div id="fork-editors" class="screen">
			{#key session.comparisonVersion}
				<ForkEditors {session} {fork} />
			{/key}
		</div>
	{:else}
		<div id="animation-comparison" class="screen">
			{#key session.comparisonVersion}
				<AnimationComparison {session} {fork} />
			{/key}
		</div>
	{/if}
</section>

<ConfirmDialog bind:this={confirm} />

<style>
	.compare-view,
	.screen {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.view-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: .75rem;
		padding: .45rem .75rem;
		border-bottom: 3px solid var(--edge);
		background: var(--paper);
	}
	.tabs { display: flex; }
	.tabs button + button { margin-left: -2px; }
	.tabs button.active { position: relative; background: var(--ink); color: var(--paper); }
	@media (max-width: 620px) {
		.view-bar { flex-wrap: wrap; }
		.tabs { flex-basis: 100%; }
		.tabs button { flex: 1; }
	}
</style>
