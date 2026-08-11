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
