import { expect, test } from '@playwright/test';

test('Save shortcut includes the focused field value', async ({ page }) => {
	await page.goto('/canvas');
	await page.evaluate(() => {
		Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async () => ({
			createWritable: async () => ({
				write: async (text: string) => { (window as typeof window & { savedProject?: string }).savedProject = text; },
				close: async () => {}
			})
		}) });
	});
	for (const [label, value, path] of [
		['Document name', 'Keyboard project', ['meta', 'name']],
		['FPS', '12', ['meta', 'fps']],
		['Frame duration in milliseconds', '220', ['frames', '0', 'durationMs']],
		['Layer name', 'Keyboard layer', ['frames', '0', 'layers', '0', 'name']]
	] as const) {
		if (label === 'Layer name') await page.getByRole('button', { name: 'More layer actions' }).click();
		await page.getByLabel(label, { exact: true }).fill(value);
		await page.keyboard.press('Control+s');
		await expect.poll(() => page.evaluate((keys) => {
			const saved = (window as typeof window & { savedProject?: string }).savedProject;
			if (!saved) return '';
			return String(keys.reduce((object, key) => object[key], JSON.parse(saved)));
		}, [...path])).toBe(value);
	}
});

test('Grid toolbar zoom resizes tiles and preserves Focus zoom', async ({ page }) => {
	await page.goto('/canvas');
	const mode = page.getByRole('group', { name: 'Workspace mode', exact: true });
	const focusWidth = await page.locator('canvas.editor').getAttribute('width');
	await mode.getByRole('button', { name: 'Grid', exact: true }).click();
	const tile = page.getByRole('group', { name: 'Editable frames' }).locator('canvas').first();
	const originalWidth = Number(await tile.getAttribute('width'));
	await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
	await expect(tile).toHaveAttribute('width', String(originalWidth + 32));
	await expect(page.getByRole('group', { name: 'Canvas view' })).toContainText(`${originalWidth / 32 + 1}×`);
	await page.getByRole('button', { name: 'Smaller tiles', exact: true }).click();
	await expect(tile).toHaveAttribute('width', String(originalWidth));
	await expect(page.getByRole('group', { name: 'Canvas view' })).toContainText(`${originalWidth / 32}×`);
	await mode.getByRole('button', { name: 'Focus', exact: true }).click();
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', focusWidth!);
});

test('project menus load the example, fit it, and save with the keyboard', async ({ page }) => {
	await page.goto('/canvas');
	await page.getByRole('button', { name: 'Try chicken example', exact: true }).click();
	await expect(page.getByLabel('Document name')).toHaveValue('chicken-example');
	await expect(page.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(4);
	await page.getByRole('button', { name: '100%', exact: true }).click();
	await expect(page.locator('canvas.editor')).toHaveCSS('width', '16px');
	await page.getByRole('button', { name: 'Fit', exact: true }).click();
	expect((await page.locator('canvas.editor').boundingBox())!.width).toBeGreaterThan(100);
	await page.getByRole('button', { name: 'More layer actions' }).click();
	await page.getByLabel('Layer name', { exact: true }).fill('Chicken');
	await page.getByLabel('Layer name', { exact: true }).press('Tab');
	await expect(page.getByRole('button', { name: 'Chicken', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Layer 1', exact: true })).toBeVisible();
	await page.evaluate(() => {
		Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async () => ({ createWritable: async () => ({ write: async () => {}, close: async () => {} }) }) });
	});
	await page.keyboard.press('Control+s');
	await expect(page.locator('.status')).toContainText('Project saved');
	await page.getByRole('button', { name: 'Export', exact: true }).click();
	await expect(page.getByRole('group', { name: 'Export', exact: true })).toContainText('Allow all three downloads');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeFocused();
});

test('palette stays visible on a short laptop screen with many layers', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/canvas');
	for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Add layer', exact: true }).click();
	const palette = (await page.locator('.swatches').boundingBox())!;
	expect(palette.y).toBeGreaterThan(0);
	expect(palette.y + palette.height).toBeLessThan(720);
	const preview = (await page.locator('.loop-panel canvas').boundingBox())!;
	const rail = (await page.locator('aside').first().boundingBox())!;
	expect(preview.y + preview.height).toBeLessThanOrEqual(rail.y + rail.height);
	const layers = page.getByRole('list', { name: 'Layers', exact: true });
	expect(await layers.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
});

test('phone comparison canvases retain usable space above their inspectors', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/canvas');
	await page.getByRole('group', { name: 'Workspace mode', exact: true })
		.getByRole('button', { name: 'Compare', exact: true }).click();
	for (const branch of ['current', 'fork']) {
		const pane = page.locator(`section[data-editor-branch="${branch}"]`);
		const viewport = pane.getByRole('region', { name: 'Canvas viewport' });
		const bounds = (await viewport.boundingBox())!;
		expect(bounds.width).toBeGreaterThan(300);
		expect(bounds.height).toBeGreaterThanOrEqual(320);
		const inspector = (await pane.locator('aside').boundingBox())!;
		expect(inspector.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
		const canvas = pane.locator('canvas.editor');
		await canvas.focus();
		await page.keyboard.press('Space');
		await expect(pane.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
	}
});


test('fork save shortcut suggests a separate filename', async ({ page }) => {
 await page.goto('/canvas');
 await page.getByRole('group', { name: 'Workspace mode', exact: true }).getByRole('button', { name: 'Compare', exact: true }).click();
 await page.evaluate(() => {
  Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async (options: { suggestedName: string }) => {
   (window as typeof window & { suggestedName?: string }).suggestedName = options.suggestedName;
   return { createWritable: async () => ({ write: async () => {}, close: async () => {} }) };
  } });
 });
 await page.locator('section[data-editor-branch="fork"] canvas.editor').focus();
 await page.keyboard.press('Control+s');
 await expect.poll(() => page.evaluate(() => (window as typeof window & { suggestedName?: string }).suggestedName)).toBe('Untitled-fork.doodledo');
});
