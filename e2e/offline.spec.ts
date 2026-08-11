import { expect, test } from '@playwright/test';

test('app works offline after first load', async ({ page, context }) => {
	await page.goto('/#editor');
	await page.locator('canvas.editor').waitFor();
	// wait for the service worker to activate and precache
	await page.evaluate(() => navigator.serviceWorker.ready);

	await context.setOffline(true);
	await page.reload();
	await page.locator('canvas.editor').waitFor();

	// not just a cached shell: drawing still works
	const box = (await page.locator('canvas.editor').boundingBox())!;
	await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
	await page.mouse.down();
	await page.mouse.up();
	const hasInk = await page.evaluate(() => {
		const canvas = document.querySelector('canvas.editor') as HTMLCanvasElement;
		const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
		return data.some((v) => v !== 0);
	});
	expect(hasInk).toBe(true);
	await context.setOffline(false);
});

test('offline install omits mockup-only assets', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload();

	const cachedMockupAssets = await page.evaluate(async () => {
		const assetPaths = (html: string) =>
			[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
				.map((match) => new URL(match[1], location.href))
				.filter((url) => url.origin === location.origin && url.pathname.startsWith('/_app/'))
				.map((url) => url.pathname);
		const [rootHtml, mockupHtml] = await Promise.all([
			fetch('/').then((response) => response.text()),
			fetch('/mockups').then((response) => response.text())
		]);
		const rootAssets = new Set(assetPaths(rootHtml));
		const mockupOnly = new Set(assetPaths(mockupHtml).filter((path) => !rootAssets.has(path)));
		const cache = await caches.open((await caches.keys()).find((key) => key.startsWith('doodledo-'))!);
		const cached = await cache.keys();
		return cached.map((request) => new URL(request.url).pathname).filter((path) => mockupOnly.has(path));
	});

	expect(cachedMockupAssets).toEqual([]);
});

test('online navigation bypasses a stale cached shell', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload();
	await page.evaluate(async () => {
		const cache = await caches.open((await caches.keys()).find((key) => key.startsWith('doodledo-'))!);
		await cache.put('/', new Response('<h1>stale shell</h1>', { headers: { 'Content-Type': 'text/html' } }));
	});

	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
		'Draw one frame. The loop already has it.'
	);
});
