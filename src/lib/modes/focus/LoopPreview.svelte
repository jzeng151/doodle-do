<script lang="ts">
	// Live animation preview, controlled from the timeline.
	import { onMount } from 'svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { LoopPlayer } from '$lib/render/loop';
	import { floatingFrameCanvas } from '../canvas';

	let { session }: { session: EditorSession } = $props();
	const headingId = $props.id();

	let loopEl: HTMLCanvasElement;

	let player = $state<LoopPlayer>();

	// react to canvas resize (dims are not $state; version bumps on resize)
	const loopW = $derived((session.version, session.doc.meta.width * 4));
	const loopH = $derived((session.version, session.doc.meta.height * 4));

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		player = new LoopPlayer(
			session.doc,
			session.compositor,
			loopEl,
			undefined,
			() => session.effectiveLoopRange(),
			() => session.loopPlaybackSpeed,
			() => session.loopPlaybackMode,
			() => session.loopRepeatCount,
			() => (session.previewPaused = true),
			(ctx, frame) => {
				const canvas = floatingFrameCanvas(session, frame);
				if (!canvas) return false;
				ctx.drawImage(canvas, 0, 0, loopEl.width, loopEl.height);
				return true;
			}
		);
		// prefers-reduced-motion pauses the auto-loop; manual play still works (§5)
		if (media.matches) session.previewPaused = true;
		if (!session.previewPaused) player.start();
		else {
			const range = session.effectiveLoopRange();
			player.seek(session.loopPlaybackMode === 'reverse' ? range.end : range.start);
		}
		const pauseForPreference = () => {
			if (!media.matches) return;
			session.previewPaused = true;
			player?.stop();
			player?.blit();
		};
		media.addEventListener('change', pauseForPreference);
		return () => {
			media.removeEventListener('change', pauseForPreference);
			player?.stop();
		};
	});

	$effect(() => {
		if (!player) return;
		if (session.previewPaused) player?.stop();
		else player.start();
	});

	$effect(() => {
		// while paused, still reflect edits in the preview
		void session.version;
		void session.overlayVersion;
		if (session.previewPaused && player) player?.blit();
	});
</script>

<section class="loop-panel" aria-labelledby={headingId}>
	<h2 id={headingId}>Animation preview</h2>
	<canvas
		bind:this={loopEl}
		class="loop"
		class:background-hidden={!session.showPreviewBackground}
		aria-label={`Loop preview, ${session.previewPaused ? 'paused' : 'playing'}`}
		width={loopW}
		height={loopH}
	></canvas>
	<div class="controls">
		<button
			class:active={session.showPreviewBackground}
			aria-pressed={session.showPreviewBackground}
			title="Show or hide the transparency background"
			onclick={() => (session.showPreviewBackground = !session.showPreviewBackground)}
		>
			Background
		</button>
	</div>
</section>

<style>
	.loop-panel {
		display: grid;
		grid-template-columns: 76px 1fr;
		gap: 4px;
	}
	h2 {
		position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);
		font-size: 0.6875rem;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}
	.loop,
	.controls {
		align-self: center;
	}
	.loop {
		image-rendering: pixelated;
		width: 72px;
		height: auto; /* keep the canvas aspect for non-square documents */
		background: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 16px 16px;
		border: 2px solid var(--edge);
	}
	.loop.background-hidden {
		background: transparent;
	}
	.controls {
		display: flex;
		gap: 4px;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
