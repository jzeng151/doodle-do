<script lang="ts">
	// Tips are never modal (Appendix A): a passive toast, keyboard-reachable,
	// that steals no focus.
	import { onMount } from 'svelte';
	import { tips } from '$lib/learn/tips';

	let current = $state(tips.current);
	onMount(() => tips.onChange(() => (current = tips.current)));
</script>

{#if current}
	<aside class="tip" role="status">
		<span class="cue">Tip #{current.id.slice(1)}</span>
		<p>{current.copy}</p>
		<div class="tip-actions">
			<button onclick={() => tips.dismiss()}>Dismiss</button>
			<button onclick={() => tips.dismissForever()}>Don't show again</button>
		</div>
	</aside>
{/if}

<style>
	.tip {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: center;
		max-width: none;
		background: var(--paper);
		border: 0;
		border-top: 3px solid var(--ink);
		padding: 0.65rem 0.85rem;
	}
	.tip p {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.45;
	}
	.cue { display:inline-block; margin-bottom:.35rem; font-size:.625rem; font-weight:900; letter-spacing:.14em; }
	.tip-actions {
		display: flex;
		gap: 6px;
	}
	.tip-actions button {
		font-size: 0.75rem;
	}
	@media (max-width: 620px) {
		.tip { grid-template-columns: auto 1fr; }
		.tip-actions { grid-column: 1 / -1; flex-wrap: wrap; }
	}
</style>
