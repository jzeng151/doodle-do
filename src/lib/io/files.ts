// Explicit save/open (§4.7): File System Access API where available,
// download/upload fallback elsewhere (Safari/Firefox).

import type { Doc } from '../core/document';
import { PROJECT_EXTENSION, parseProject, serializeProject } from './project';

const PICKER_TYPES = [
	{
		description: 'Doodle-Do project',
		accept: { 'application/json': [PROJECT_EXTENSION] } as Record<string, string[]>
	}
];

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export async function saveProjectToDisk(doc: Doc): Promise<void> {
	const text = serializeProject(doc);
	const filename = `${doc.meta.name || 'untitled'}${PROJECT_EXTENSION}`;
	if ('showSaveFilePicker' in window) {
		let handle: FileSystemFileHandle;
		try {
			handle = await window.showSaveFilePicker({ suggestedName: filename, types: PICKER_TYPES });
		} catch {
			return; // user cancelled
		}
		const writable = await handle.createWritable();
		await writable.write(text);
		await writable.close();
	} else {
		downloadBlob(new Blob([text], { type: 'application/json' }), filename);
	}
}

export async function openProjectFromDisk(): Promise<Doc | null> {
	if ('showOpenFilePicker' in window) {
		try {
			const [handle] = await window.showOpenFilePicker({ types: PICKER_TYPES });
			return parseProject(await (await handle.getFile()).text());
		} catch (e) {
			if (e instanceof Error && e.name === 'AbortError') return null;
			throw e;
		}
	}
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = PROJECT_EXTENSION + ',application/json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return resolve(null);
			try {
				resolve(parseProject(await file.text()));
			} catch (e) {
				reject(e);
			}
		};
		input.oncancel = () => resolve(null);
		input.click();
	});
}
