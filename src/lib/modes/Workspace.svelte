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
		if (target.matches('input, select, textarea')) return;
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
		// arrows nudge an active selection by 1px; left/right otherwise
		// keep their frame-switching role
		if (e.key.startsWith('Arrow') && session.hasSelection) {
			e.preventDefault();
			const [dx, dy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
				e.key
			]!;
			session.nudgeSelection(dx, dy);
			return;
		}
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
			case 'enter':
				// close an in-progress polygon, else stamp the selection (B5)
				if (session.polygonVerts) session.closePolygon();
				else session.commitFloating();
				break;
			case 'escape':
				session.cancelFloating(); // B5: Escape restores the source
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
			case 'arrowleft':
				session.selectFrame(
					(session.currentFrame - 1 + session.doc.frames.length) % session.doc.frames.length
				);
				break;
			case 'arrowright':
				session.selectFrame((session.currentFrame + 1) % session.doc.frames.length);
				break;
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="workspace">
	<HeaderBar {session} {onOpenDoc} />
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
</div>

<style>
	.workspace {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}
</style>
