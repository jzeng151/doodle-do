<script lang="ts">
	// Copy or move the active layer to another frame (mirrors ResizeDialog).
	import type { EditorSession } from '$lib/editor/session.svelte';

	let { session }: { session: EditorSession } = $props();

	let dialogEl: HTMLDialogElement;
	let target = $state(1); // 1-based for display

	const frameCount = $derived((session.version, session.doc.frames.length));

	export function open() {
		// default to the neighboring frame
		target = session.currentFrame === 0 ? 2 : session.currentFrame; // 1-based
		dialogEl.showModal();
	}

	function send(e: Event, move: boolean) {
		e.preventDefault();
		dialogEl.close();
		session.sendLayerToFrame(Math.round(target) - 1, move);
	}
</script>

<dialog bind:this={dialogEl}>
	<h2>Send layer to frame</h2>
	<form onsubmit={(e) => send(e, false)}>
		<label>
			Frame
			<input type="number" min="1" max={frameCount} bind:value={target} />
		</label>
		<button type="submit">Copy</button>
		<button type="button" onclick={(e) => send(e, true)}>Move</button>
		<button type="button" onclick={() => dialogEl.close()}>Cancel</button>
	</form>
</dialog>

<style>
	dialog {
		background: #26282d;
		color: #e7e9ec;
		border: 1px solid var(--edge);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
	}
	form {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	label {
		display: flex;
		gap: 0.35em;
		align-items: center;
	}
	input[type='number'] {
		width: 4em;
	}
</style>
