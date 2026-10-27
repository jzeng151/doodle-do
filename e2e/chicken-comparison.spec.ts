import { expect, test } from '@playwright/test';

// Network-failure coverage must reach the route handler rather than the offline cache.
test.use({ serviceWorkers: 'block' });

for (const width of [1280, 390]) {
	test(`shows the chicken comparison at ${width}px with shared playback`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		const comparison = page.getByRole('region', { name: /small edits\. different walk\./i });
		const original = comparison.getByRole('img', { name: '4-frame original chicken walk cycle', exact: true });
		const refined = comparison.getByRole('img', { name: '4-frame refined chicken walk cycle', exact: true });
		await expect(original).toBeVisible();
		await expect(refined).toBeVisible();
		const before = (await original.boundingBox())!;
		const after = (await refined.boundingBox())!;
		expect(before.width).toBe(after.width);
		if (width > 600) expect(before.y).toBe(after.y);
		else expect(after.y).toBeGreaterThan(before.y + before.height);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		await comparison.getByRole('button', { name: 'Play both', exact: true }).click();
		await expect.poll(() => original.evaluate((el) => getComputedStyle(el).backgroundPositionX)).not.toBe('0px');
		await comparison.getByRole('button', { name: 'Pause both', exact: true }).click();
		const pausedAt = await original.evaluate((el) => getComputedStyle(el).backgroundPositionX);
		await expect(refined).toHaveCSS('background-position-x', pausedAt);
		await page.waitForTimeout(250);
		await expect(original).toHaveCSS('background-position-x', pausedAt);
		await comparison.screenshot({ path: testInfo.outputPath(`comparison-${width}.png`) });
	});
}

test('opens both chicken versions from home in editable Compare playback', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Open this comparison' }).click();
	await expect(page.getByRole('heading', { name: 'Animation comparison', exact: true })).toBeVisible();
	await expect(page.locator('canvas.compare-canvas')).toHaveCount(2);
	await expect(page.locator('figcaption').first()).toContainText('Chicken · Original');
	await expect(page.locator('figcaption').last()).toContainText('Chicken · Refined');
	await page.getByRole('button', { name: 'Edit side by side', exact: true }).click();
	await expect(page.locator('canvas.editor')).toHaveCount(2);
	await expect(page.getByLabel('Document name', { exact: true })).toHaveValue('Chicken · Original');
	await expect(page).toHaveURL('/canvas');
});

test('reaches comparison from the existing example menu', async ({ page }) => {
	await page.goto('/canvas');
	await page.getByRole('button', { name: 'Try chicken example', exact: true }).click();
	await page.getByRole('button', { name: 'Compare before and after', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Animation comparison', exact: true })).toBeVisible();
});

test('keeps recovered work when the home comparison is cancelled', async ({ page }) => {
	await page.goto('/canvas');
	const name = page.getByLabel('Document name', { exact: true });
	await name.fill('Keep my artwork');
	await name.press('Tab');
	await expect(page.locator('.status')).toContainText('autosaved');
	await page.getByRole('link', { name: 'Doodle-Do home', exact: true }).click();
	await page.getByRole('button', { name: 'Discard and continue', exact: true }).click();
	await page.getByRole('link', { name: 'Open this comparison' }).click();
	const warning = page.getByRole('dialog', { name: 'Discard changes?', exact: true });
	await expect(warning).toContainText('Replace this workspace with the chicken comparison?');
	await warning.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(name).toHaveValue('Keep my artwork');
	await expect(page.locator('canvas.compare-canvas')).toHaveCount(0);
});

test('keeps the current document if a comparison asset fails to load', async ({ page }) => {
	await page.route('**/chicken-walk-original.png', (route) => route.fulfill({ status: 503 }));
	await page.goto('/canvas');
	await page.getByRole('button', { name: 'Try chicken example', exact: true }).click();
	await page.getByRole('button', { name: 'Compare before and after', exact: true }).click();
	await expect(page.locator('.status')).toContainText('Load chicken comparison failed');
	await expect(page.getByLabel('Document name', { exact: true })).toHaveValue('Untitled');
	await expect(page.locator('canvas.editor')).toHaveCount(1);
});
