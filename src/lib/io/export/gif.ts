// Main-thread GIF export wrapper: flattens frames to indexed buffers and
// hands them to the worker with transferred ownership.

import { frameDurationMs, type Doc } from '../../core/document';
import { flattenFrameIndices } from '../../core/flatten';
import type { GifRequest } from './gif.worker';

export function exportGif(doc: Doc): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL('./gif.worker.ts', import.meta.url), { type: 'module' });
		worker.onmessage = (e: MessageEvent<Uint8Array<ArrayBuffer>>) => {
			worker.terminate();
			resolve(new Blob([e.data], { type: 'image/gif' }));
		};
		worker.onerror = (e) => {
			worker.terminate();
			reject(new Error(`GIF encode failed: ${e.message}`));
		};
		const frames = doc.frames.map((_, i) => ({
			pixels: flattenFrameIndices(doc, i),
			delayMs: Math.round(frameDurationMs(doc, i))
		}));
		const request: GifRequest = {
			width: doc.meta.width,
			height: doc.meta.height,
			palette: doc.palette,
			frames
		};
		worker.postMessage(
			request,
			frames.map((f) => f.pixels.buffer)
		);
	});
}
