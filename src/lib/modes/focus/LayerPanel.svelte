<script lang="ts">
	import { MAX_LAYERS } from '$lib/core/document';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import SendLayerDialog from './SendLayerDialog.svelte';

	let { session }: { session: EditorSession } = $props();

	let sendDialog: SendLayerDialog;

	// top layer first in the list, like every art tool
	const layers = $derived((session.version, session.currentFrame, [...session.frame.layers].reverse()));
	const layerCount = $derived(layers.length);
	const frameCount = $derived((session.version, session.doc.frames.length));

	function realIndex(displayIndex: number): number {
		return layerCount - 1 - displayIndex;
	}
</script>

<section class="layers">
	<header>
		<h2>Layers</h2>
		<button aria-label="Add layer" title="Add layer" disabled={layerCount >= MAX_LAYERS} onclick={() => session.addLayer()}>+</button>
		<button
			aria-label="Extract selection to layer"
			title="Extract selection to layer (Ctrl+J)"
			disabled={layerCount >= MAX_LAYERS || !session.hasSelection}
			onclick={() => session.extractSelectionToLayer()}
		>
			⇱
		</button>
		<button aria-label="Delete layer" title="Delete layer" disabled={layerCount <= 1} onclick={() => session.deleteLayer()}>−</button>
		<button
			aria-label="Move layer up"
			title="Move layer up"
			disabled={session.currentLayer >= layerCount - 1}
			onclick={() => session.moveLayer(1)}
		>
			↑
		</button>
		<button aria-label="Move layer down" title="Move layer down" disabled={session.currentLayer === 0} onclick={() => session.moveLayer(-1)}>
			↓
		</button>
		<button
			aria-label="Merge into layer below"
			title="Merge into layer below"
			disabled={session.currentLayer === 0}
			onclick={() => session.mergeLayerDown()}
		>
			⤵
		</button>
		<button
			aria-label="Send layer to another frame"
			title="Send layer to another frame"
			disabled={frameCount < 2}
			onclick={() => sendDialog.open()}
		>
			⇒
		</button>
	</header>
	<ul aria-label="Layers">
		{#each layers as layer, di (di)}
			<li>
				<button
					class="name"
					class:active={realIndex(di) === session.currentLayer}
					aria-pressed={realIndex(di) === session.currentLayer}
					onclick={() => session.selectLayer(realIndex(di))}
				>
					{layer.name}
				</button>
				<button
					class="vis"
					aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
					title={layer.visible ? 'Hide layer' : 'Show layer'}
					onclick={() => session.toggleLayerVisible(realIndex(di))}
				>
					{layer.visible ? '👁' : '—'}
				</button>
			</li>
		{/each}
	</ul>
</section>

<SendLayerDialog bind:this={sendDialog} {session} />

<style>
	.layers header {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	h2 {
		font-size: 0.6875rem;
		margin: 0;
		flex: 1;
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}
	ul {
		list-style: none;
		margin: 0.4rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	li {
		display: flex;
		gap: 2px;
	}
	.name {
		flex: 1;
		text-align: left;
	}
	.name.active {
		background: var(--ink);
		color: var(--paper);
	}
	@media (max-width: 620px) {
		.layers header { flex-wrap: wrap; }
		h2 { flex-basis: 100%; }
	}
</style>
