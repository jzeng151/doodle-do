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

test.describe('with a coarse pointer', () => {
	test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

	test('keeps the toolbar chooser Skip target at least 44px tall', async ({ page }) => {
		await openFreshEditor(page);
		expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
		const skip = page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
			.getByRole('button', { name: 'Skip and keep Full' });
		expect(await skip.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
	});

	test('keeps toolbar settings tap targets at least 44px tall', async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('doodledo.toolbar', '{"layout":"custom","chooserSeen":true}'));
		await openFreshEditor(page);
		expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
		await page.getByRole('button', { name: 'Toolbar', exact: true }).click();
		const settings = page.locator('.settings');

		const checkbox = settings.getByLabel('Onion skin');
		expect((await checkbox.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		expect((await checkbox.locator('..').boundingBox())!.height).toBeGreaterThanOrEqual(44);
		expect((await settings.getByRole('button', { name: 'Close' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
	});
});

test('disables Focus-only tools in the Grid More tools menu', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	await page.getByRole('button', { name: 'Toolbar', exact: true }).click();
	const settings = page.locator('.settings');
	await settings.getByText('Custom', { exact: true }).click();
	await settings.getByLabel('Drawing tools').uncheck();
	await settings.getByRole('button', { name: 'Close' }).click();

	await page.getByRole('group', { name: 'Workspace mode' }).getByRole('button', { name: 'Grid' }).click();
	await page.getByRole('button', { name: 'More tools' }).click();
	const moreTools = page.locator('.more-tools');
	for (const tool of ['Select', 'Lasso', 'Wand', 'Polygon']) {
		await expect(moreTools.getByRole('button', { name: tool, exact: true })).toBeDisabled();
	}
	await expect(moreTools.getByRole('button', { name: 'Pencil', exact: true })).toBeEnabled();
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

	await page.getByRole('button', { name: 'Loop', exact: true }).click();
	await page.getByRole('button', { name: 'Next lesson' }).click();
	await expect(page.getByRole('button', { name: 'Focus', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText('Drag across the canvas to draw a line.')).toBeVisible();
});

test('completes a lesson from the current Compare fork after reset', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	await page.getByRole('button', { name: 'Learn', exact: true }).click();
	await page.getByRole('button', { name: 'Compare', exact: true }).click();
	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Reset fork' }).click();

	const forkEditor = page.locator('[data-editor-branch="fork"] canvas.editor');
	const box = (await forkEditor.boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(page.getByText('Done. You used Pencil.')).toBeVisible();
});

test('selection lessons start and advance in Replace mode', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Full' })
		.click();
	await page.getByRole('button', { name: 'Select', exact: true }).click();
	const selectionMode = page.getByRole('group', { name: 'Selection mode' });
	await selectionMode.getByRole('button', { name: 'Subtract', exact: true }).click();
	await page.getByRole('button', { name: 'Learn', exact: true }).click();
	await expect(selectionMode.getByRole('button', { name: 'Replace', exact: true })).toHaveAttribute('aria-pressed', 'true');

	await selectionMode.getByRole('button', { name: 'Intersect', exact: true }).click();
	await page.getByRole('button', { name: 'Skip', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Lasso', exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(selectionMode.getByRole('button', { name: 'Replace', exact: true })).toHaveAttribute('aria-pressed', 'true');
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

test('completes the Lasso lesson with keyboard canvas controls', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	const editor = page.locator('canvas.editor');
	await editor.focus();
	await page.keyboard.press('l');
	await page.getByRole('button', { name: 'Learn', exact: true }).click();
	await expect(page.getByText('Draw a loop around part of the artwork.')).toBeVisible();

	await editor.focus();
	await page.keyboard.press('Enter');
	for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) await page.keyboard.press(key);
	await page.keyboard.press('Enter');
	await expect(page.getByText('Done. You used Lasso.')).toBeVisible();
});

test('explains lessons that need artwork before they can start', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	await page.getByRole('button', { name: 'Toolbar', exact: true }).click();
	await page.getByRole('button', { name: 'Open tool lessons' }).click();
	const lessons = page.getByRole('dialog', { name: 'Tool lessons' });
	const move = lessons.getByText('Move', { exact: true }).locator('..').locator('..');
	await expect(move.getByRole('button')).toBeDisabled();
	await expect(move).toContainText('Draw something on the active layer before learning Move.');
});

test('explains that drawing lessons need an unlocked active layer', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	await page.getByRole('button', { name: 'Lock Layer 1' }).click();
	await page.getByRole('button', { name: 'Learn', exact: true }).click();
	const pencil = page.getByRole('dialog', { name: 'Tool lessons' }).getByRole('listitem').first();
	await expect(pencil.getByRole('button')).toBeDisabled();
	await expect(pencil).toContainText('Unlock the active layer before learning Pencil.');
});

test('clears the active lesson when a new workspace replaces the old one', async ({ page }) => {
	await openFreshEditor(page);
	await page.getByRole('dialog', { name: 'Choose your drawing toolbar' })
		.getByRole('button', { name: 'Choose Essentials' })
		.click();
	await page.getByRole('button', { name: 'Learn', exact: true }).click();
	const editor = page.locator('canvas.editor');
	const box = (await editor.boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(page.getByText('Done. You used Pencil.')).toBeVisible();
	await page.getByRole('button', { name: 'Next lesson' }).click();
	await expect(page.getByText('Drag across the canvas to draw a line.')).toBeVisible();

	await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).click();
	await page.getByRole('button', { name: 'Discard and continue' }).click();
	await page.getByRole('dialog', { name: 'New animation' }).getByRole('button', { name: '32×32' }).click();
	await expect(page.getByText('Drag across the canvas to draw a line.')).toBeHidden();
	await expect.poll(() => page.evaluate(() => localStorage.getItem('doodledo.toolLessons'))).toContain('pencil');
});
