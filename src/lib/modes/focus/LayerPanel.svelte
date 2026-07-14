<script lang="ts">
	import { MAX_LAYERS } from '$lib/core/document';
	import type { EditorSession } from '$lib/editor/session.svelte';

	let { session }: { session: EditorSession } = $props();

	// top layer first in the list, like every art tool
	const layers = $derived((session.version, session.currentFrame, [...session.frame.layers].reverse()));
	const layerCount = $derived(layers.length);

	function realIndex(displayIndex: number): number {
		return layerCount - 1 - displayIndex;
	}
</script>

<section class="layers">
	<header>
		<h2>Layers</h2>
		<button title="Add layer" disabled={layerCount >= MAX_LAYERS} onclick={() => session.addLayer()}>+</button>
		<button title="Delete layer" disabled={layerCount <= 1} onclick={() => session.deleteLayer()}>−</button>
		<button
			title="Move layer up"
			disabled={session.currentLayer >= layerCount - 1}
			onclick={() => session.moveLayer(1)}
		>
			↑
		</button>
		<button title="Move layer down" disabled={session.currentLayer === 0} onclick={() => session.moveLayer(-1)}>
			↓
		</button>
	</header>
	<ul role="listbox" aria-label="Layers">
		{#each layers as layer, di (di)}
			<li>
				<button
					class="name"
					class:active={realIndex(di) === session.currentLayer}
					role="option"
					aria-selected={realIndex(di) === session.currentLayer}
					onclick={() => session.selectLayer(realIndex(di))}
				>
					{layer.name}
				</button>
				<button
					class="vis"
					title={layer.visible ? 'Hide layer' : 'Show layer'}
					onclick={() => session.toggleLayerVisible(realIndex(di))}
				>
					{layer.visible ? '👁' : '—'}
				</button>
			</li>
		{/each}
	</ul>
</section>

<style>
	.layers header {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	h2 {
		font-size: 0.85rem;
		margin: 0;
		flex: 1;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.7;
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
		background: var(--accent);
		color: #fff;
	}
</style>
