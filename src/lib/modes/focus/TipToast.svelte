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
		<p>{current.copy}</p>
		<div class="tip-actions">
			<button onclick={() => tips.dismiss()}>Dismiss</button>
			<button onclick={() => tips.dismissForever()}>Don't show again</button>
		</div>
	</aside>
{/if}

<style>
	.tip {
		position: fixed;
		left: 1rem;
		bottom: 6.5rem; /* above the frame strip */
		max-width: 320px;
		background: #26282d;
		border: 1px solid var(--accent);
		border-radius: 6px;
		padding: 0.6rem 0.75rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		z-index: 10;
	}
	.tip p {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}
	.tip-actions {
		display: flex;
		gap: 6px;
	}
	.tip-actions button {
		font-size: 0.75rem;
	}
</style>
