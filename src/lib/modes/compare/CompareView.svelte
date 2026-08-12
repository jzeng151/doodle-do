<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';
	import AnimationComparison from './AnimationComparison.svelte';
	import ForkEditors from './ForkEditors.svelte';

	let { session }: { session: EditorSession } = $props();
	let screen = $state<'edit' | 'playback'>('edit');
	const fork = $derived((session.comparisonVersion, session.comparisonSession as EditorSession));

	function resetFork() {
		if (window.confirm('Discard the fork edits and copy the current document into it again?')) {
			session.resetComparisonFork();
		}
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
				onclick={() => (screen = 'playback')}
			>
				Compare animations
			</button>
		</div>
		{#if screen === 'edit'}
			<button title="Discard fork edits and copy the current document again" onclick={resetFork}>
				Reset fork
			</button>
		{/if}
	</header>

	{#if screen === 'edit'}
		<div id="fork-editors" class="screen">
			{#key session.comparisonVersion}
				<ForkEditors {session} {fork} />
			{/key}
		</div>
	{:else}
		<div id="animation-comparison" class="screen">
			<AnimationComparison {session} {fork} />
		</div>
	{/if}
</section>

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
		.view-bar { align-items: stretch; flex-direction: column; }
		.tabs button { flex: 1; }
	}
</style>
