<script lang="ts">
	import type { EditorSession } from '$lib/editor/session.svelte';

	// thumbs=false renders only the action row (grid mode shows the frames itself)
	let { session, thumbs = true }: { session: EditorSession; thumbs?: boolean } = $props();

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

	$effect(() => {
		void session.version;
		for (let i = 0; i < session.doc.frames.length; i++) {
			const el = thumbEls[i];
			if (!el) continue;
			const ctx = el.getContext('2d')!;
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, el.width, el.height);
			ctx.drawImage(session.compositor.frameCanvas(i), 0, 0, el.width, el.height);
		}
	});

	function durationInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		session.setFrameDuration(input.value === '' ? undefined : input.valueAsNumber);
	}
</script>

<section class="strip-panel">
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
						else if (e.ctrlKey || e.metaKey) session.toggleBulkFrame(i);
						else session.selectFrame(i);
					}}
				>
					<canvas aria-hidden="true" bind:this={thumbEls[i]} width={thumbW} height={thumbH}></canvas>
					<span>{i + 1}</span>
				</button>
			{/each}
		</div>
	{/if}
	<div class="actions">
		<button title="Add blank frame" onclick={() => session.addFrame(false)}>New</button>
		<button title="Duplicate frame — nudge it for smooth motion" onclick={() => session.addFrame(true)}>
			Duplicate
		</button>
		<button
			title="Delete frame"
			disabled={frameCount <= 1}
			onclick={() => session.deleteFrame()}
		>
			Delete
		</button>
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
		<label title="Per-frame duration; blank uses the global FPS">
			ms
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
	.strip {
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
	.thumb canvas {
		image-rendering: pixelated;
		width: 48px;
		height: auto;
		background: repeating-conic-gradient(#ddd9ce 0% 25%, #f7f4ec 0% 50%) 0 0 / 8px 8px;
	}
	.actions {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	.actions label {
		margin-left: auto;
		display: flex;
		gap: 0.35em;
		align-items: center;
	}
	input[type='number'] {
		width: 4.5em;
	}
	@media (max-width: 620px) {
		.strip-panel { flex: none; }
		.actions { overflow-x: auto; }
		.actions button { white-space: nowrap; }
	}
</style>
