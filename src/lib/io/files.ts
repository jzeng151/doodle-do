// Explicit save/open (§4.7): File System Access API where available,
// download/upload fallback elsewhere (Safari/Firefox).

import type { Doc } from '../core/document';
import { PROJECT_EXTENSION, parseProject, serializeProject } from './project';
import { detectStrip, manifestEntryFor, stripToDoc } from './import/strip';

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

// Sprite strip import: a horizontal strip PNG, optionally together with its
// animations.json manifest for frame timing. Plain <input> on purpose —
// for reading it is equivalent to the FS Access picker and stays testable.
export function importStripFromDisk(): Promise<Doc | null> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/png,.json';
		input.multiple = true;
		input.onchange = async () => {
			try {
				const files = Array.from(input.files ?? []);
				const png = files.find((f) => f.name.toLowerCase().endsWith('.png'));
				if (!png) return resolve(null);
				const manifestFile = files.find((f) => f.name.toLowerCase().endsWith('.json'));

				const bitmap = await createImageBitmap(png);
				const canvas = document.createElement('canvas');
				canvas.width = bitmap.width;
				canvas.height = bitmap.height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(bitmap, 0, 0);
				const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

				let frameMs: number | undefined;
				if (manifestFile) {
					const entry = manifestEntryFor(await manifestFile.text(), png.name);
					if (entry) {
						const detected = detectStrip(img).frameCount;
						if (entry.frames && entry.frames !== detected) {
							throw new Error(
								`manifest says ${entry.frames} frames but the strip splits into ${detected}`
							);
						}
						if (entry.frameMs) frameMs = entry.frameMs;
					}
				}
				resolve(stripToDoc(img, png.name.replace(/\.png$/i, ''), { frameMs }));
			} catch (e) {
				reject(e);
			}
		};
		input.oncancel = () => resolve(null);
		input.click();
	});
}
