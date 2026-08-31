<script lang="ts">
	import { TOOLBAR_LAYOUT_OPTIONS, type ToolbarLayout } from '$lib/settings/toolbar';
	let {
		onChoose,
		onSkip = () => {}
	}: {
		onChoose: (layout: ToolbarLayout) => void;
		onSkip?: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement;
	let fullButton: HTMLButtonElement | undefined;
	let handled = false;
	const titleId = $props.id();
	const descriptionId = `${titleId}-description`;

	const options = TOOLBAR_LAYOUT_OPTIONS;

	export function open() {
		if (dialogEl.open) return;
		handled = false;
		dialogEl.showModal();
		requestAnimationFrame(() => fullButton?.focus());
	}

	function rememberFullButton(node: HTMLButtonElement, isFull: boolean) {
		if (isFull) fullButton = node;
	}

	function choose(layout: ToolbarLayout) {
		handled = true;
		onChoose(layout);
		dialogEl.close(layout);
	}

	function keepFull() {
		handled = true;
		onChoose('full');
		onSkip();
		dialogEl.close('full');
	}

	function handleClose() {
		if (!handled) {
			onChoose('full');
			onSkip();
		}
		handled = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	aria-labelledby={titleId}
	aria-describedby={descriptionId}
	onclose={handleClose}
>
	<header>
		<h2 id={titleId}>Choose your drawing toolbar</h2>
		<p id={descriptionId}>Start with a layout. You can change it any time from Toolbar settings.</p>
	</header>

	<div class="choices">
		{#each options as option (option.id)}
			<section class="choice">
				<div class="preview" aria-hidden="true">
					<div class="preview-bar">
						{#each option.preview as width}
							<span class:hidden={width === 0} style:--preview-width={`${Math.max(width, 1)}fr`}></span>
						{/each}
					</div>
					<div class="canvas"></div>
				</div>
				<div class="copy">
					<h3>{option.label}</h3>
					<p>{option.description}</p>
				</div>
				<button
					use:rememberFullButton={option.id === 'full'}
					class:recommended={option.id === 'essentials'}
					onclick={() => choose(option.id)}
				>
					Choose {option.label}
				</button>
			</section>
		{/each}
	</div>

	<footer>
		<button class="skip" onclick={keepFull}>Skip and keep Full</button>
	</footer>
</dialog>

<style>
	dialog {
		width: min(54rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		box-sizing: border-box;
		padding: 0;
		overflow: auto;
		background: var(--paper);
		color: var(--ink);
		border: 3px solid var(--edge);
		border-radius: 0;
	}
	dialog::backdrop { background: var(--backdrop); }
	header {
		padding: 1.25rem 1.5rem 1rem;
		border-bottom: 3px solid var(--edge);
		background-image: radial-gradient(circle, color-mix(in srgb, var(--ink) 15%, transparent) 1px, transparent 1px);
		background-size: 7px 7px;
	}
	header > * {
		width: fit-content;
		background: var(--paper);
	}
	h2 {
		margin: 0 0 0.4rem;
		padding-right: 0.4rem;
		font-size: 1.125rem;
		line-height: 1.2;
	}
	header p {
		max-width: 54ch;
		margin: 0;
		padding-right: 0.4rem;
		line-height: 1.45;
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.choice {
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 1rem;
		min-width: 0;
		padding: 1rem;
	}
	.choice + .choice { border-left: 2px solid var(--edge); }
	.preview {
		border: 2px solid var(--edge);
		background: var(--paper-2);
	}
	.preview-bar {
		display: flex;
		gap: 2px;
		min-height: 1.25rem;
		padding: 0.25rem;
		border-bottom: 2px solid var(--edge);
		background: var(--paper);
	}
	.preview-bar span {
		flex: var(--preview-width);
		min-width: 3px;
		background: var(--ink);
	}
	.preview-bar span.hidden {
		background: repeating-linear-gradient(135deg, transparent 0 3px, var(--checker-muted) 3px 4px);
	}
	.canvas {
		min-height: 4.5rem;
		background-image:
			linear-gradient(45deg, var(--checker-dark) 25%, transparent 25%),
			linear-gradient(-45deg, var(--checker-dark) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--checker-dark) 75%),
			linear-gradient(-45deg, transparent 75%, var(--checker-dark) 75%);
		background-position: 0 0, 0 4px, 4px -4px, -4px 0;
		background-size: 8px 8px;
	}
	.copy h3 {
		margin: 0 0 0.35rem;
		font-size: 0.9375rem;
	}
	.copy p {
		margin: 0;
		color: var(--gray);
		line-height: 1.45;
	}
	.choice button { width: 100%; }
	.choice button.recommended {
		background: var(--ink);
		color: var(--paper);
	}
	footer {
		display: flex;
		justify-content: flex-end;
		padding: 0.75rem 1rem;
		border-top: 2px solid var(--edge);
	}
	.skip {
		min-height: 28px;
		border-color: transparent;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	@media (pointer: coarse) {
		.skip { min-height: 44px; }
	}

	@media (max-width: 640px) {
		dialog { width: calc(100vw - 1rem); max-height: calc(100dvh - 1rem); }
		header { padding: 1rem; }
		.choices { grid-template-columns: 1fr; }
		.choice {
			grid-template-columns: minmax(7.5rem, 0.75fr) 1fr;
			grid-template-rows: 1fr auto;
			gap: 0.75rem 1rem;
		}
		.choice + .choice {
			border-top: 2px solid var(--edge);
			border-left: 0;
		}
		.preview { grid-row: 1 / 3; }
		.preview .canvas { min-height: 5.25rem; }
		footer { justify-content: stretch; }
		footer button { width: 100%; }
	}

	@media (max-width: 400px) {
		.choice { grid-template-columns: 1fr; }
		.preview { grid-row: auto; }
	}
</style>
