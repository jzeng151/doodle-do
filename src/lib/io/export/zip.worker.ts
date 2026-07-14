// Frame-PNG zip encoding in a Web Worker (§4.6). PNGs are already
// deflated, so the zip just stores them.

import { zipSync } from 'fflate';

self.onmessage = (e: MessageEvent<Record<string, Uint8Array>>) => {
	const bytes = zipSync(e.data, { level: 0 });
	(self as unknown as Worker).postMessage(bytes, [bytes.buffer]);
};
