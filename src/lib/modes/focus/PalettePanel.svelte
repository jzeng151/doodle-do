<script lang="ts">
	import { MAX_PALETTE } from '$lib/core/document';
	import type { EditorSession, ReplaceScope } from '$lib/editor/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const palette = $derived((session.version, [...session.doc.palette]));
	// removal needs a remap target when the color is in use (B6):
	// click Remove, then click the target swatch
	let removePending = $state<number | null>(null);
	let swapInput: HTMLInputElement;
	let swapIndex = -1;
	let replaceOpen = $state(false);
	let replaceFrom = $state(1);
	let replaceTo = $state(2);
	let replaceScope = $state<ReplaceScope>('layer');
	let replaceStatus = $state('');
	const replaceControlsId = $props.id();
	let paletteSignature = '';
	function resetReplaceEndpoints() {
		replaceFrom = Math.min(Math.max(1, session.colorValue), palette.length);
		replaceTo = replaceFrom === palette.length ? Math.max(1, replaceFrom - 1) : replaceFrom + 1;
	}
	$effect(() => {
		if (removePending !== null && session.colorValue !== removePending + 1) removePending = null;
		const signature = palette.join('\0');
		if (signature !== paletteSignature) {
			paletteSignature = signature;
			resetReplaceEndpoints();
		}
	});

	function onSwatchClick(e: MouseEvent, i: number) {
		if (e.ctrlKey) return;
		if (removePending !== null) {
			if (removePending !== i) session.removePaletteColor(removePending, i);
			removePending = null;
			return;
		}
		session.lineEnd();
		session.shapeEnd();
		session.colorValue = i + 1;
	}

	function onSwatchSecondary(e: MouseEvent, i: number) {
		e.preventDefault();
		removePending = null;
		session.lineEnd();
		session.shapeEnd();
		session.backgroundColorValue = i + 1;
	}

	function startSwap(i: number) {
		if (session.paletteLocked) return;
		removePending = null;
		swapIndex = i;
		swapInput.value = palette[i];
		swapInput.click();
	}

	function removeSelected() {
		const index = session.colorValue - 1;
		removePending = session.removePaletteColor(index) ? null : index;
	}

	function applyReplacement() {
		replaceStatus = '';
		try {
			session.replaceColor(replaceFrom, replaceTo, replaceScope);
		} catch (error) {
			replaceStatus = error instanceof Error ? error.message : 'Replacement failed.';
		}
	}
</script>

<section class="palette-panel">
	<header>
		<h2>Palette</h2>
		<button
			class:active={session.paletteLocked}
			aria-pressed={session.paletteLocked}
			title="Limit drawing to colors already in the palette"
			onclick={() => {
				removePending = null;
				session.togglePaletteLock();
			}}
		>
			{session.paletteLocked ? 'Locked' : 'Lock'}
		</button>
	</header>
	<div class="active-colors" aria-label="Active colors">
		<span class="active-color foreground" class:transparent={session.colorValue === 0} style={session.colorValue ? `background:${palette[session.colorValue - 1]}` : ''} title="Foreground color"></span>
		<span class="active-color background" class:transparent={session.backgroundColorValue === 0} style={session.backgroundColorValue ? `background:${palette[session.backgroundColorValue - 1]}` : ''} title="Background color"></span>
		<button title="Swap foreground and background colors (X)" onclick={() => session.swapActiveColors()}>Swap</button>
	</div>

	<div class="swatches">
		<button
			class="swatch eraser"
			class:selected={session.colorValue === 0}
			class:background-selected={session.backgroundColorValue === 0}
			title="Transparent (eraser)"
			aria-label="Transparent"
			aria-pressed={session.colorValue === 0}
			onclick={(e) => { if (!e.ctrlKey) { session.lineEnd(); session.shapeEnd(); session.colorValue = 0; } }}
			oncontextmenu={(e) => { e.preventDefault(); removePending = null; session.lineEnd(); session.shapeEnd(); session.backgroundColorValue = 0; }}
		></button>
		{#each palette as hex, i (i)}
			<button
				class="swatch"
				class:selected={session.colorValue === i + 1}
				class:background-selected={session.backgroundColorValue === i + 1}
				class:doomed={removePending === i}
				style="background: {hex}"
				title="{hex}. Click for foreground; secondary click for background; double-click to edit"
				aria-label="Color {hex}{session.backgroundColorValue === i + 1 ? ', background' : ''}"
				aria-pressed={session.colorValue === i + 1}
				onclick={(e) => onSwatchClick(e, i)}
				oncontextmenu={(e) => onSwatchSecondary(e, i)}
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
			title="Remove selected color"
			onclick={removeSelected}
		>
			Remove
		</button>
		<button
			aria-expanded={replaceOpen}
			aria-controls={replaceControlsId}
			onclick={() => {
				resetReplaceEndpoints();
				replaceOpen = !replaceOpen;
			}}
		>
			Replace
		</button>
	</div>

	{#if replaceOpen}
		<div id={replaceControlsId} class="replace-options">
			<label>From<select bind:value={replaceFrom}>{#each palette as hex, i}<option value={i + 1}>{hex}</option>{/each}</select></label>
			<label>To<select bind:value={replaceTo}>{#each palette as hex, i}<option value={i + 1}>{hex}</option>{/each}</select></label>
			<label>Scope<select bind:value={replaceScope}>
				<option value="selection" disabled={!session.hasSelection}>Selection</option>
				<option value="layer">Current layer</option>
				<option value="frame">Current frame</option>
				<option value="frames">Selected frames</option>
				<option value="animation">Entire animation</option>
			</select></label>
			<button disabled={replaceFrom === replaceTo || replaceFrom > palette.length || replaceTo > palette.length || (replaceScope === 'selection' && !session.hasSelection)} onclick={applyReplacement}>Apply replacement</button>
			{#if replaceStatus}<p class="hint" aria-live="polite">{replaceStatus}</p>{/if}
		</div>
	{/if}

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
	.active-colors { display: flex; align-items: center; gap: .35rem; margin-top: .4rem; }
	.active-color { width: 28px; height: 28px; border: 2px solid var(--ink); }
	.active-color.transparent { background: repeating-conic-gradient(var(--checker-muted) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 8px 8px; }
	.active-color.background { margin-left: -14px; margin-top: 12px; }
	.active-colors button { margin-left: auto; }
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
	.swatch.background-selected { box-shadow: inset 0 0 0 2px var(--paper), inset 0 0 0 4px var(--ink); }
	.eraser {
		background: repeating-conic-gradient(var(--checker-muted) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 8px 8px;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.replace-options { display: grid; gap: .35rem; margin-top: .5rem; padding-top: .5rem; border-top: 2px solid var(--ink); }
	.replace-options label { display: grid; grid-template-columns: 3.5rem 1fr; align-items: center; gap: .35rem; font-size: .75rem; }
	.replace-options select { min-width: 0; }
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
