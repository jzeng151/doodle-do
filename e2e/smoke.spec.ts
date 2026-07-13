import { expect, test, type Page } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

async function gotoApp(page: Page, path = '/') {
	await page.goto(path);
	await page.locator('canvas.editor').waitFor(); // session mounts async
}

async function drawStroke(page: Page) {
	const editor = page.locator('canvas.editor');
	const box = (await editor.boundingBox())!;
	await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, { steps: 10 });
	await page.mouse.up();
}

test('draw a stroke, see it in the live loop, undo it in one step', async ({ page }) => {
	await gotoApp(page);
	const undo = page.getByRole('button', { name: 'Undo' });
	await expect(undo).toBeDisabled();

	await drawStroke(page);

	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
	await expect
		.poll(() => page.evaluate(canvasHasInk, 'canvas.loop'), { timeout: 3000 })
		.toBe(true);

	// the whole drag undoes as ONE step (B2)
	await expect(undo).toBeEnabled();
	await undo.click();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
	await expect(undo).toBeDisabled();
});

test('frame duplicate, navigate, delete', async ({ page }) => {
	await gotoApp(page);
	const frames = page.getByRole('listbox', { name: 'Frames' }).getByRole('option');
	await expect(frames).toHaveCount(2); // smart default: 2 frames

	await drawStroke(page);
	await page.getByRole('button', { name: 'Duplicate' }).click();
	await expect(frames).toHaveCount(3);
	// duplicated frame carries the drawing
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);

	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	await expect(frames).toHaveCount(2);
});

test('work survives a reload via autosave', async ({ page }) => {
	await gotoApp(page);
	await drawStroke(page);
	// autosave debounce is 500ms; give the OPFS write a moment
	await expect.poll(() => page.locator('.status').textContent(), { timeout: 5000 }).toContain(
		'autosaved'
	);
	await page.reload();
	await page.locator('canvas.editor').waitFor();
	await expect
		.poll(() => page.evaluate(canvasHasInk, 'canvas.editor'), { timeout: 3000 })
		.toBe(true);
});

test('sprite sheet export downloads PNG + TexturePacker JSON + doodledo JSON', async ({ page }) => {
	await gotoApp(page);
	await drawStroke(page);

	const downloads: string[] = [];
	page.on('download', (d) => downloads.push(d.suggestedFilename()));
	await page.getByRole('button', { name: 'Export sheet' }).click();
	await expect.poll(() => downloads.length, { timeout: 10000 }).toBe(3);
	expect(downloads.some((n) => n.endsWith('.png'))).toBe(true);
	expect(downloads.some((n) => n.endsWith('.doodledo.json'))).toBe(true);
});

test('GIF export produces a real GIF89a', async ({ page }) => {
	await gotoApp(page);
	await drawStroke(page);

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export GIF' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(/\.gif$/);
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const bytes = Buffer.concat(chunks);
	expect(bytes.subarray(0, 6).toString('ascii')).toBe('GIF89a');
	expect(bytes.length).toBeGreaterThan(100);
});

test('keyboard: tools and undo shortcuts', async ({ page }) => {
	await gotoApp(page);
	await page.keyboard.press('e');
	await expect(page.getByRole('button', { name: /Eraser/ })).toHaveClass(/active/);
	await page.keyboard.press('b');
	await expect(page.getByRole('button', { name: /Pencil/ })).toHaveClass(/active/);

	await drawStroke(page);
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
	await page.keyboard.press('Control+z');
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
	await page.keyboard.press('Control+Shift+z');
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
});
