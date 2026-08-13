import { expect, test, type Page } from '@playwright/test';

const ZOOM = 12; // session default

async function gotoApp(page: Page) {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
}

async function draw(page: Page) {
	const box = await page.locator('canvas.editor').boundingBox();
	if (!box) throw new Error('no editor canvas');
	await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 5 });
	await page.mouse.up();
}

test('resize changes an existing canvas via a preset', async ({ page }) => {
	await gotoApp(page);
	// default doc is 32×32
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(32 * ZOOM));
	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	await page.getByRole('dialog').getByRole('button', { name: '48×48' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Resize' }).click();
	const zoom = Number(
		(await page.getByRole('group', { name: 'Canvas view' }).locator('.zoom').textContent())!.replace('×', '')
	);
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(48 * Math.ceil(zoom)));
	await expect(page.locator('canvas.editor')).toHaveAttribute('height', String(48 * Math.ceil(zoom)));
	expect(zoom).toBeLessThan(ZOOM);
});

test('resize supports 512×512 and fits it to the viewport', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 600 });
	await gotoApp(page);
	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.locator('input[type=number]').first().fill('600');
	await dialog.locator('input[type=number]').nth(1).fill('600');
	await dialog.getByRole('button', { name: 'Resize' }).click();
	const editor = page.locator('canvas.editor');
	const zoom = Number(
		(await page.getByRole('group', { name: 'Canvas view' }).locator('.zoom').textContent())!.replace('×', '')
	);
	await expect(editor).toHaveAttribute('width', '512');
	await expect(editor).toHaveAttribute('height', '512');
	expect(zoom).toBeLessThan(ZOOM);
	const fit = await page.locator('.scroll').evaluate((viewport, canvas) => {
		const view = viewport.getBoundingClientRect();
		const art = canvas!.getBoundingClientRect();
		return {
			fits: art.width <= view.width && art.height <= view.height,
			fillsAxis: Math.min(view.width - art.width, view.height - art.height) < 8
		};
	}, await editor.elementHandle());
	expect(fit).toEqual({ fits: true, fillsAxis: true });
});

test('mirror axes stay valid and follow resize history', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('button', { name: 'Mirror X' }).click();
	await page.getByRole('button', { name: 'Mirror Y' }).click();
	const axis = page.getByLabel('X axis');
	const yAxis = page.getByLabel('Y axis');
	await axis.fill('20');
	await yAxis.fill('20');
	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('button', { name: '16×16' }).click();
	await dialog.getByRole('button', { name: 'Resize' }).click();
	await expect(axis).toHaveValue('15');
	await expect(yAxis).toHaveValue('15');
	await axis.fill('2');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(axis).toHaveValue('2');
	await expect(yAxis).toHaveValue('20');
	await page.getByRole('button', { name: 'Redo' }).click();
	await expect(axis).toHaveValue('2');
	await expect(yAxis).toHaveValue('15');

	await axis.fill('');
	const box = await page.locator('canvas.editor').boundingBox();
	if (!box) throw new Error('no editor canvas');
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(axis).toHaveValue('7.5');
	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	await page.getByRole('dialog').getByRole('button', { name: '48×48' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Resize' }).click();
	await expect(axis).toHaveAttribute('max', '47');
});

test('mirror axis edits survive lossy scaled resize history', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('button', { name: 'Mirror X' }).click();
	const axis = page.getByLabel('X axis');
	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.locator('input[type=number]').first().fill('64');
	await dialog.locator('input[type=number]').nth(1).fill('64');
	await dialog.getByLabel('Scale art to fit').check();
	await dialog.getByRole('button', { name: 'Resize' }).click();
	await axis.fill('10');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(axis).toHaveValue('5');
	await page.getByRole('button', { name: 'Redo' }).click();
	await expect(axis).toHaveValue('10');
	await page.getByRole('button', { name: 'Undo' }).click();
	await axis.fill('4');
	await axis.dispatchEvent('change');
	await axis.fill('5');
	await axis.dispatchEvent('change');
	await page.getByRole('button', { name: 'Redo' }).click();
	await expect(axis).toHaveValue('10.5');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(axis).toHaveValue('5');
	await axis.fill('10');
	await page.getByRole('button', { name: 'Redo' }).click();
	await expect(axis).toHaveValue('20.5');
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(axis).toHaveValue('10');
});

test('New warns before discarding unsaved work, but not on a clean doc', async ({ page }) => {
	await gotoApp(page);

	// clean doc: New goes straight to the size picker, no discard warning
	await page.getByRole('banner').getByRole('button', { name: 'New' }).click();
	await expect(page.getByRole('button', { name: 'Discard and continue' })).toHaveCount(0);
	await expect(page.getByRole('dialog').getByRole('button', { name: '16×16' })).toBeVisible();
	await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

	// after an edit, New warns; Cancel keeps the current canvas intact
	await draw(page);
	await page.getByRole('banner').getByRole('button', { name: 'New' }).click();
	await expect(page.getByText("aren't saved to disk")).toBeVisible();
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(32 * ZOOM));

	// confirming discards and opens the size picker → a fresh 16×16 doc
	await page.getByRole('banner').getByRole('button', { name: 'New' }).click();
	await page.getByRole('button', { name: 'Discard and continue' }).click();
	await page.getByRole('dialog').getByRole('button', { name: '16×16' }).click();
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(16 * ZOOM));
});
