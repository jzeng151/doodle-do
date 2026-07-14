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
	const heroScale = $derived(
		Math.max(1, Math.floor(512 / Math.max(session.doc.meta.width, session.doc.meta.height)))
	);

	onMount(() => {
		player = new LoopPlayer(session.doc, session.compositor, heroEl, (f) => (playFrame = f));
		playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (playing) player.start();
		else player.blit();
		return () => player.stop();
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
		width={session.doc.meta.width * heroScale}
		height={session.doc.meta.height * heroScale}
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
	</div>

	<div class="filmstrip" role="listbox" aria-label="Filmstrip">
		{#each { length: frameCount } as _, i (i)}
			<button
				class="film-frame"
				class:active={i === playFrame}
				role="option"
				aria-selected={i === playFrame}
				onclick={() => {
					playing = false;
					player.stop();
					player.seek(i);
				}}
			>
				<canvas
					bind:this={filmEls[i]}
					width={session.doc.meta.width}
					height={session.doc.meta.height}
				></canvas>
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
		background: #23252a;
	}
	.hero {
		image-rendering: pixelated;
		max-height: 60vh;
		max-width: 90%;
		background: repeating-conic-gradient(#3a3d44 0% 25%, #2e3036 0% 50%) 0 0 / 16px 16px;
		border: 1px solid var(--edge);
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
		background: none;
		border: 2px solid transparent;
	}
	.film-frame.active {
		border-color: var(--accent);
	}
	.film-frame canvas {
		image-rendering: pixelated;
		width: 48px;
		height: auto;
		background: repeating-conic-gradient(#3a3d44 0% 25%, #2e3036 0% 50%) 0 0 / 8px 8px;
	}
</style>
