import { expect, test, type Page } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

async function gotoApp(page: Page) {
	await page.goto('/#editor');
	await page.locator('canvas.editor').waitFor();
}

async function openFiles(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[]) {
	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Open' }).click();
	await (await chooser).setFiles(files);
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

test('open dispatches a strip PNG + manifest to the importer', async ({ page }) => {
	await gotoApp(page);
	const strip = await makeStripPng(page);
	const manifest = Buffer.from(
		JSON.stringify({
			schemaVersion: 1,
			animations: { hop: { src: 'sprites/hop.png', frames: 3, frameMs: 220, loop: true } }
		})
	);

	await openFiles(page, [
		{ name: 'hop.png', mimeType: 'image/png', buffer: strip },
		{ name: 'animations.json', mimeType: 'application/json', buffer: manifest }
	]);

	// 3 frames split out (default doc has 2, so this proves the import)
	const frames = page.getByRole('group', { name: 'Frames' }).getByRole('button');
	await expect(frames).toHaveCount(3);
	// document takes the PNG's name and the manifest's timing
	await expect(page.getByLabel('Document name')).toHaveValue('hop');
	await expect(page.locator('.actions input[type="number"]')).toHaveValue('220');
	// pixels landed
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
});

test('open dispatches a lone PNG to the importer with default timing', async ({ page }) => {
	await gotoApp(page);
	const strip = await makeStripPng(page);

	await openFiles(page, [{ name: 'solo.png', mimeType: 'image/png', buffer: strip }]);

	await expect(page.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(3);
	// no per-frame duration set — input empty, placeholder shows the fps default
	await expect(page.locator('.actions input[type="number"]')).toHaveValue('');
});

test('open dispatches a .doodledo file to the project parser', async ({ page }) => {
	await gotoApp(page);
	// 4×4 project, 3 frames, one red pixel in frame 1
	const pixels = new Uint8Array(16);
	pixels[5] = 1;
	const project = Buffer.from(
		JSON.stringify({
			format: 'doodledo-project',
			version: 1,
			meta: { name: 'roundtrip', width: 4, height: 4, fps: 12, syncMeta: null },
			palette: ['#ff0000'],
			frames: [
				{ layers: [{ name: 'Layer 1', visible: true, pixels: Buffer.from(pixels).toString('base64') }] },
				{ layers: [{ name: 'Layer 1', visible: true, pixels: Buffer.alloc(16).toString('base64') }] },
				{ layers: [{ name: 'Layer 1', visible: true, pixels: Buffer.alloc(16).toString('base64') }] }
			]
		})
	);

	await openFiles(page, [
		{ name: 'roundtrip.doodledo', mimeType: 'application/json', buffer: project }
	]);

	await expect(page.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(3);
	await expect(page.getByLabel('Document name')).toHaveValue('roundtrip');
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
});

test('manifest frame-count mismatch surfaces an error', async ({ page }) => {
	await gotoApp(page);
	const strip = await makeStripPng(page);
	const badManifest = Buffer.from(
		JSON.stringify({
			animations: { hop: { src: 'hop.png', frames: 5, frameMs: 100 } }
		})
	);

	await openFiles(page, [
		{ name: 'hop.png', mimeType: 'image/png', buffer: strip },
		{ name: 'animations.json', mimeType: 'application/json', buffer: badManifest }
	]);

	await expect(page.locator('.status')).toContainText('Open failed');
	// document untouched
	await expect(page.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(2);
});

test('manifest without its PNG surfaces a pointed error', async ({ page }) => {
	await gotoApp(page);
	const manifest = Buffer.from(
		JSON.stringify({ animations: { hop: { src: 'hop.png', frames: 3, frameMs: 100 } } })
	);

	await openFiles(page, [
		{ name: 'animations.json', mimeType: 'application/json', buffer: manifest }
	]);

	await expect(page.locator('.status')).toContainText('together with its strip PNG');
});
