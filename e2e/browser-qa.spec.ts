import { expect, test, type Page } from '@playwright/test';

async function editor(page: Page) {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
}

function ink(canvas: HTMLCanvasElement) {
	return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, i) => i % 4 === 3 && value > 0);
}

test('96px rabbit strip stays visible after auto-fit, zoom, and frame changes', async ({ page }) => {
	await page.setViewportSize({ width: 969, height: 753 });
	await editor(page);
	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Open', exact: true }).click();
	await (await chooser).setFiles('e2e/fixtures/eating.png');
	const frames = page.getByRole('group', { name: 'Frames' }).getByRole('button');
	await expect(frames).toHaveCount(8);
	await expect(page.getByLabel('Document name')).toHaveValue('eating');
	const canvas = page.locator('canvas.editor');
	await expect.poll(() => canvas.evaluate(ink)).toBe(true);
	await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
	await expect.poll(() => canvas.evaluate(ink)).toBe(true);
	for (let i = 0; i < 8; i++) {
		await frames.nth(i).click();
		await expect.poll(() => canvas.evaluate(ink)).toBe(true);
	}
});

test('cancelled and failed disk saves preserve discard protection', async ({ page }) => {
	await editor(page);
	await page.getByRole('button', { name: 'Add layer', exact: true }).click();
	for (const error of ['AbortError', 'NotAllowedError']) {
		await page.evaluate((name) => {
			Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async () => { throw new DOMException('Picker rejected', name); } });
		}, error);
		await page.getByRole('button', { name: 'Save project' }).click();
		if (error === 'NotAllowedError') await expect(page.locator('.status')).toContainText('Save failed');
		await page.getByRole('banner').getByRole('button', { name: /^New/ }).click();
		await expect(page.getByRole('dialog', { name: 'Discard changes?' })).toBeVisible();
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	}
});

test('rename autosaves and recovered work still needs a disk save', async ({ page }) => {
	await editor(page);
	await page.getByRole('button', { name: 'Add layer', exact: true }).click();
	await expect(page.locator('.status')).toContainText('autosaved');
	await page.getByLabel('Document name').fill('Renamed rabbit');
	await page.getByLabel('Document name').press('Tab');
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByLabel('Document name')).toHaveValue('Untitled');
	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect.poll(() => page.evaluate(async () => {
		const root = await navigator.storage.getDirectory();
		const handle = await root.getFileHandle('autosave.doodledo');
		return JSON.parse(await (await handle.getFile()).text()).meta.name;
	})).toBe('Renamed rabbit');
	await page.reload();
	await expect(page.getByLabel('Document name')).toHaveValue('Renamed rabbit');
	await page.getByRole('banner').getByRole('button', { name: /^New/ }).click();
	await expect(page.getByRole('dialog', { name: 'Discard changes?' })).toBeVisible();
});

test('empty dimensions cannot create or resize a canvas', async ({ page }) => {
	await editor(page);
	for (const action of [/^New/, /^Resize$/]) {
		await page.getByRole('banner').getByRole('button', { name: action }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel('Width in pixels').fill('');
		await dialog.getByRole('button', { name: /^(Create|Resize)$/ }).click();
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('alert')).toContainText('Enter');
		await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
	}
});

test('toolbar history and zoom stay in view without page overflow', async ({ page }) => {
	for (const width of [320, 969, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await editor(page);
		for (const name of ['Undo', 'Redo', 'Zoom out', 'Zoom in']) {
			await expect(page.getByRole('button', { name, exact: true })).toBeInViewport();
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	}
});

test('successful saves clear protection only for the version written', async ({ page }) => {
	await editor(page);
	await page.getByRole('button', { name: 'Add layer', exact: true }).click();
	await page.evaluate(() => {
		Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async () => ({
			createWritable: async () => ({ write: async () => {}, close: async () => {} })
		}) });
	});
	await page.getByRole('button', { name: 'Save project' }).click();
	await expect(page.locator('.status')).toContainText('Project saved');
	await page.getByRole('banner').getByRole('button', { name: 'New animation' }).click();
	await expect(page.getByRole('dialog', { name: 'New animation', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	await page.evaluate(() => {
		Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: async () => ({
			createWritable: async () => ({ write: async () => {}, close: () => new Promise<void>((resolve) => {
				window.addEventListener('qa-finish-save', () => resolve(), { once: true });
			}) })
		}) });
	});
	await page.getByRole('button', { name: 'Save project' }).click();
	await expect(page.locator('.status')).toContainText('Save in progress');
	await page.getByRole('button', { name: 'Add layer', exact: true }).click();
	await page.evaluate(() => window.dispatchEvent(new Event('qa-finish-save')));
	await expect(page.locator('.status')).toContainText('Not saved to disk');
	await page.getByRole('banner').getByRole('button', { name: 'New animation' }).click();
	await expect(page.getByRole('dialog', { name: 'Discard changes?' })).toBeVisible();
});

test('autosave failures remain visible with a recovery action', async ({ page }) => {
	await editor(page);
	await page.evaluate(() => {
		navigator.storage.getDirectory = async () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
		indexedDB.open = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
	});
	await page.getByRole('button', { name: 'Add layer', exact: true }).click();
	await expect(page.locator('.status')).toContainText('Autosave failed: Storage full. Save a project file.');
	await expect(page.locator('.status')).toContainText('Not saved to disk');
});
