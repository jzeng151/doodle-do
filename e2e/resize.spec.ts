import { expect, test, type Page } from '@playwright/test';

const ZOOM = 12; // session default

async function gotoApp(page: Page) {
	await page.goto('/#editor');
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
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(48 * ZOOM));
	await expect(page.locator('canvas.editor')).toHaveAttribute('height', String(48 * ZOOM));
});

test('resize custom size clamps to the 128 cap', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('banner').getByRole('button', { name: 'Resize' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.locator('input[type=number]').first().fill('200');
	await dialog.locator('input[type=number]').nth(1).fill('64');
	await dialog.getByRole('button', { name: 'Resize' }).click();
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(128 * ZOOM));
	await expect(page.locator('canvas.editor')).toHaveAttribute('height', String(64 * ZOOM));
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
