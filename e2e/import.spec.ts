import { expect, test, type Page } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

async function gotoApp(page: Page) {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();
}

// 3 frames of 8×8, one solid color each
async function makeStripPng(page: Page): Promise<Buffer> {
	const dataUrl = await page.evaluate(() => {
		const c = document.createElement('canvas');
		c.width = 24;
		c.height = 8;
		const ctx = c.getContext('2d')!;
		for (const [i, color] of ['#ff0000', '#00ff00', '#0000ff'].entries()) {
			ctx.fillStyle = color;
			ctx.fillRect(i * 8 + 1, 1, 6, 6);
		}
		return c.toDataURL('image/png');
	});
	return Buffer.from(dataUrl.split(',')[1], 'base64');
}

test('import a sprite strip with its manifest', async ({ page }) => {
	await gotoApp(page);
	const strip = await makeStripPng(page);
	const manifest = Buffer.from(
		JSON.stringify({
			schemaVersion: 1,
			animations: { hop: { src: 'sprites/hop.png', frames: 3, frameMs: 220, loop: true } }
		})
	);

	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Import strip' }).click();
	await (
		await chooser
	).setFiles([
		{ name: 'hop.png', mimeType: 'image/png', buffer: strip },
		{ name: 'animations.json', mimeType: 'application/json', buffer: manifest }
	]);

	// 3 frames split out (default doc has 2, so this proves the import)
	const frames = page.getByRole('listbox', { name: 'Frames' }).getByRole('option');
	await expect(frames).toHaveCount(3);
	// document takes the PNG's name and the manifest's timing
	await expect(page.getByLabel('Document name')).toHaveValue('hop');
	await expect(page.locator('.actions input[type="number"]')).toHaveValue('220');
	// pixels landed
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
});

test('import without manifest falls back to default timing', async ({ page }) => {
	await gotoApp(page);
	const strip = await makeStripPng(page);

	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Import strip' }).click();
	await (await chooser).setFiles([{ name: 'solo.png', mimeType: 'image/png', buffer: strip }]);

	await expect(page.getByRole('listbox', { name: 'Frames' }).getByRole('option')).toHaveCount(3);
	// no per-frame duration set — input empty, placeholder shows the fps default
	await expect(page.locator('.actions input[type="number"]')).toHaveValue('');
});

test('manifest frame-count mismatch surfaces an error', async ({ page }) => {
	await gotoApp(page);
	const strip = await makeStripPng(page);
	const badManifest = Buffer.from(
		JSON.stringify({
			animations: { hop: { src: 'hop.png', frames: 5, frameMs: 100 } }
		})
	);

	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Import strip' }).click();
	await (
		await chooser
	).setFiles([
		{ name: 'hop.png', mimeType: 'image/png', buffer: strip },
		{ name: 'animations.json', mimeType: 'application/json', buffer: badManifest }
	]);

	await expect(page.locator('.status')).toContainText('Import failed');
	// document untouched
	await expect(page.getByRole('listbox', { name: 'Frames' }).getByRole('option')).toHaveCount(2);
});
