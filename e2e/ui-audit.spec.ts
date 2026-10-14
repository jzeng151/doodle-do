import { expect, test } from '@playwright/test';

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
