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

<dialog bind:this={dialogEl} onclose={() => decide(false)}>
	<p>{message}</p>
	<div class="row">
		<button class="danger" onclick={() => decide(true)}>Discard and continue</button>
		<button onclick={() => decide(false)}>Cancel</button>
	</div>
</dialog>

<style>
	dialog {
		background: #26282d;
		color: #e7e9ec;
		border: 1px solid var(--edge);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		max-width: 24rem;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	p {
		margin: 0 0 1rem;
	}
	.row {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}
	.danger {
		border-color: #e0484d;
		color: #ff8a8d;
	}
</style>
