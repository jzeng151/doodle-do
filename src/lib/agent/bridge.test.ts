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

	it('reports linked cels and rejects targeted edits until they are unlinked', () => {
		const editor = session();
		editor.doc.frames.push(structuredClone(editor.doc.frames[0]));
		editor.doc.frames[1].layers[0].pixels = editor.doc.frames[0].layers[0].pixels;
		editor.doc.frames[0].layers[0].linkId = editor.doc.frames[1].layers[0].linkId = 'linked';
		const described = executeAgentOperation(editor, 'get_document', {}) as any;
		expect(described.frames[0].layers[0].linkId).toBe('linked');
		expect(() => executeAgentOperation(editor, 'apply_pixel_patch', {
			expectedVersion: 0,
			frame: 0,
			layer: 0,
			edits: [{ x: 0, y: 0, value: 1 }]
		})).toThrow('unlink it');
	});

	it('applies adjustable X and Y symmetry to agent strokes', () => {
		const editor = session();
		const result = executeAgentOperation(editor, 'draw_stroke', {
			expectedVersion: 0,
			frame: 0,
			layer: 0,
			value: 1,
			brushSize: 1,
			mirrorX: false,
			mirrorY: true,
			mirrorAxisY: 1.5,
			points: [{ x: 0, y: 0 }]
		});
		expect(result).toEqual({ version: 1, changedPixels: 2 });
		expect(editor.doc.frames[0].layers[0].pixels[0]).toBe(1);
		expect(editor.doc.frames[0].layers[0].pixels[12]).toBe(1);
	});

	it('rejects symmetry axes outside half-pixel steps', () => {
		const editor = session();
		expect(() => executeAgentOperation(editor, 'draw_stroke', {
			expectedVersion: 0, frame: 0, layer: 0, value: 1, brushSize: 1,
			mirrorX: true, mirrorAxisX: 1.25, points: [{ x: 0, y: 0 }]
		})).toThrow(/half-pixel/);
	});

	it('rejects edits while a whole-layer move is floating', () => {
		const editor = session();
		editor.floating = {} as EditorSession['floating'];
		expect(() => executeAgentOperation(editor, 'apply_pixel_patch', {
			expectedVersion: 0,
			frame: 0,
			layer: 0,
			edits: [{ x: 0, y: 0, value: 1 }]
		})).toThrow(/finish the active user/);
	});
});
