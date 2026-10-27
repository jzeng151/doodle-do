import { expect, test } from '@playwright/test';

test('loads comparison B, links zoom, and protects its edits during replacement', async ({ page }) => {
	await page.goto('/canvas');
	await page.getByRole('button', { name: 'Try chicken example', exact: true }).click();
	await page.getByRole('button', { name: 'Edit the chicken', exact: true }).click();
	await expect(page.getByLabel('Document name')).toHaveValue('chicken-example');
	await page.getByRole('group', { name: 'Workspace mode', exact: true }).getByRole('button', { name: 'Compare' }).click();
	const current = page.locator('.editor-pane').first();
	const comparison = page.locator('.editor-pane').last();
	async function load(path: string) {
		const chooser = page.waitForEvent('filechooser');
		await page.getByRole('button', { name: 'Load comparison', exact: true }).click();
		await (await chooser).setFiles(path);
	}
	await load('static/assets/chicken-walk2.png');
	await expect(comparison.locator('.pane-title')).toContainText('chicken-walk2');
	await expect(current.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(4);
	await expect(comparison.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(5);
	await expect(page.locator('.shared-inspector')).toHaveCount(1);
	for (const viewport of await page.getByRole('region', { name: 'Canvas viewport', exact: true }).all())
		expect((await viewport.boundingBox())!.height).toBeGreaterThanOrEqual(300);
	await page.getByLabel('Link zoom').check();
	await current.getByRole('button', { name: 'Zoom in', exact: true }).click();
	await expect.poll(async () => (await current.locator('canvas.editor').boundingBox())!.width)
		.toBe((await comparison.locator('canvas.editor').boundingBox())!.width);
	await page.getByRole('button', { name: 'Edit B', exact: true }).click();
	await page.locator('.shared-inspector').getByRole('button', { name: 'Add layer', exact: true }).click();
	await load('static/assets/chicken-standing.png');
	await expect(page.getByRole('dialog', { name: 'Discard changes?' })).toBeVisible();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(comparison.locator('.pane-title')).toContainText('chicken-walk2');
	await load('static/assets/chicken-standing.png');
	await page.getByRole('button', { name: 'Discard and continue', exact: true }).click();
	await expect(comparison.locator('.pane-title')).toContainText('chicken-standing');
	await expect(current.getByRole('group', { name: 'Frames' }).getByRole('button')).toHaveCount(4);
	await page.getByRole('button', { name: 'Compare animations', exact: true }).click();
	await expect(page.locator('figcaption').first()).toContainText('chicken-example');
	await expect(page.locator('figcaption').last()).toContainText('chicken-standing');
	await page.getByRole('button', { name: 'Pause both' }).click();
	await page.getByRole('button', { name: 'Restart both' }).click();
	for (const canvas of await page.locator('canvas.compare-canvas').all())
		await expect(canvas).toHaveAttribute('aria-label', /frame 1 of/);
	await load('static/assets/chicken-walk2.png');
	await expect(page.locator('figcaption').last()).toContainText('chicken-walk2');
	await expect(page.locator('canvas.compare-canvas').last()).toHaveAttribute('aria-label', /frame [2-5] of 5/);
});

test('timeline controls playback and makes multi-frame action scope explicit', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/canvas');
	const timing = page.getByRole('group', { name: 'Animation timing' });
	await timing.getByLabel('FPS', { exact: true }).fill('12');
	await timing.getByLabel('FPS', { exact: true }).press('Tab');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(timing.getByLabel('FPS', { exact: true })).toHaveValue('8');
	await timing.getByRole('button', { name: 'Play', exact: true }).click();
	await expect(page.locator('canvas.loop')).toHaveAttribute('aria-label', 'Loop preview, playing');
	await timing.getByRole('button', { name: 'Pause', exact: true }).click();
	await expect(page.locator('canvas.loop')).toHaveAttribute('aria-label', 'Loop preview, paused');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.getByRole('group', { name: 'Workspace mode', exact: true }).getByRole('button', { name: 'Grid', exact: true }).click();
	await expect(page.locator('canvas.loop')).toHaveAttribute('aria-label', 'Loop preview, paused');
	await page.getByRole('group', { name: 'Workspace mode', exact: true }).getByRole('button', { name: 'Focus', exact: true }).click();
	await page.getByRole('button', { name: 'Choose frames' }).click();
	const frames = page.getByRole('group', { name: 'Frames' }).getByRole('button');
	await frames.nth(0).click();
	await frames.nth(1).click();
	await expect(page.locator('.scope')).toContainText('2 selected frames');
	await expect(page.locator('.scope')).toContainText('Frame actions affect frame 1 only');
	await page.getByTitle('Delete frame', { exact: true }).click();
	await expect(frames).toHaveCount(1);
});

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
	await page.getByRole('button', { name: 'Edit the chicken', exact: true }).click();
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
	expect(preview.y + preview.height).toBeLessThanOrEqual(720);
	const layers = page.getByRole('list', { name: 'Layers', exact: true });
	expect(await layers.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
});

test('phone comparison canvases retain usable space above their inspectors', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/canvas');
	await page.getByRole('group', { name: 'Workspace mode', exact: true })
		.getByRole('button', { name: 'Compare', exact: true }).click();
	for (const branch of ['current', 'fork']) {
		await page.getByRole('button', { name: branch === 'current' ? 'Edit A' : 'Edit B', exact: true }).click();
		const pane = page.locator(`section[data-editor-branch="${branch}"]`);
		const viewport = pane.getByRole('region', { name: 'Canvas viewport' });
		const bounds = (await viewport.boundingBox())!;
		expect(bounds.width).toBeGreaterThan(300);
		expect(bounds.height).toBeGreaterThanOrEqual(300);
		const inspector = (await page.locator('.shared-inspector aside').boundingBox())!;
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


for (const [width, height] of [[16, 64], [64, 16]]) {
 test(`keeps ${width}×${height} animation previews compact`, async ({ page }) => {
  await page.goto('/canvas');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('button', { name: 'New animation', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Width in pixels').fill(String(width));
  await dialog.getByLabel('Height in pixels').fill(String(height));
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  expect((await page.locator('canvas.loop').boundingBox())!.height).toBeLessThanOrEqual(76);
  expect((await page.locator('.strip-panel').boundingBox())!.height).toBeLessThan(200);
  expect((await page.getByRole('region', { name: 'Canvas viewport' }).boundingBox())!.height).toBeGreaterThan(200);
 });
}


test('switching comparison sides clears a pending palette removal', async ({ page }) => {
 await page.goto('/canvas');
 await page.locator('canvas.editor').focus();
 await page.keyboard.press('Space');
 await page.getByRole('group', { name: 'Workspace mode', exact: true }).getByRole('button', { name: 'Compare', exact: true }).click();
 const palette = page.locator('.shared-inspector .palette-panel');
 const colors = palette.locator('.swatch:not(.eraser)');
 await colors.first().click();
 await palette.getByRole('button', { name: 'Palette options' }).click();
 await palette.getByRole('button', { name: 'Remove', exact: true }).click();
 await expect(palette.locator('.hint')).toBeVisible();
 await page.getByRole('button', { name: 'Edit B', exact: true }).click();
 await expect(palette.locator('.hint')).toHaveCount(0);
 await colors.nth(1).click();
 await expect(colors).toHaveCount(16);
 await expect(colors.first()).toHaveAttribute('aria-label', 'Color #140c1c');
 await page.getByRole('button', { name: 'Edit A', exact: true }).click();
 await expect(palette.locator('.hint')).toHaveCount(0);
 await expect(colors).toHaveCount(16);
});
