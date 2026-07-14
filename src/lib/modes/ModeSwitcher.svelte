<script lang="ts">
	// Mode switcher with honest teaching tooltips (§3.3, §4.4).
	import type { EditorSession, Mode } from '$lib/editor/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const MODES: { id: Mode; label: string; tooltip: string }[] = [
		{
			id: 'focus',
			label: 'Focus',
			tooltip:
				'Great at: drawing one frame with onion-skin context. Strains when: comparing many frames at once.'
		},
		{
			id: 'grid',
			label: 'Grid',
			tooltip:
				'Great at: seeing and editing every frame side by side. Strains when: doing detail work on a single frame.'
		},
		{
			id: 'loop',
			label: 'Loop',
			tooltip:
				'Great at: judging the motion at full speed. Strains when: you need to draw — switch back to edit.'
		}
	];
</script>

<div class="switcher" role="group" aria-label="Workspace mode">
	{#each MODES as m (m.id)}
		<button class:active={session.mode === m.id} title={m.tooltip} onclick={() => session.setMode(m.id)}>
			{m.label}
		</button>
	{/each}
</div>

<style>
	.switcher {
		display: flex;
		gap: 0;
		border: 1px solid var(--edge);
		border-radius: 5px;
		overflow: hidden;
	}
	.switcher button {
		border: none;
		border-radius: 0;
	}
	.switcher button + button {
		border-left: 1px solid var(--edge);
	}
</style>
