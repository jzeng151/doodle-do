import { expect, test, type Page } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

async function gotoApp(page: Page, path = '/#editor') {
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

test('palette removal deletes unused colors and isolates remap state', async ({ page }) => {
	await gotoApp(page);
	const palette = page.locator('.palette-panel');
	const colors = palette.locator('.swatch:not(.eraser)');
	const add = palette.getByRole('button', { name: 'Add', exact: true });
	const remove = palette.getByRole('button', { name: 'Remove', exact: true });
	const hint = palette.locator('.hint');

	await add.click();
	await expect(colors).toHaveCount(17);
	await expect(colors.last()).toHaveAttribute('aria-pressed', 'true');
	await remove.click();
	await expect(colors).toHaveCount(16);
	await expect(hint).toHaveCount(0);

	await colors.first().click();
	await drawStroke(page);
	await remove.click();
	await expect(hint).toBeVisible();

	await add.click();
	await expect(hint).toHaveCount(0);
	await colors.nth(1).click();
	await expect(colors).toHaveCount(17);
	await expect(colors.first()).toHaveAttribute('aria-label', 'Color #140c1c');

	await colors.first().click();
	await remove.click();
	await colors.nth(1).click();
	await expect(colors).toHaveCount(16);
	await expect(colors.first()).toHaveAttribute('aria-label', 'Color #442434');
	await expect(colors.first()).toHaveAttribute('aria-pressed', 'true');
});

test('frame duplicate, navigate, delete', async ({ page }) => {
	await gotoApp(page);
	const frames = page.getByRole('group', { name: 'Frames' }).getByRole('button');
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
	await page.getByRole('banner').getByRole('button', { name: 'New' }).focus();
	await page.keyboard.press('e');
	await expect(page.getByRole('button', { name: /Eraser/ })).toHaveAttribute('aria-pressed', 'false');

	const editor = page.locator('canvas.editor');
	await editor.focus();
	await page.keyboard.press('e');
	await expect(page.getByRole('button', { name: /Eraser/ })).toHaveAttribute('aria-pressed', 'true');
	await page.keyboard.press('b');
	await expect(page.getByRole('button', { name: /Pencil/ })).toHaveAttribute('aria-pressed', 'true');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press(' ');
	await page.getByRole('banner').getByRole('button', { name: 'New' }).focus();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);

	await page.keyboard.press('Control+z');
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
	await page.keyboard.press('Control+Shift+z');
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
});

test('mobile editor keeps document status and tips in the layout', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 568 });
	await gotoApp(page);
	await expect(page.getByLabel('Document name')).toBeVisible();
	await expect(page.locator('.status')).toBeVisible();
	await expect(page.locator('.tip')).toHaveCSS('position', 'relative');
	const toolbar = await page.locator('.toolbar').boundingBox();
	expect(toolbar?.height).toBeGreaterThanOrEqual(44);
});

test('desktop editor keeps the toolbar on one row', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await gotoApp(page);
	const toolbar = await page.locator('.toolbar').boundingBox();
	expect(toolbar?.height).toBeLessThanOrEqual(65);
});

test('coarse pointers get full-size compact controls', async ({ browser }) => {
	const context = await browser.newContext({
		viewport: { width: 320, height: 568 },
		isMobile: true,
		hasTouch: true
	});
	const page = await context.newPage();
	await gotoApp(page);
	const zoomOut = await page.getByRole('button', { name: 'Zoom out' }).boundingBox();
	const swatch = await page.getByRole('button', { name: 'Transparent' }).boundingBox();
	expect(zoomOut?.width).toBeGreaterThanOrEqual(44);
	expect(zoomOut?.height).toBeGreaterThanOrEqual(44);
	expect(swatch?.width).toBeGreaterThanOrEqual(44);
	expect(swatch?.height).toBeGreaterThanOrEqual(44);
	const workspaceOverflow = await page.locator('.workspace').evaluate((element) => ({
		client: element.clientWidth,
		scroll: element.scrollWidth
	}));
	expect(workspaceOverflow.scroll).toBe(workspaceOverflow.client);
	await context.close();
});

test('reduced motion pauses the landing animation until requested', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	const play = page.getByRole('button', { name: 'Play animation' });
	await expect(play).toBeVisible();
	await play.click();
	await expect(page.getByRole('button', { name: 'Pause animation' })).toBeVisible();
});

test('public surfaces keep accessible names and selected-control contrast', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
		'Draw one frame. The loop already has it.'
	);
	const start = page.locator('.pitch .primary');
	await start.hover();
	await expect(start).toHaveCSS('background-color', 'rgb(233, 229, 217)');
	await expect(start).toHaveCSS('color', 'rgb(17, 17, 17)');
	await start.click();

	const currentFrame = page.getByRole('group', { name: 'Frames' }).getByRole('button').first();
	await expect(currentFrame).toHaveCSS('background-color', 'rgb(17, 17, 17)');
	await expect(currentFrame).toHaveCSS('color', 'rgb(242, 239, 230)');
	await currentFrame.hover();
	await expect(currentFrame).toHaveCSS('background-color', 'rgb(233, 229, 217)');
	await expect(currentFrame).toHaveCSS('color', 'rgb(17, 17, 17)');
	const pencil = page.getByRole('button', { name: /Pencil/ });
	await pencil.hover();
	await expect(pencil).toHaveCSS('background-color', 'rgb(233, 229, 217)');
	await expect(pencil).toHaveCSS('color', 'rgb(17, 17, 17)');

	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	await expect(page.getByRole('dialog', { name: 'Resize canvas' })).toBeVisible();
});

test('Screentone mock keeps its active tool readable on hover', async ({ page }) => {
	await page.goto('/mockups#tone/editor');
	const pencil = page.getByRole('button', { name: 'PENCILB' });
	await pencil.hover();
	await expect(pencil).toHaveCSS('background-color', 'rgb(233, 229, 217)');
	await expect(pencil).toHaveCSS('color', 'rgb(17, 17, 17)');
});
