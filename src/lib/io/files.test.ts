import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDoc } from '../core/document';
import { saveProjectToDisk } from './files';

const doc = () => createDoc({ width: 1, height: 1, palette: ['#000000'] });

afterEach(() => vi.unstubAllGlobals());

describe('saveProjectToDisk', () => {
	it('reports picker cancellation without claiming a save', async () => {
		vi.stubGlobal('window', {
			showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
		});
		expect(await saveProjectToDisk(doc())).toBe(false);
	});

	it('reports success only after the writable closes', async () => {
		const writable = { write: vi.fn(), close: vi.fn() };
		vi.stubGlobal('window', {
			showSaveFilePicker: vi.fn().mockResolvedValue({ createWritable: () => writable })
		});
		expect(await saveProjectToDisk(doc())).toBe(true);
		expect(writable.write).toHaveBeenCalledOnce();
		expect(writable.close).toHaveBeenCalledOnce();
	});

	it('does not hide picker failures', async () => {
		vi.stubGlobal('window', {
			showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
		});
		await expect(saveProjectToDisk(doc())).rejects.toThrow('denied');
	});
});
