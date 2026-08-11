<script lang="ts">
	// The always-playing live loop (§3.1), docked in every mode.
	import { onMount } from 'svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { LoopPlayer } from '$lib/render/loop';

	let { session }: { session: EditorSession } = $props();

	let loopEl: HTMLCanvasElement;
	let paused = $state(false);
	let player: LoopPlayer;

	// react to canvas resize (dims are not $state; version bumps on resize)
	const loopW = $derived((session.version, session.doc.meta.width * 4));
	const loopH = $derived((session.version, session.doc.meta.height * 4));

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		player = new LoopPlayer(session.doc, session.compositor, loopEl, undefined, () =>
			session.effectiveLoopRange()
		);
		// prefers-reduced-motion pauses the auto-loop; manual play still works (§5)
		paused = media.matches;
		if (!paused) player.start();
		const pauseForPreference = () => {
			if (!media.matches) return;
			paused = true;
			player.stop();
			player.blit();
		};
		media.addEventListener('change', pauseForPreference);
		return () => {
			media.removeEventListener('change', pauseForPreference);
			player.stop();
		};
	});

	function togglePlay() {
		paused = !paused;
		if (paused) player.stop();
		else player.start();
	}

	$effect(() => {
		// while paused, still reflect edits in the preview
		void session.version;
		if (paused && player) player.blit();
	});
</script>

<section class="loop-panel">
	<canvas
		bind:this={loopEl}
		class="loop"
		aria-label={`Loop preview, ${paused ? 'paused' : 'playing'}`}
		width={loopW}
		height={loopH}
	></canvas>
	<div class="controls">
		<button onclick={togglePlay}>{paused ? 'Play' : 'Pause'}</button>
		<label>
			FPS
			<input
				type="number"
				min="1"
				max="24"
				value={session.doc.meta.fps}
				onchange={(e) => session.setFps(e.currentTarget.valueAsNumber)}
			/>
		</label>
	</div>
</section>

<style>
	.loop-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}
	.loop {
		image-rendering: pixelated;
		width: 128px;
		height: auto; /* keep the canvas aspect for non-square documents */
		background: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 16px 16px;
		border: 2px solid var(--edge);
	}
	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	input[type='number'] {
		width: 3.5em;
	}
	label {
		display: flex;
		gap: 0.35em;
		align-items: center;
	}
</style>
