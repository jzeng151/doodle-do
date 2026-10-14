<script lang="ts">
	import LoopPreview from './LoopPreview.svelte';
	import OnionControls from './OnionControls.svelte';
	import ActionMenu from '../ActionMenu.svelte';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import { floatingFrameCanvas } from '../canvas';

	// thumbs=false renders only the action row (grid mode shows the frames itself)
	let { session, thumbs = true }: { session: EditorSession; thumbs?: boolean } = $props();

	let choosingFrames = $state(false);
	let thumbEls: (HTMLCanvasElement | undefined)[] = $state([]);
	const frameCount = $derived((session.version, session.doc.frames.length));
	// thumbnail buffer size tracks the canvas dimensions across a resize
	const thumbW = $derived((session.version, session.doc.meta.width));
	const thumbH = $derived((session.version, session.doc.meta.height));
	const defaultDurationMs = $derived.by(() => {
		void session.version;
		void session.currentFrame;
		return Math.round(session.currentFrameDurationMs());
	});
	const frameDuration = $derived.by(() => {
		void session.version;
		void session.currentFrame;
		return session.frame.durationMs ?? '';
	});
	const currentFrameLinked = $derived((session.version, session.currentFrameLinked));

	$effect(() => {
		void session.version;
		void session.overlayVersion;
		for (let i = 0; i < session.doc.frames.length; i++) {
			const el = thumbEls[i];
			if (!el) continue;
			const ctx = el.getContext('2d')!;
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, el.width, el.height);
			ctx.drawImage(floatingFrameCanvas(session, i) ?? session.compositor.frameCanvas(i), 0, 0, el.width, el.height);
		}
	});

	function durationInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		session.setFrameDuration(input.value === '' ? undefined : input.valueAsNumber);
	}
</script>

<section class="strip-panel">
	<div class="thumb-area">
	<LoopPreview {session} />
	{#if thumbs}
		<div class="strip" role="group" aria-label="Frames">
			{#each { length: frameCount } as _, i (i)}
				<button
					class="thumb"
					class:active={i === session.currentFrame}
					class:bulk={session.bulkFrames.includes(i)}
					aria-pressed={i === session.currentFrame || session.bulkFrames.includes(i)}
					title="Click: select. Ctrl-click: bulk-edit set. Shift-click: range."
					onclick={(e) => {
						if (e.shiftKey) session.selectBulkRange(i);
						else if (choosingFrames || e.ctrlKey || e.metaKey) session.toggleBulkFrame(i);
						else session.selectFrame(i);
					}}
				>
					<canvas aria-hidden="true" bind:this={thumbEls[i]} width={thumbW} height={thumbH}></canvas>
					<span>{i + 1}</span>
				</button>
			{/each}
		</div>
	{/if}
	</div>
	<div class="timing" role="group" aria-label="Animation timing">
		<button onclick={() => (session.previewPaused = !session.previewPaused)}>{session.previewPaused ? 'Play' : 'Pause'}</button>

		<label>
			FPS
			<input
				type="number"
				min="1"
				max="24"
				value={(session.version, session.doc.meta.fps)}
				onchange={(e) => session.setFps(e.currentTarget.valueAsNumber)}
			/>
		</label>
		<label title="Overrides FPS for this frame only; leave blank to use FPS">
			Frame {session.currentFrame + 1} ms
			<input
				type="number"
				aria-label="Frame duration in milliseconds"
				min="20"
				step="10"
				placeholder={String(defaultDurationMs)}
				value={frameDuration}
				onchange={durationInput}
			/>
		</label>
		<span class="duration-help">Blank uses FPS</span>
		<OnionControls {session} />
	</div>
	<div class="actions">
		<button title="Add blank frame" onclick={() => session.addFrame(false)}>Add frame</button>
		<button title="Duplicate the frame, then nudge pixels for smoother motion" onclick={() => session.addFrame(true)}>
			Duplicate
		</button>
		<button
			title="Delete frame"
			disabled={frameCount <= 1}
			onclick={() => session.deleteFrame()}
		>
			Delete
		</button>
		<ActionMenu label="More frame actions" buttonText="More">
		<button title="Duplicate with shared cel pixels" onclick={() => session.addLinkedFrame()}>Linked duplicate</button>
		<button disabled={!currentFrameLinked} title="Make this frame independent" onclick={() => session.unlinkCurrentFrame()}>Unlink</button>
		<button aria-label="Move frame earlier" title="Move frame earlier" disabled={session.currentFrame === 0} onclick={() => session.moveFrame(-1)}>
			←
		</button>
		<button
			aria-label="Move frame later"
			title="Move frame later"
			disabled={session.currentFrame >= frameCount - 1}
			onclick={() => session.moveFrame(1)}
		>
			→
		</button>
		</ActionMenu>
		{#if thumbs}<button aria-pressed={choosingFrames} onclick={() => (choosingFrames = !choosingFrames)}>Choose frames</button>{/if}
		<span class="scope">Frame actions affect frame {session.currentFrame + 1} only.{session.bulkFrames.length ? ` Paint and transforms affect ${session.bulkFrames.length} selected frames.` : ''}</span>
		{#if session.bulkFrames.length}<button onclick={() => (session.bulkFrames = [])}>Clear frame selection</button>{/if}
	</div>
</section>

<style>
	.strip-panel {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border-top: 4px solid var(--edge);
		background: var(--paper);
	}
	.thumb-area { display: flex; gap: 8px; min-width: 0; }
	.thumb-area :global(.loop-panel) { flex: none; width: 184px; }
	.strip {
		min-width: 0;
		align-items: flex-start;
		display: flex;
		gap: 6px;
		overflow-x: auto;
	}
	.thumb {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px;
		background: var(--paper);
		border: 2px solid var(--ink);
	}
	.thumb.bulk {
		box-shadow: 0 0 0 3px var(--spot); /* bulk edit set */
	}
	.thumb.active {
		box-shadow: 0 0 0 3px var(--ink);
		background: var(--ink);
		color: var(--paper);
	}
	.thumb.active:hover {
		background: var(--paper-2);
		color: var(--ink);
	}
	.thumb canvas {
		image-rendering: pixelated;
		width: 48px;
		height: auto;
		background: repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 8px 8px;
	}
	.timing { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
	.timing label { display: flex; align-items: center; gap: 4px; }
	.duration-help, .scope { color: var(--gray); font-size: .6875rem; }
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
	}
	.actions button { white-space: nowrap; flex-shrink: 0; }
	input[type='number'] {
		width: 4.5em;
	}
	@media (max-width: 620px) {
		.strip-panel { flex: none; }
		.actions { overflow-x: auto; }
		.actions button { white-space: nowrap; }
	}
</style>
