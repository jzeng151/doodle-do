<script lang="ts">
	import { MAX_PALETTE } from '$lib/core/document';
	import type { EditorSession } from '$lib/editor/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const palette = $derived((session.version, [...session.doc.palette]));
	// removal needs a remap target when the color is in use (B6):
	// click Remove, then click the target swatch
	let removePending = $state<number | null>(null);
	let swapInput: HTMLInputElement;
	let swapIndex = -1;

	function onSwatchClick(i: number) {
		if (removePending !== null) {
			if (removePending !== i) session.removePaletteColor(removePending, i);
			removePending = null;
			return;
		}
		session.colorValue = i + 1;
	}

	function startSwap(i: number) {
		if (session.paletteLocked) return;
		swapIndex = i;
		swapInput.value = palette[i];
		swapInput.click();
	}
</script>

<section class="palette-panel">
	<header>
		<h2>Palette</h2>
		<button
			class:active={session.paletteLocked}
			aria-pressed={session.paletteLocked}
			title="Palette lock: how artists keep a piece looking coherent"
			onclick={() => session.togglePaletteLock()}
		>
			{session.paletteLocked ? 'Locked' : 'Lock'}
		</button>
	</header>

	<div class="swatches">
		<button
			class="swatch eraser"
			class:selected={session.colorValue === 0}
			title="Transparent (eraser)"
			aria-label="Transparent"
			aria-pressed={session.colorValue === 0}
			onclick={() => (session.colorValue = 0)}
		></button>
		{#each palette as hex, i (i)}
			<button
				class="swatch"
				class:selected={session.colorValue === i + 1}
				class:doomed={removePending === i}
				style="background: {hex}"
				title="{hex} — double-click to edit"
				aria-label="Color {hex}"
				aria-pressed={session.colorValue === i + 1}
				onclick={() => onSwatchClick(i)}
				ondblclick={() => startSwap(i)}
			></button>
		{/each}
	</div>

	{#if removePending !== null}
		<p class="hint">Click a swatch to remap the removed color onto it, or Esc to cancel.</p>
	{/if}

	<div class="actions">
		<button
			disabled={session.paletteLocked || session.colorValue === 0}
			onclick={() => startSwap(session.colorValue - 1)}
		>
			Edit
		</button>
		<button
			disabled={session.paletteLocked || palette.length >= MAX_PALETTE}
			onclick={() => session.addPaletteColor('#ffffff')}
		>
			Add
		</button>
		<button
			disabled={session.paletteLocked || palette.length <= 1 || session.colorValue === 0}
			title="Remove selected color (pick a remap target next)"
			onclick={() => (removePending = session.colorValue - 1)}
		>
			Remove
		</button>
	</div>

	<!-- hidden native color input drives palette swap (§4.2: every pixel updates instantly) -->
	<input
		bind:this={swapInput}
		type="color"
		class="swap-input"
		aria-hidden="true"
		tabindex="-1"
		onchange={(e) => session.swapPaletteColor(swapIndex, e.currentTarget.value)}
	/>
</section>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (removePending = null)} />

<style>
	.palette-panel header {
		display: flex;
		align-items: center;
	}
	h2 {
		font-size: 0.6875rem;
		margin: 0;
		flex: 1;
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 22px);
		gap: 3px;
		margin: 0.4rem 0;
	}
	.swatch {
		width: 22px;
		height: 22px;
		padding: 0;
		border: 1px solid var(--edge);
		cursor: pointer;
	}
	.swatch.selected {
		outline: 3px solid var(--ink);
		outline-offset: 1px;
	}
	.swatch.doomed {
		outline: 2px dashed var(--spot);
	}
	.eraser {
		background: repeating-conic-gradient(var(--checker-muted) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 8px 8px;
	}
	.actions {
		display: flex;
		gap: 4px;
	}
	.hint {
		font-size: 0.75rem;
		margin: 0 0 0.4rem;
		opacity: 0.8;
	}
	.swap-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}
	@media (pointer: coarse) {
		.swatches { grid-template-columns: repeat(auto-fit, 44px); }
		.swatch { width: 44px; }
	}
</style>
