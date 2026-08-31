<script lang="ts">
	import { onMount } from 'svelte';
	import type { EditorSession, Tool } from '$lib/editor/session.svelte';
	import { TOOL_LESSONS, toolLessons, toolLessonUnavailableReason } from '$lib/learn/tool-lessons';

	let { session }: { session: EditorSession } = $props();

	let dialogEl: HTMLDialogElement;
	const titleId = $props.id();
	let current = $state(toolLessons.current);
	let currentComplete = $state(toolLessons.currentComplete);
	let completed = $state([...toolLessons.completed]);

	function sync() {
		current = toolLessons.current;
		currentComplete = toolLessons.currentComplete;
		completed = [...toolLessons.completed];
	}

	onMount(() => {
		const stopLessons = toolLessons.onChange(sync);
		const stopSession = session.onToolUse((tool) => toolLessons.reportAction(tool));
		return () => {
			stopLessons();
			stopSession();
		};
	});

	function unavailableReason(tool: Tool): string | null {
		void session.version;
		return toolLessonUnavailableReason(session, tool);
	}

	export function open() {
		if (!dialogEl.open) dialogEl.showModal();
	}

	export function start(tool: Tool) {
		if (unavailableReason(tool)) {
			open();
			return;
		}
		session.setMode('focus');
		session.setTool(tool);
		toolLessons.start(tool);
		if (dialogEl.open) dialogEl.close();
	}

	function next() {
		do toolLessons.skip();
		while (toolLessons.current && unavailableReason(toolLessons.current.tool));
		const nextLesson = toolLessons.current;
		if (nextLesson) {
			session.setMode('focus');
			session.setTool(nextLesson.tool);
		}
	}
</script>

<dialog bind:this={dialogEl} aria-labelledby={titleId}>
	<header>
		<div>
			<h2 id={titleId}>Tool lessons</h2>
			<p>Pick one short task. Lessons use your current canvas, and the action stays in your project.</p>
		</div>
		<button aria-label="Close tool lessons" onclick={() => dialogEl.close()}>Close</button>
	</header>
	<ul>
		{#each TOOL_LESSONS as lesson (lesson.tool)}
			{@const unavailable = unavailableReason(lesson.tool)}
			<li>
				<div>
					<strong>{lesson.title}</strong>
					<span>{lesson.description} Shortcut: <kbd>{lesson.shortcut}</kbd></span>
					{#if unavailable}<span>{unavailable}</span>{/if}
				</div>
				<button
					disabled={!!unavailable}
					title={unavailable ?? lesson.task}
					onclick={() => start(lesson.tool)}
				>
					{completed.includes(lesson.tool) ? 'Replay' : 'Start'}
				</button>
			</li>
		{/each}
	</ul>
</dialog>

{#if current}
	<aside class="coach" aria-live="polite">
		<span class="cue">Tool lesson</span>
		<strong>{current.title}</strong>
		<span>{current.description}</span>
		<p>{currentComplete ? `Done. You used ${current.title}.` : current.task}</p>
		{#if currentComplete}<small>The action stays on your canvas. Use Undo if it was only practice.</small>{/if}
		<div class="actions">
			<button onclick={next}>{currentComplete ? 'Next lesson' : 'Skip'}</button>
			<button onclick={() => toolLessons.close()}>Close</button>
		</div>
	</aside>
{/if}

<style>
	dialog {
		box-sizing: border-box;
		width: min(42rem, calc(100vw - 2rem));
		height: min(42rem, calc(100dvh - 2rem));
		padding: 0;
		overflow: hidden;
		border: 3px solid var(--edge);
		border-radius: 0;
		background: var(--paper);
		color: var(--ink);
	}
	dialog[open] { display: grid; grid-template-rows: auto minmax(0, 1fr); }
	dialog::backdrop { background: var(--backdrop); }
	header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
		padding: 1rem;
		border-bottom: 3px solid var(--edge);
		background: var(--paper-2);
	}
	h2 { margin: 0; font-size: 1.1rem; }
	header p { max-width: 58ch; margin: .25rem 0 0; line-height: 1.4; }
	ul { min-height: 0; margin: 0; padding: 0; overflow: auto; list-style: none; }
	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
		padding: .75rem 1rem;
	}
	li + li { border-top: 2px solid var(--edge); }
	li div { display: grid; gap: .15rem; }
	li span { line-height: 1.35; color: var(--gray); }
	kbd { font: inherit; font-weight: 900; }
	.coach {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		z-index: 30;
		display: grid;
		width: min(22rem, calc(100vw - 2rem));
		box-sizing: border-box;
		gap: .35rem;
		padding: .9rem 1rem;
		border: 3px solid var(--edge);
		border-radius: 22px;
		background: var(--paper);
		color: var(--ink);
	}
	.coach p, .coach small { margin: 0; line-height: 1.4; }
	.coach small { color: var(--gray); }
	.cue { font-size: .625rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
	.actions { display: flex; gap: 6px; margin-top: .35rem; }
	@media (max-width: 620px) {
		.coach { right: .5rem; bottom: .5rem; width: calc(100vw - 1rem); }
		li { grid-template-columns: 1fr; }
		li button { justify-self: start; }
	}
</style>
