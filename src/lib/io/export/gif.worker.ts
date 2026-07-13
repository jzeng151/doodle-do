// GIF encoding in a Web Worker (§4.6). Frames arrive already flattened to
// indexed pixels, which is exactly what gifenc wants — no quantization.
// Transparency: GIF has 1-bit transparency; our index 0 maps to the
// transparent index with dispose=2 (restore to background) per frame.

import { GIFEncoder } from 'gifenc';

export interface GifRequest {
	width: number;
	height: number;
	palette: string[]; // '#rrggbb'
	frames: { pixels: Uint8Array; delayMs: number }[];
}

self.onmessage = (e: MessageEvent<GifRequest>) => {
	const { width, height, palette, frames } = e.data;
	// GIF color table: slot 0 is the transparent index, then the doc palette.
	const table: [number, number, number][] = [[0, 0, 0]];
	for (const hex of palette) {
		const v = parseInt(hex.slice(1), 16);
		table.push([(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]);
	}
	const gif = GIFEncoder();
	for (const frame of frames) {
		gif.writeFrame(frame.pixels, width, height, {
			palette: table,
			delay: frame.delayMs,
			transparent: true,
			transparentIndex: 0,
			dispose: 2,
			repeat: 0 // loop forever
		});
	}
	gif.finish();
	const bytes = gif.bytes();
	(self as unknown as Worker).postMessage(bytes, [bytes.buffer]);
};
