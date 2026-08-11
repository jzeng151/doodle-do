<script lang="ts">
	// Loop mode (§3.3): large hero preview always playing + filmstrip +
	// scrubber, play/pause, frame counter (§4.3). Watching, not drawing.
	import { onMount } from 'svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { LoopPlayer } from '$lib/render/loop';

	let { session }: { session: EditorSession } = $props();

	let heroEl: HTMLCanvasElement;
	let filmEls: (HTMLCanvasElement | undefined)[] = $state([]);
	let player: LoopPlayer;
	let playing = $state(false);
	let playFrame = $state(0);

	const frameCount = $derived((session.version, session.doc.frames.length));
	const rangeStart = $derived((session.version, session.loopRange, session.effectiveLoopRange().start));
	const rangeEnd = $derived((session.version, session.loopRange, session.effectiveLoopRange().end));
	const heroScale = $derived(
		(session.version,
		Math.max(1, Math.floor(512 / Math.max(session.doc.meta.width, session.doc.meta.height))))
	);
	// canvas sizes react to a resize (dims are not $state; version bumps)
	const heroW = $derived((session.version, session.doc.meta.width * heroScale));
	const heroH = $derived((session.version, session.doc.meta.height * heroScale));
	const filmW = $derived((session.version, session.doc.meta.width));
	const filmH = $derived((session.version, session.doc.meta.height));

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		player = new LoopPlayer(session.doc, session.compositor, heroEl, (f) => (playFrame = f), () =>
			session.effectiveLoopRange()
		);
		playing = !media.matches;
		if (playing) player.start();
		else player.blit();
		const pauseForPreference = () => {
			if (!media.matches) return;
			playing = false;
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
		playing = !playing;
		if (playing) player.start();
		else player.stop();
	}

	function scrub(e: Event) {
		// scrubbing takes the wheel: pause and jump (§4.3 scrubber)
		playing = false;
		player.stop();
		player.seek((e.currentTarget as HTMLInputElement).valueAsNumber);
	}

	$effect(() => {
		// reflect edits/undo arriving from shortcuts while paused
		void session.version;
		if (player && !playing) player.blit();
	});

	$effect(() => {
		void session.version;
		for (let i = 0; i < session.doc.frames.length; i++) {
			const el = filmEls[i];
			if (!el) continue;
			const ctx = el.getContext('2d')!;
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, el.width, el.height);
			ctx.drawImage(session.compositor.frameCanvas(i), 0, 0, el.width, el.height);
		}
	});
</script>

<div class="loop-mode">
	<canvas
		bind:this={heroEl}
		class="hero"
		aria-label={`Animation preview, frame ${playFrame + 1} of ${frameCount}`}
		width={heroW}
		height={heroH}
	></canvas>

	<div class="controls">
		<button onclick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
		<input
			class="scrubber"
			type="range"
			min="0"
			max={frameCount - 1}
			step="1"
			value={playFrame}
			oninput={scrub}
			aria-label="Scrub frames"
		/>
		<span class="counter">{playFrame + 1} / {frameCount}</span>
		<label>
			From
			<input
				type="number"
				min="1"
				max={frameCount}
				value={rangeStart + 1}
				onchange={(e) => session.setLoopRange(e.currentTarget.valueAsNumber - 1, rangeEnd)}
				aria-label="Loop range start"
			/>
		</label>
		<label>
			To
			<input
				type="number"
				min="1"
				max={frameCount}
				value={rangeEnd + 1}
				onchange={(e) => session.setLoopRange(rangeStart, e.currentTarget.valueAsNumber - 1)}
				aria-label="Loop range end"
			/>
		</label>
	</div>

	<div class="filmstrip" role="group" aria-label="Filmstrip">
		{#each { length: frameCount } as _, i (i)}
			<button
				class="film-frame"
				class:active={i === playFrame}
				aria-pressed={i === playFrame}
				onclick={() => {
					playing = false;
					player.stop();
					player.seek(i);
				}}
			>
				<canvas aria-hidden="true" bind:this={filmEls[i]} width={filmW} height={filmH}></canvas>
				<span>{i + 1}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.loop-mode {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		overflow: auto;
		background-color: var(--paper-2);
		background-image: radial-gradient(rgba(17,17,17,.18) .7px, transparent .9px);
		background-size: 6px 6px;
	}
	.hero {
		image-rendering: pixelated;
		max-height: 60vh;
		max-width: 90%;
		background: repeating-conic-gradient(#ddd9ce 0% 25%, #f7f4ec 0% 50%) 0 0 / 16px 16px;
		border: 3px solid var(--edge);
	}
	.controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		width: min(512px, 90%);
	}
	.scrubber {
		flex: 1;
	}
	.counter {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.filmstrip {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		max-width: 100%;
	}
	.film-frame {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px;
		background: var(--paper);
		border: 2px solid var(--ink);
	}
	.film-frame.active {
		box-shadow: 0 0 0 3px var(--ink);
		background: var(--ink);
		color: var(--paper);
	}
	.film-frame canvas {
		image-rendering: pixelated;
		width: 48px;
		height: auto;
		background: repeating-conic-gradient(#ddd9ce 0% 25%, #f7f4ec 0% 50%) 0 0 / 8px 8px;
	}
	@media (max-width: 620px) {
		.loop-mode { min-height: 650px; padding: .75rem; }
		.controls { width: 100%; flex-wrap: wrap; }
		.scrubber { flex-basis: 55%; }
	}
</style>
