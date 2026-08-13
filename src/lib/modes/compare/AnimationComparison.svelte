<script lang="ts">
	import { onMount } from 'svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { LoopPlayer } from '$lib/render/loop';

	let { session, fork }: { session: EditorSession; fork: EditorSession } = $props();
	const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2] as const;

	let currentEl: HTMLCanvasElement;
	let forkEl: HTMLCanvasElement;
	let currentPlayer: LoopPlayer;
	let forkPlayer: LoopPlayer;
	let playing = $state(false);
	let currentFrame = $state(0);
	let forkFrame = $state(0);
	let currentComplete = false;
	let forkComplete = false;

	const currentCount = $derived((session.version, session.doc.frames.length));
	const currentScale = $derived((session.version, previewScale(session.doc)));
	const currentWidth = $derived((session.version, session.doc.meta.width * currentScale));
	const currentHeight = $derived((session.version, session.doc.meta.height * currentScale));
	const forkCount = $derived((fork.version, fork.doc.frames.length));
	const forkScale = $derived((fork.version, previewScale(fork.doc)));
	const forkWidth = $derived((fork.version, fork.doc.meta.width * forkScale));
	const forkHeight = $derived((fork.version, fork.doc.meta.height * forkScale));

	function previewScale(doc: EditorSession['doc']): number {
		return Math.max(1, Math.floor(512 / Math.max(doc.meta.width, doc.meta.height)));
	}

	function start() {
		if (currentComplete && forkComplete) currentComplete = forkComplete = false;
		if (!currentComplete) currentPlayer.start();
		if (!forkComplete) forkPlayer.start();
	}

	function complete(side: 'current' | 'fork') {
		if (side === 'current') currentComplete = true;
		else forkComplete = true;
		if (!currentComplete || !forkComplete) return;
		playing = false;
		stop();
	}

	function stop() {
		currentPlayer.stop();
		forkPlayer.stop();
	}

	function togglePlay() {
		playing = !playing;
		if (playing) start();
		else stop();
	}

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		currentPlayer = new LoopPlayer(
			session.doc,
			session.compositor,
			currentEl,
			(frame) => (currentFrame = frame),
			undefined,
			() => session.loopPlaybackSpeed,
			() => session.loopPlaybackMode,
			() => session.loopRepeatCount,
			() => complete('current')
		);
		forkPlayer = new LoopPlayer(
			fork.doc,
			fork.compositor,
			forkEl,
			(frame) => (forkFrame = frame),
			undefined,
			() => session.loopPlaybackSpeed,
			() => session.loopPlaybackMode,
			() => session.loopRepeatCount,
			() => complete('fork')
		);
		playing = !media.matches;
		if (playing) start();
		else {
			currentPlayer.blit();
			forkPlayer.blit();
		}
		const pauseForPreference = () => {
			if (!media.matches) return;
			playing = false;
			stop();
			currentPlayer.blit();
			forkPlayer.blit();
		};
		media.addEventListener('change', pauseForPreference);
		return () => {
			media.removeEventListener('change', pauseForPreference);
			stop();
		};
	});

	$effect(() => {
		void session.version;
		if (currentPlayer && !playing) currentPlayer.blit();
	});

	$effect(() => {
		void fork.version;
		if (forkPlayer && !playing) forkPlayer.blit();
	});
</script>

<section class="compare-mode" aria-labelledby="compare-heading">
	<header class="compare-header">
		<div>
			<h2 id="compare-heading">Animation comparison</h2>
			<p>Play both edited versions together before choosing your next move.</p>
		</div>
		<div class="controls">
			<button onclick={togglePlay}>{playing ? 'Pause both' : 'Play both'}</button>
			<label>
				Speed
				<select
					bind:value={session.loopPlaybackSpeed}
					aria-label="Comparison playback speed"
					title="Preview speed only; frame timing and exports stay unchanged"
				>
					{#each PLAYBACK_SPEEDS as speed (speed)}
						<option value={speed}>{speed}×</option>
					{/each}
				</select>
			</label>
			<label>Direction<select bind:value={session.loopPlaybackMode}><option value="forward">Forward</option><option value="reverse">Reverse</option><option value="ping-pong">Ping-pong</option></select></label>
			<label>Repeats<input type="number" min="0" max="99" bind:value={session.loopRepeatCount} title="0 repeats continuously" /></label>
			<button
				class:active={session.showPreviewBackground}
				aria-pressed={session.showPreviewBackground}
				title="Show or hide the transparency background"
				onclick={() => (session.showPreviewBackground = !session.showPreviewBackground)}
			>
				Background
			</button>
		</div>
	</header>

	<div class="split">
		<figure>
			<figcaption>
				<strong>Current</strong>
				<span>{currentFrame + 1} / {currentCount} · Live document</span>
			</figcaption>
			<div class="viewport">
				<canvas
					bind:this={currentEl}
					class="compare-canvas"
					class:background-hidden={!session.showPreviewBackground}
					aria-label={`Current animation, frame ${currentFrame + 1} of ${currentCount}`}
					width={currentWidth}
					height={currentHeight}
				></canvas>
			</div>
		</figure>

		<figure>
			<figcaption>
				<strong>Fork</strong>
				<span>{forkFrame + 1} / {forkCount} · Fork edits</span>
			</figcaption>
			<div class="viewport">
				<canvas
					bind:this={forkEl}
					class="compare-canvas"
					class:background-hidden={!session.showPreviewBackground}
					aria-label={`Fork animation, frame ${forkFrame + 1} of ${forkCount}`}
					width={forkWidth}
					height={forkHeight}
				></canvas>
			</div>
		</figure>
	</div>
</section>

<style>
	.compare-mode {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		background: var(--paper-2);
	}
	.compare-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: .75rem 1rem;
		border-bottom: 3px solid var(--edge);
		background: var(--paper);
	}
	h2 { margin: 0; font-size: 1rem; text-transform: uppercase; }
	p { margin: .15rem 0 0; color: var(--gray); font-size: .75rem; }
	.controls { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
	.controls label { display: flex; align-items: center; gap: .35rem; white-space: nowrap; }
	.controls select { width: 4.5rem; }
	.split {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	figure { min-width: 0; min-height: 0; margin: 0; display: flex; flex-direction: column; }
	figure + figure { border-left: 3px solid var(--edge); }
	figcaption {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: .75rem;
		padding: .55rem .75rem;
		border-bottom: 2px solid var(--edge);
		background: var(--paper);
	}
	figcaption strong { font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; }
	figcaption span { color: var(--gray); font-size: .6875rem; font-variant-numeric: tabular-nums; }
	.viewport {
		flex: 1;
		min-height: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
		overflow: auto;
		background-image: radial-gradient(rgba(17,17,17,.18) .7px, transparent .9px);
		background-size: 6px 6px;
	}
	.compare-canvas {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		image-rendering: pixelated;
		border: 3px solid var(--edge);
		background: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 16px 16px;
	}
	.compare-canvas.background-hidden { background: transparent; }
	@media (max-width: 760px) {
		.compare-mode { min-height: 700px; }
		.compare-header { align-items: flex-start; flex-direction: column; }
		.split { grid-template-columns: 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); }
		figure + figure { border-left: 0; border-top: 3px solid var(--edge); }
	}
</style>
