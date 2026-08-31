import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function openFreshEditor(page: import('@playwright/test').Page) {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
}

test('chooses an Essentials toolbar and reaches hidden tools', async ({ page }) => {
	await openFreshEditor(page);
	const chooser = page.getByRole('dialog', { name: 'Choose your drawing toolbar' });
	await expect(chooser).toBeVisible();
	await chooser.getByRole('button', { name: 'Choose Essentials' }).click();

	await expect(page.getByRole('button', { name: 'Pencil', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Line', exact: true })).toBeHidden();
	await page.getByRole('button', { name: 'More tools' }).click();
	await page.getByRole('button', { name: 'Line', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Line', exact: true })).toHaveAttribute('aria-pressed', 'true');

	await page.getByRole('button', { name: 'Toolbar', exact: true }).click();
	const settings = page.locator('.settings');
	await settings.getByText('Custom', { exact: true }).click();
	await settings.getByLabel('Onion skin').uncheck();
	await settings.getByLabel('Drawing tools').uncheck();
	await settings.getByRole('button', { name: 'Close' }).click();
	await expect(page.getByRole('group', { name: 'Onion skin' })).toHaveCount(0);
	await page.getByRole('button', { name: 'More tools' }).click();
	await page.getByRole('button', { name: 'Pencil', exact: true }).click();
	await expect(page.getByRole('button', { name: 'More tools' })).toBeVisible();
});

test('completes a user-started lesson after a real canvas action', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	await page.getByRole('button', { name: 'Learn', exact: true }).click();
	await expect(page.getByText('Draw at least one pixel.')).toBeVisible();

	const editor = page.locator('canvas.editor');
	const box = (await editor.boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(page.getByText('Done. You used Pencil.')).toBeVisible();
	await expect.poll(() => page.evaluate(() => localStorage.getItem('doodledo.toolLessons'))).toContain('pencil');
});

test('keeps every tool lesson reachable in a short viewport', async ({ page }) => {
	await page.setViewportSize({ width: 740, height: 320 });
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Full' })
		.click();
	await page.getByRole('button', { name: 'Toolbar', exact: true }).click();
	await page.getByRole('button', { name: 'Open tool lessons' }).click();

	const dialog = page.getByRole('dialog', { name: 'Tool lessons' });
	const list = dialog.getByRole('list');
	expect(await list.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
		await list.evaluate((element) => element.clientHeight)
	);
	const lastStart = dialog.getByRole('listitem').last().getByRole('button');
	await lastStart.scrollIntoViewIfNeeded();
	await expect(lastStart).toBeInViewport();
	await lastStart.click();
	await expect(dialog).toBeHidden();
});
