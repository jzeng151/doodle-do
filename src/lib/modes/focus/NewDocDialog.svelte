<script lang="ts">
	// Canvas presets (§4.1): 16/32/48/64, custom up to 128. 32×32 is the
	// highlighted smart default (§4.5).
	import { MAX_CANVAS } from '$lib/core/document';

	let { onCreate }: { onCreate: (width: number, height: number) => void } = $props();

	let dialogEl: HTMLDialogElement;
	let customW = $state(32);
	let customH = $state(32);

	const PRESETS = [16, 32, 48, 64];

	export function open() {
		dialogEl.showModal();
	}

	function pick(size: number) {
		dialogEl.close();
		onCreate(size, size);
	}

	function createCustom(e: Event) {
		e.preventDefault();
		const w = Math.min(MAX_CANVAS, Math.max(1, Math.round(customW)));
		const h = Math.min(MAX_CANVAS, Math.max(1, Math.round(customH)));
		dialogEl.close();
		onCreate(w, h);
	}
</script>

<dialog bind:this={dialogEl} aria-labelledby="new-doc-title">
	<h2 id="new-doc-title">New animation</h2>
	<div class="presets">
		{#each PRESETS as size (size)}
			<button class:active={size === 32} onclick={() => pick(size)}>
				{size}×{size}
			</button>
		{/each}
	</div>
	<!-- novalidate: out-of-range sizes clamp to the cap instead of blocking -->
	<form class="custom" novalidate onsubmit={createCustom}>
		<label>
			W
			<input aria-label="Width in pixels" type="number" min="1" max={MAX_CANVAS} bind:value={customW} />
		</label>
		<label>
			H
			<input aria-label="Height in pixels" type="number" min="1" max={MAX_CANVAS} bind:value={customH} />
		</label>
		<button type="submit">Create</button>
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
