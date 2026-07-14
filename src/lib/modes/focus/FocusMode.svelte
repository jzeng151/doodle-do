<script lang="ts">
	// Focus mode (§3.3): one large canvas + onion skin + docked live loop
	// + frame strip. Grid and Loop modes arrive in Phase 3 as sibling views
	// over this same session.
	import type { Doc } from '$lib/core/document';
	import type { EditorSession } from '$lib/editor/session.svelte';
	import EditorCanvas from './EditorCanvas.svelte';
	import FrameStrip from './FrameStrip.svelte';
	import HeaderBar from './HeaderBar.svelte';
	import LayerPanel from './LayerPanel.svelte';
	import LoopPreview from './LoopPreview.svelte';
	import PalettePanel from './PalettePanel.svelte';
	import TipToast from './TipToast.svelte';
	import Toolbar from './Toolbar.svelte';

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
		if (mod) return;
		switch (e.key.toLowerCase()) {
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
				session.setTool('select');
				break;
			case 'enter':
				session.commitFloating(); // B5: Enter stamps the selection down
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

<div class="focus">
	<HeaderBar {session} {onOpenDoc} />
	<Toolbar {session} />
	<div class="middle">
		<EditorCanvas {session} />
		<aside>
			<LoopPreview {session} />
			<LayerPanel {session} />
			<PalettePanel {session} />
		</aside>
	</div>
	<FrameStrip {session} />
	<TipToast />
</div>

<style>
	.focus {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}
	.middle {
		display: flex;
		flex: 1;
		min-height: 0;
	}
	aside {
		width: 200px;
		padding: 0.75rem;
		border-left: 1px solid var(--edge);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		overflow-y: auto;
	}
</style>
