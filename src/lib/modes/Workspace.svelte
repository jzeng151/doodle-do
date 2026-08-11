<script lang="ts">
	// Workspace shell (§4.4): three toggleable modes as pure views over one
	// shared session — document, current frame, zoom, and palette persist
	// across toggles because nothing here is rebuilt on switch.
	import type { Doc } from '$lib/core/document';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import HeaderBar from './focus/HeaderBar.svelte';
	import TipToast from './focus/TipToast.svelte';
	import Toolbar from './focus/Toolbar.svelte';
	import FocusView from './focus/FocusView.svelte';
	import GridView from './grid/GridView.svelte';
	import LoopView from './loop/LoopView.svelte';

	let {
		session,
		onOpenDoc
	}: { session: EditorSession; onOpenDoc: (doc: Doc | null, isNew?: boolean) => void } = $props();

	function onKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('input, select, textarea, [contenteditable="true"]')) return;
		const mod = e.ctrlKey || e.metaKey;
		if (mod && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			if (e.shiftKey) session.redo();
			else session.undo();
			return;
		}
		if (mod && e.key.toLowerCase() === 'y') {
			e.preventDefault();
			session.redo();
			return;
		}
		if (mod && e.key.toLowerCase() === 'j') {
			e.preventDefault();
			session.extractSelectionToLayer();
			return;
		}
		if (mod) return;
		if (target.closest('button')) return;
		// Bare character shortcuts are active only while an editor canvas has
		// focus, so they cannot fire while a user is navigating the rest of the UI.
		if (!(target instanceof HTMLCanvasElement) || !target.hasAttribute('data-editor-canvas')) return;
		switch (e.key.toLowerCase()) {
			case '1':
				session.setMode('focus');
				break;
			case '2':
				session.setMode('grid');
				break;
			case '3':
				session.setMode('loop');
				break;
			case 'b':
				session.setTool('pencil');
				break;
			case 'e':
				session.setTool('eraser');
				break;
			case 'g':
				session.setTool('fill');
				break;
			case 'i':
				session.setTool('eyedropper');
				break;
			case 'm':
				if (session.mode === 'focus') session.setTool('select');
				break;
			case 'l':
				if (session.mode === 'focus') session.setTool('lasso');
				break;
			case 'w':
				if (session.mode === 'focus') session.setTool('wand');
				break;
			case 'p':
				if (session.mode === 'focus') session.setTool('polygon');
				break;
			case 'o':
				session.toggleOnion();
				break;
			case '[':
				session.brushSize = Math.max(1, session.brushSize - 1);
				break;
			case ']':
				session.brushSize = Math.min(4, session.brushSize + 1);
				break;
			case 'pageup':
				e.preventDefault();
				session.selectFrame(
					(session.currentFrame - 1 + session.doc.frames.length) % session.doc.frames.length
				);
				break;
			case 'pagedown':
				e.preventDefault();
				session.selectFrame((session.currentFrame + 1) % session.doc.frames.length);
				break;
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<a class="skip" href="#editor-main">Skip to editor</a>
<div class="workspace">
	<HeaderBar {session} {onOpenDoc} />
	<main id="editor-main" class="editor-content" tabindex="-1">
		<h1 class="sr-only">Doodle-Do editor</h1>
		{#if session.mode !== 'loop'}
			<Toolbar {session} />
		{/if}
		{#if session.mode === 'focus'}
			<FocusView {session} />
		{:else if session.mode === 'grid'}
			<GridView {session} />
		{:else}
			<LoopView {session} />
		{/if}
		<TipToast />
	</main>
</div>

<style>
	.workspace {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: var(--paper);
		background-image: radial-gradient(rgba(17, 17, 17, 0.1) 0.55px, transparent 0.7px);
		background-size: 5px 5px;
		color: var(--ink);
		font-size: 0.8125rem;
		overflow: hidden;
	}
	.editor-content {
		display: flex;
		flex: 1;
		min-height: 0;
		flex-direction: column;
	}
	.skip {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 100;
		transform: translateY(-200%);
		background: var(--ink);
		color: var(--paper);
		padding: 0.6rem 0.8rem;
	}
	.skip:focus { transform: none; }
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@media (max-width: 860px) {
		.workspace { overflow: auto; }
	}
</style>
