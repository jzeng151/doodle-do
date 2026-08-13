import { expect, test, type Page } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

async function gotoApp(page: Page, path = '/canvas') {
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

test('palette changes reset replace-color endpoints', async ({ page }) => {
	await gotoApp(page);
	const palette = page.locator('.palette-panel');
	await palette.getByRole('button', { name: 'Replace', exact: true }).click();
	const from = palette.getByLabel('From');
	const to = palette.getByLabel('To');
	await from.selectOption('10');
	await to.selectOption('11');
	await palette.locator('.swatch:not(.eraser)').first().click();
	await palette.getByRole('button', { name: 'Remove', exact: true }).click();
	await expect(from).toHaveValue('1');
	await expect(to).toHaveValue('2');
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

test('previous and next onion skins can be toggled independently', async ({ page }) => {
	await gotoApp(page);
	const frames = page.getByRole('group', { name: 'Frames' }).getByRole('button');
	await drawStroke(page); // frame 1 becomes the previous ghost
	await page.getByTitle('Add blank frame').click();
	await page.getByTitle('Add blank frame').click();
	await drawStroke(page); // frame 3 becomes the next ghost
	await frames.nth(1).click(); // blank frame between them

	const previous = page.getByRole('button', { name: 'Previous', exact: true });
	const next = page.getByRole('button', { name: 'Next', exact: true });
	await expect(previous).toHaveAttribute('aria-pressed', 'true');
	await expect(next).toHaveAttribute('aria-pressed', 'true');
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);

	await previous.click();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
	await next.click();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
	await previous.click();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
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

test('swapping active colors finalizes a keyboard line preview', async ({ page }) => {
	await gotoApp(page);
	const editor = page.locator('canvas.editor');
	await page.getByRole('button', { name: 'Line' }).click();
	await editor.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('x');
	await page.keyboard.press('Control+z');
	await page.getByRole('banner').getByRole('button', { name: 'New' }).focus();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
});

test('transparent background color remains visible after swapping', async ({ page }) => {
	await gotoApp(page);
	const palette = page.locator('.palette-panel');
	await palette.getByRole('button', { name: 'Transparent' }).click();
	await palette.getByTitle('Swap foreground and background colors (X)').click();
	await expect(palette.getByRole('button', { name: 'Transparent' })).toHaveClass(/background-selected/);
	await expect(palette.locator('.active-color.background')).toHaveClass(/transparent/);
});

test('keyboard pencil indicator matches the brush size', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('group', { name: 'Brush settings' }).getByRole('combobox').selectOption('4');
	const editor = page.locator('canvas.editor');
	await editor.focus();
	for (let i = 0; i < 5; i++) {
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowDown');
	}
	const bounds = await editor.evaluate((canvas) => {
		const ctx = canvas.getContext('2d')!;
		const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let minX = width;
		let maxX = -1;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (data[(y * width + x) * 4 + 3] === 0) continue;
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
			}
		}
		return maxX - minX + 1;
	});
	expect(bounds).toBeGreaterThan(40); // 4 canvas pixels at the default 12× zoom
});

test('pointer pixels and transparency grid align with the drawable canvas', async ({ page }) => {
	await gotoApp(page);
	const editor = page.locator('canvas.editor');
	await expect(editor).toHaveCSS('background-size', '24px 24px');
	const box = (await editor.boundingBox())!;
	const border = await editor.evaluate((canvas) => canvas.clientLeft);

	// Still inside pixel 0, close enough to its edge that including the border maps to pixel 1.
	await page.mouse.click(box.x + border + 10.5, box.y + border + 10.5);
	const painted = await editor.evaluate((canvas) => {
		const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
		const opaque = (x: number, y: number) => data[(y * canvas.width + x) * 4 + 3] > 0;
		return { first: opaque(6, 6), southeast: opaque(18, 18) };
	});
	expect(painted).toEqual({ first: true, southeast: false });

	await page.getByRole('group', { name: 'Workspace mode' }).getByRole('button', { name: 'Grid' }).click();
	await expect(page.locator('.tile canvas').first()).toHaveCSS('background-size', '6px 6px');
});

test('mouse wheel zooms and middle-drag pans the canvas', async ({ page }) => {
	await page.setViewportSize({ width: 1000, height: 600 });
	await gotoApp(page);
	const viewport = page.locator('.scroll');
	let box = (await viewport.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	const zoom = page.getByRole('group', { name: 'Canvas view' }).locator('.zoom');
	const beforeZoom = await zoom.textContent();
	await page.mouse.wheel(0, -100);
	await expect(zoom).not.toHaveText(beforeZoom!);

	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	await page.getByRole('dialog').getByRole('button', { name: '64×64' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Resize' }).click();
	box = (await viewport.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	for (let i = 0; i < 20; i++) await page.mouse.wheel(0, -100);
	const beforePan = await viewport.evaluate((el) => {
		el.scrollLeft = Math.min(150, el.scrollWidth - el.clientWidth);
		el.scrollTop = Math.min(150, el.scrollHeight - el.clientHeight);
		return { left: el.scrollLeft, top: el.scrollTop };
	});
	expect(beforePan.left).toBeGreaterThan(40);
	expect(beforePan.top).toBeGreaterThan(40);

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down({ button: 'middle' });
	await expect(viewport).toHaveClass(/panning/);
	await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30);
	await page.mouse.up({ button: 'middle' });
	const afterPan = await viewport.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }));
	expect(afterPan.left).toBeLessThan(beforePan.left);
	expect(afterPan.top).toBeLessThan(beforePan.top);
	const widthBeforeUndo = Number(await page.locator('canvas.editor').getAttribute('width'));
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect
		.poll(async () => Number(await page.locator('canvas.editor').getAttribute('width')))
		.toBeLessThan(widthBeforeUndo); // the first undo is still Resize, so middle-drag did not paint
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

test('landing animation derives its frames from the sprite strip', async ({ page }) => {
	await page.goto('/');
	const { frameSize, frameCount } = await page.evaluate(async () => {
		const image = new Image();
		image.src = '/assets/chicken-walk.png';
		await image.decode();
		return { frameSize: image.naturalHeight, frameCount: image.naturalWidth / image.naturalHeight };
	});
	const sprite = page.getByRole('img', { name: /white chicken walk cycle/ });
	await expect(sprite).toHaveAccessibleName(`${frameCount}-frame white chicken walk cycle, drawn in Doodle-Do`);
	await expect(sprite).toHaveCSS('background-size', `${frameSize * frameCount * 16}px ${frameSize * 16}px`);
	await expect(page.locator('.stage figcaption')).toContainText(`${frameCount} frames`);
});

test('landing footer links to legal pages, GitHub, and support', async ({ page }) => {
	await page.goto('/');
	const footer = page.getByRole('contentinfo');
	await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
	await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
	await expect(footer.getByRole('link', { name: 'Doodle-Do on GitHub' })).toHaveAttribute('href', 'https://github.com/jzeng151/doodle-do');
	await expect(footer.getByRole('link', { name: 'Buy me a coffee' })).toHaveAttribute('href', 'https://buymeacoffee.com/jasonzeng');
	await footer.getByRole('link', { name: 'Privacy' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
});

test('public surfaces keep accessible names and selected-control contrast', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
		'Draw a frame. Watch it loop.'
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

test('landing page opens the editor on the canvas route', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /Start drawing|Resume autosave/ }).first().click();
	await expect(page).toHaveURL(/\/canvas$/);
	await expect(page.locator('canvas.editor')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Doodle-Do home' })).toHaveAttribute('href', '/');
});

test('legacy editor hash redirects to the canvas route', async ({ page }) => {
	await page.goto('/#editor');
	await expect(page).toHaveURL(/\/canvas$/);
	await expect(page.locator('canvas.editor')).toBeVisible();
});
