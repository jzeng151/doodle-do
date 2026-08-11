<script lang="ts">
	// Reusable confirm. open(message) resolves true on confirm, false on cancel
	// or Escape. In-app <dialog> (not native confirm) so it stays stylable and
	// Playwright-drivable, per the project's testability stance.
	let dialogEl: HTMLDialogElement;
	let message = $state('');
	let resolver: ((ok: boolean) => void) | null = null;

	export function open(msg: string): Promise<boolean> {
		message = msg;
		return new Promise((resolve) => {
			resolver = resolve;
			dialogEl.showModal();
		});
	}

	function decide(ok: boolean) {
		const r = resolver;
		resolver = null;
		dialogEl.close();
		r?.(ok);
	}
</script>

<dialog bind:this={dialogEl} aria-labelledby="confirm-title" aria-describedby="confirm-message" onclose={() => decide(false)}>
	<h2 id="confirm-title">Discard changes?</h2>
	<p id="confirm-message">{message}</p>
	<div class="row">
		<button class="danger" onclick={() => decide(true)}>Discard and continue</button>
		<button onclick={() => decide(false)}>Cancel</button>
	</div>
</dialog>

<style>
	dialog {
		background: var(--paper);
		color: var(--ink);
		border: 3px solid var(--edge);
		border-radius: 0;
		padding: 1rem 1.25rem;
		max-width: min(24rem, calc(100vw - 2rem));
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	p {
		margin: 0 0 1rem;
	}
	h2 { margin: 0 0 0.5rem; font-size: 1rem; }
	.row {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}
	.danger {
		background: var(--spot);
		border-color: var(--ink);
		color: #fff;
	}
	@media (max-width: 480px) {
		.row { flex-wrap: wrap; }
	}
</style>
