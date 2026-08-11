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
		<span class="cue">{current.id}</span>
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
		background: var(--paper);
		border: 3px solid var(--ink);
		border-radius: 22px;
		padding: 0.85rem 1rem;
		z-index: 10;
	}
	.tip::after { content:''; position:absolute; left:28px; bottom:-15px; width:20px; height:16px; background:var(--paper); border-right:3px solid var(--ink); border-bottom:3px solid var(--ink); transform:skewX(-26deg); }
	.tip p {
		margin: 0 0 0.5rem;
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
		.tip { position: relative; left: auto; bottom: auto; max-width: none; margin: .75rem; }
	}
</style>
