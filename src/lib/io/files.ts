// Explicit save/open (§4.7). Save uses the File System Access API where
// available with a download fallback. Open is one unified picker that
// dispatches on what was selected: a project file opens as a project, a
// strip PNG imports as frames (optionally with its animations.json for
// timing). Plain <input> on purpose — for reading it is equivalent to the
// FS Access picker and stays testable.

import type { Doc } from '../core/document';
import { PROJECT_EXTENSION, PROJECT_FORMAT, parseProject, serializeProject } from './project';
import { detectStrip, manifestEntryFor, stripToDoc } from './import/strip';

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export async function saveProjectToDisk(doc: Doc, filenameBase?: string): Promise<void> {
	const text = serializeProject(doc);
	const filename = `${filenameBase || doc.meta.name || 'untitled'}${PROJECT_EXTENSION}`;
	if ('showSaveFilePicker' in window) {
		let handle: FileSystemFileHandle;
		try {
			handle = await window.showSaveFilePicker({
				suggestedName: filename,
				types: [
					{
						description: 'Doodle-Do project',
						accept: { 'application/json': [PROJECT_EXTENSION] }
					}
				]
			});
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

async function docFromStrip(png: File, manifestFile: File | undefined): Promise<Doc> {
	const bitmap = await createImageBitmap(png);
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0);
	const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

	let frameMs: number | undefined;
	if (manifestFile) {
		const text = await manifestFile.text();
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error('manifest is not valid JSON');
		}
		if ((parsed as { format?: string }).format === PROJECT_FORMAT) {
			throw new Error('cannot open a project file together with a PNG; pick one or the other');
		}
		const entry = manifestEntryFor(text, png.name);
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
	return stripToDoc(img, png.name.replace(/\.png$/i, ''), { frameMs });
}

async function docFromSelection(files: File[]): Promise<Doc | null> {
	const pngs = files.filter((f) => f.name.toLowerCase().endsWith('.png'));
	const rest = files.filter((f) => !pngs.includes(f));

	if (pngs.length > 1) throw new Error('select one strip PNG at a time');
	if (pngs.length === 1) {
		if (rest.length > 1) throw new Error('select at most one manifest alongside the strip PNG');
		return docFromStrip(pngs[0], rest[0]);
	}

	if (files.length !== 1) {
		throw new Error('select a project file, or a strip PNG (optionally with its animations.json)');
	}
	const text = await files[0].text();
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error(`${files[0].name} is not a Doodle-Do project or a sprite manifest`);
	}
	if ((parsed as { animations?: unknown }).animations !== undefined) {
		throw new Error('that is an animation manifest; select it together with its strip PNG');
	}
	return parseProject(text); // rejects anything that isn't a project file, with specifics
}

export function openFromDisk(): Promise<Doc | null> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = `${PROJECT_EXTENSION},.json,image/png`;
		input.multiple = true;
		input.onchange = () => {
			const files = Array.from(input.files ?? []);
			if (files.length === 0) return resolve(null);
			docFromSelection(files).then(resolve, reject);
		};
		input.oncancel = () => resolve(null);
		input.click();
	});
}
