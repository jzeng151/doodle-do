<script lang="ts">
	import ActionMenu from '../ActionMenu.svelte';
	import { onMount } from 'svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { toolbarPreferences } from '$lib/settings/toolbar';
	let { session }: { session: EditorSession } = $props();
	let visible = $state(toolbarPreferences.isGroupVisible('onion-skin'));
	onMount(() => toolbarPreferences.subscribe(() => (visible = toolbarPreferences.isGroupVisible('onion-skin'))));
	const clampOnionRange = (value: number) => Math.max(1, Math.min(8, Math.round(value) || 1));
</script>

	{#if visible}
	<div class="group onion" role="group" aria-label="Onion skin">
		<button
			class:active={session.onionEnabled}
			aria-pressed={session.onionEnabled}
			title="Onion skin: previous frame red, next frame green"
			onclick={() => session.toggleOnion()}
		>
			Onion
		</button>
		<ActionMenu label="Onion settings" closeOnAction={false}>
			<div class="options">
		<input
			type="range"
			min="0.1"
			max="0.8"
			step="0.05"
			bind:value={session.onionOpacity}
			disabled={!session.onionEnabled}
			title="Onion skin opacity"
			aria-label="Onion skin opacity"
		/>
		<button
			class:active={session.onionPreviousEnabled}
			aria-pressed={session.onionPreviousEnabled}
			disabled={!session.onionEnabled}
			title="Show the previous frame onion skin"
			onclick={() => (session.onionPreviousEnabled = !session.onionPreviousEnabled)}
		>
			<i class="onion-swatch previous" aria-hidden="true"></i>Previous
		</button>
		<label title="Number of previous frames"><span class="sr-only">Previous onion frames</span><input type="number" min="1" max="8" bind:value={() => session.onionPreviousRange, (value) => (session.onionPreviousRange = clampOnionRange(value))} disabled={!session.onionEnabled || !session.onionPreviousEnabled} /></label>
		<button
			class:active={session.onionNextEnabled}
			aria-pressed={session.onionNextEnabled}
			disabled={!session.onionEnabled}
			title="Show the next frame onion skin"
			onclick={() => (session.onionNextEnabled = !session.onionNextEnabled)}
		>
			<i class="onion-swatch next" aria-hidden="true"></i>Next
		</button>
		<label title="Number of next frames"><span class="sr-only">Next onion frames</span><input type="number" min="1" max="8" bind:value={() => session.onionNextRange, (value) => (session.onionNextRange = clampOnionRange(value))} disabled={!session.onionEnabled || !session.onionNextEnabled} /></label>
			</div>
		</ActionMenu>
	</div>
	{/if}

<style>
	.options { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 4px; }
	.group { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
	label { display: flex; align-items: center; gap: 4px; }
	.onion input { width: 72px; accent-color: var(--ink); }
	.onion input[type='number'] { width: 3.25rem; }
	.onion-swatch { display: inline-block; width: .65rem; height: .65rem; margin-right: .3rem; }
	.onion-swatch.previous { background: color-mix(in srgb, var(--onion-prev) 55%, var(--paper)); }
	.onion-swatch.next { background: var(--onion-next); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
