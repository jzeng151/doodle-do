<script lang="ts">
	// Mode switcher with honest teaching tooltips (§3.3, §4.4).
	import type { EditorSession, Mode } from '$lib/editor/session.svelte';
	import { PRODUCT_CONTENT } from '$lib/content/product';

	let { session }: { session: EditorSession } = $props();

	const MODES: { id: Mode; label: string; tooltip: string }[] = PRODUCT_CONTENT.modes.map((mode) => ({
		id: mode.id,
		label: mode.label,
		tooltip: `Best for: ${mode.great} Less useful for: ${mode.strains}`
	}));
</script>

<div class="switcher" role="group" aria-label="Workspace mode">
	{#each MODES as m (m.id)}
		<button
			class:active={session.mode === m.id}
			aria-pressed={session.mode === m.id}
			title={m.tooltip}
			onclick={() => session.setMode(m.id)}
		>
			{m.label}
		</button>
	{/each}
</div>

<style>
	.switcher {
		display: flex;
		gap: 0;
		border: 2px solid var(--edge);
		overflow: hidden;
	}
	.switcher button {
		border: none;
		border-radius: 0;
	}
	.switcher button + button {
		border-left: 2px solid var(--edge);
	}
</style>
