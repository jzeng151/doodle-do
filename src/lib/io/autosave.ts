// Autosave (§4.7): hooks the command bus's debounced commit stream (B1,
// 500ms) and writes the serialized project to OPFS. Safari has no
// createWritable on the main thread, so IndexedDB is the fallback.

import type { CommandBus } from '../core/commands';
import type { Doc } from '../core/document';
import { parseProject, serializeProject } from './project';

const OPFS_FILE = 'autosave.doodledo';
const IDB_NAME = 'doodledo';
const IDB_STORE = 'autosave';
export const AUTOSAVE_DEBOUNCE_MS = 500;
const writeQueues = new WeakMap<(doc: Doc) => Promise<void>, Promise<void>>();

async function opfsSupported(): Promise<FileSystemDirectoryHandle | null> {
	try {
		const root = await navigator.storage.getDirectory();
		const handle = await root.getFileHandle(OPFS_FILE, { create: true });
		if (typeof handle.createWritable !== 'function') return null;
		return root;
	} catch {
		return null;
	}
}

function idbOpen(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(IDB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function idbPut(text: string): Promise<void> {
	return idbOpen().then(
		(db) =>
			new Promise((resolve, reject) => {
				const tx = db.transaction(IDB_STORE, 'readwrite');
				tx.objectStore(IDB_STORE).put(text, 'doc');
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			})
	);
}

function idbGet(): Promise<string | null> {
	return idbOpen().then(
		(db) =>
			new Promise((resolve, reject) => {
				const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).get('doc');
				req.onsuccess = () => resolve((req.result as string) ?? null);
				req.onerror = () => reject(req.error);
			})
	);
}

export async function writeAutosave(doc: Doc): Promise<void> {
	const text = serializeProject(doc);
	const root = await opfsSupported();
	if (root) {
		const handle = await root.getFileHandle(OPFS_FILE, { create: true });
		const writable = await handle.createWritable();
		await writable.write(text);
		await writable.close();
	} else {
		await idbPut(text);
	}
}

export async function loadAutosave(): Promise<Doc | null> {
	try {
		const root = await opfsSupported();
		let text: string | null = null;
		if (root) {
			const handle = await root.getFileHandle(OPFS_FILE);
			text = await (await handle.getFile()).text();
		} else {
			text = await idbGet();
		}
		if (!text) return null;
		return parseProject(text);
	} catch {
		return null; // no autosave, or a corrupt one — start fresh
	}
}

// Wires the bus commit stream to autosave. Returns a detach function.
export function attachAutosave(
	bus: CommandBus,
	onSaved?: () => void,
	snapshot: () => Doc = () => bus.doc,
	options: { write?: (doc: Doc) => Promise<void>; saveInitial?: boolean } = {}
): (flushPending?: boolean) => void {
	const { write = writeAutosave, saveInitial = false } = options;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let generation = 0;
	let pendingGeneration: number | undefined;

	const flush = () => {
		if (pendingGeneration === undefined) return;
		const savedGeneration = pendingGeneration;
		pendingGeneration = undefined;
		const doc = snapshot();
		const writes = (writeQueues.get(write) ?? Promise.resolve())
			.then(() => write(doc))
			.then(() => {
				if (savedGeneration === generation) onSaved?.();
			})
			.catch((error) => console.warn('autosave failed', error));
		writeQueues.set(write, writes);
	};

	const detach = bus.onCommit(() => {
		generation++;
		pendingGeneration = generation;
		clearTimeout(timer);
		timer = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
	});
	if (saveInitial) {
		generation++;
		pendingGeneration = generation;
		flush();
	}
	return (flushPending = true) => {
		clearTimeout(timer);
		if (flushPending) flush();
		else {
			generation++;
			pendingGeneration = undefined;
		}
		detach();
	};
}
