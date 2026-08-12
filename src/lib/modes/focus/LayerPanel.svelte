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
		<div class="actions" role="group" aria-label="Layer actions">
			<button aria-label="Add layer" title="Add layer" disabled={layerCount >= MAX_LAYERS} onclick={() => session.addLayer()}>+</button>
			<button aria-label="Duplicate layer" title="Duplicate layer" disabled={layerCount >= MAX_LAYERS} onclick={() => session.duplicateLayer()}>⧉</button>
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
		</div>
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
				<button aria-pressed={layer.locked === true} aria-label={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.name}`} title={layer.locked ? 'Unlock layer' : 'Lock layer'} onclick={() => session.setLayerLocked(realIndex(di), !layer.locked)}>{layer.locked ? '🔒' : '○'}</button>
				<label class="opacity" title={`${layer.name} opacity`}><span class="sr-only">{layer.name} opacity</span><input type="range" min="0" max="1" step="0.05" value={layer.opacity ?? 1} onchange={(e) => session.setLayerOpacity(realIndex(di), e.currentTarget.valueAsNumber)} /></label>
			</li>
		{/each}
	</ul>
</section>

<SendLayerDialog bind:this={sendDialog} {session} />

<style>
	.layers header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	h2 {
		font-size: 0.6875rem;
		margin: 0;
		align-self: stretch;
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}
	.actions {
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		gap: 4px;
	}
	.actions button {
		min-width: 0;
		padding-inline: 0;
	}
	ul {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	li {
		display: flex;
		gap: 2px;
	}
	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
	}
	.name.active {
		background: var(--ink);
		color: var(--paper);
	}
	.opacity { display: flex; align-items: center; width: 54px; }
	.opacity input { width: 100%; }
	@media (pointer: coarse) {
		.actions { grid-template-columns: repeat(auto-fit, minmax(44px, 1fr)); }
		.actions button { min-width: 44px; }
	}
</style>
