// Individual frame PNGs, zipped (§4.6). PNG encoding happens on the main
// thread via canvas.toBlob (fast, hardware-backed); the zip assembles in a
// worker.

import type { Doc } from '../../core/document';
import type { Compositor } from '../../render/compositor';

function framePng(compositor: Compositor, index: number): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		compositor.frameCanvas(index).toBlob(async (blob) => {
			if (!blob) return reject(new Error('PNG encode failed'));
			resolve(new Uint8Array(await blob.arrayBuffer()));
		}, 'image/png');
	});
}

export async function exportFramePngs(doc: Doc, compositor: Compositor): Promise<Blob> {
	const files: Record<string, Uint8Array> = {};
	for (let i = 0; i < doc.frames.length; i++) {
		files[`frame-${i}.png`] = await framePng(compositor, i);
	}
	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL('./zip.worker.ts', import.meta.url), { type: 'module' });
		worker.onmessage = (e: MessageEvent<Uint8Array<ArrayBuffer>>) => {
			worker.terminate();
			resolve(new Blob([e.data], { type: 'application/zip' }));
		};
		worker.onerror = (e) => {
			worker.terminate();
			reject(new Error(`zip failed: ${e.message}`));
		};
		worker.postMessage(
			files,
			Object.values(files).map((f) => f.buffer)
		);
	});
}
