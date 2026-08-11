<script lang="ts">
	// Resize the current canvas (extends §4.1 presets to an existing document).
	// Mirrors NewDocDialog, plus a crop/extend vs scale choice for the art.
	import { MAX_CANVAS } from '$lib/core/document';

	let { onResize }: { onResize: (width: number, height: number, mode: 'crop' | 'scale') => void } =
		$props();

	let dialogEl: HTMLDialogElement;
	let w = $state(32);
	let h = $state(32);
	let mode = $state<'crop' | 'scale'>('crop');

	const PRESETS = [16, 32, 48, 64];

	export function open(currentW: number, currentH: number) {
		w = currentW;
		h = currentH;
		dialogEl.showModal();
	}

	function apply(e: Event) {
		e.preventDefault();
		const nw = Math.min(MAX_CANVAS, Math.max(1, Math.round(w)));
		const nh = Math.min(MAX_CANVAS, Math.max(1, Math.round(h)));
		dialogEl.close();
		onResize(nw, nh, mode);
	}
</script>

<dialog bind:this={dialogEl} aria-labelledby="resize-title">
	<h2 id="resize-title">Resize canvas</h2>
	<fieldset class="mode">
		<legend>Resize behavior</legend>
		<label>
			<input type="radio" name="resize-mode" value="crop" bind:group={mode} />
			Keep art size (crop / extend)
		</label>
		<label>
			<input type="radio" name="resize-mode" value="scale" bind:group={mode} />
			Scale art to fit
		</label>
	</fieldset>
	<div class="presets">
		{#each PRESETS as size (size)}
			<button type="button" onclick={() => ((w = size), (h = size))}>{size}×{size}</button>
		{/each}
	</div>
	<!-- novalidate: out-of-range sizes clamp to the cap instead of blocking -->
	<form class="custom" novalidate onsubmit={apply}>
		<label>
			W
			<input aria-label="Width in pixels" type="number" min="1" max={MAX_CANVAS} bind:value={w} />
		</label>
		<label>
			H
			<input aria-label="Height in pixels" type="number" min="1" max={MAX_CANVAS} bind:value={h} />
		</label>
		<button type="submit">Resize</button>
		<button type="button" onclick={() => dialogEl.close()}>Cancel</button>
	</form>
</dialog>

<style>
	dialog {
		background: var(--paper);
		color: var(--ink);
		border: 3px solid var(--edge);
		border-radius: 0;
		padding: 1rem 1.25rem;
		max-width: calc(100vw - 2rem);
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
	}
	.mode {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		border: 2px solid var(--edge);
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
	}
	.mode label {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}
	.mode legend { font-weight: 800; padding: 0 0.25rem; }
	.presets {
		display: flex;
		gap: 6px;
		margin-bottom: 0.75rem;
	}
	.presets button {
		padding: 0.75em 1em;
	}
	.custom {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.custom label {
		display: flex;
		gap: 0.35em;
		align-items: center;
	}
	input[type='number'] {
		width: 4em;
	}
	@media (max-width: 480px) {
		.presets, .custom { flex-wrap: wrap; }
	}
</style>
