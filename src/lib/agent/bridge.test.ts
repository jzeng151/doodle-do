import { describe, expect, it } from 'vitest';
import { CommandBus } from '../core/commands';
import { createDoc } from '../core/document';
import type { EditorSession } from '../editor/session.svelte';
import { executeAgentOperation } from './bridge';

function session(): EditorSession {
	const doc = createDoc({ width: 4, height: 4, palette: ['#000000'], frameCount: 1 });
	const bus = new CommandBus(doc);
	const fake = {
		doc,
		bus,
		version: 0,
		currentFrame: 0,
		currentLayer: 0,
		mode: 'focus',
		strokeActive: false,
		hasSelection: false
	};
	bus.onChange(() => fake.version++);
	return fake as unknown as EditorSession;
}

describe('agent operation adapter', () => {
	it('applies one deduplicated patch command and rejects a stale version', () => {
		const editor = session();
		const result = executeAgentOperation(editor, 'apply_pixel_patch', {
			expectedVersion: 0,
			frame: 0,
			layer: 0,
			edits: [
				{ x: 1, y: 1, value: 1 },
				{ x: 1, y: 1, value: 0 },
				{ x: 2, y: 1, value: 1 }
			]
		});
		expect(result).toEqual({ version: 1, changedPixels: 1 });
		expect(editor.doc.frames[0].layers[0].pixels[6]).toBe(1);
		expect(editor.bus.undoDepth).toBe(1);
		expect(() =>
			executeAgentOperation(editor, 'apply_pixel_patch', {
				expectedVersion: 0,
				frame: 0,
				layer: 0,
				edits: [{ x: 0, y: 0, value: 1 }]
			})
		).toThrow('version conflict');
	});

	it('rejects pixel edits to locked layers', () => {
		const editor = session();
		editor.doc.frames[0].layers[0].locked = true;
		expect(() => executeAgentOperation(editor, 'apply_pixel_patch', {
			expectedVersion: 0,
			frame: 0,
			layer: 0,
			edits: [{ x: 0, y: 0, value: 1 }]
		})).toThrow('layer is locked');
	});
});
