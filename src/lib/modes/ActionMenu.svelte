<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, buttonText = label, closeOnAction = true, children }: { label: string; buttonText?: string; closeOnAction?: boolean; children: Snippet } = $props();
	const id = $props.id();
	let trigger: HTMLButtonElement;
	let menu: HTMLDivElement;
	let expanded = $state(false);

	function position(event: Event) {
		if ((event as ToggleEvent).newState !== 'open') return;
		const rect = trigger.getBoundingClientRect();
		menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 264))}px`;
		menu.style.top = `${Math.min(rect.bottom + 4, window.innerHeight / 2)}px`;
		menu.style.maxHeight = `${window.innerHeight - Math.min(rect.bottom + 4, window.innerHeight / 2) - 8}px`;
	}
</script>

<button bind:this={trigger} popovertarget={id} aria-label={label} aria-expanded={expanded}>{buttonText}</button>
<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Only native button clicks are delegated; the group adds no interaction.) -->
<div bind:this={menu} {id} popover="auto" class="action-menu" role="group" aria-label={label}
	onbeforetoggle={position} ontoggle={(e) => (expanded = e.newState === 'open')}
	onclick={(e) => { if (closeOnAction && (e.target as HTMLElement).closest('button:not(:disabled)')) menu.hidePopover(); }}
	onkeydown={(e) => { if (e.key === 'Escape') trigger.focus(); }}>
	{@render children()}
</div>

<style>
	.action-menu { margin: 0; width: 248px; max-width: calc(100vw - 32px); padding: 6px; border: 2px solid var(--edge); background: var(--paper); color: var(--ink); overflow: auto; }
	.action-menu:popover-open { display: grid; gap: 4px; }
	.action-menu :global(button) { text-align: left; white-space: normal; }
	.action-menu :global(p) { margin: 4px; font-size: .75rem; }
</style>
