import { expect, test, type Page } from '@playwright/test';

async function gotoApp(page: Page) {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
}

test('new-document presets create the chosen canvas size', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('banner').getByRole('button', { name: 'New' }).click();
	await page.getByRole('button', { name: '16×16' }).click();
	// editor canvas is doc width × zoom (12)
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(16 * 12));
});

test('custom size clamps to the 512 cap', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('banner').getByRole('button', { name: 'New' }).click();
	const dialog = page.locator('dialog');
	await dialog.locator('input').first().fill('600');
	await dialog.locator('input').nth(1).fill('24');
	await page.getByRole('button', { name: 'Create' }).click();
	const zoom = Number(
		(await page.getByRole('group', { name: 'Canvas view' }).locator('.zoom').textContent())!.replace('×', '')
	);
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', String(512 * Math.ceil(zoom)));
	await expect(page.locator('canvas.editor')).toHaveAttribute('height', String(24 * Math.ceil(zoom)));
	expect(zoom).toBeLessThan(12);
});

test('tips: fire on triggers, cap per session, dismiss forever, hide all', async ({ page }) => {
	await gotoApp(page);
	const toast = page.locator('.tip');

	// T01 fires on the first fresh document
	await expect(toast).toContainText('loop preview');
	await toast.getByRole('button', { name: 'Dismiss', exact: true }).click();
	await expect(toast).toHaveCount(0);

	// duplicating a frame fires T03
	await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
	await expect(toast).toContainText('nudging a few pixels');
	await toast.getByRole('button', { name: "Don't show again" }).click();

	// dismissed forever: another duplicate stays quiet
	await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
	await expect(toast).toHaveCount(0);

	// global toggle off blocks new tips (T02 via selecting frame 2)
	await page.getByRole('button', { name: 'Tips' }).click();
	await page.getByRole('group', { name: 'Frames' }).getByRole('button').nth(1).click();
	await expect(toast).toHaveCount(0);
});

test('frame PNGs export as a zip', async ({ page }) => {
	await gotoApp(page);
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export frames' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(/-frames\.zip$/);
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const bytes = Buffer.concat(chunks);
	expect(bytes.subarray(0, 2).toString('ascii')).toBe('PK');
	// central directory should list both frames of the default doc
	expect(bytes.includes('frame-0.png')).toBe(true);
	expect(bytes.includes('frame-1.png')).toBe(true);
});
