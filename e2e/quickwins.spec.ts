import { expect, test, type Page } from '@playwright/test';

const ZOOM = 12; // session default

// alpha at the center of document pixel (x, y) on the editor canvas
function pixelOpaque([x, y]: [number, number]) {
	const canvas = document.querySelector('canvas.editor') as HTMLCanvasElement;
	const zoom = canvas.width / 32;
	const d = canvas
		.getContext('2d')!
		.getImageData(Math.floor((x + 0.5) * zoom), Math.floor((y + 0.5) * zoom), 1, 1).data;
	return d[3] > 0;
}

async function mouseOnPixel(page: Page, x: number, y: number) {
	const box = (await page.locator('canvas.editor').boundingBox())!;
	await page.mouse.move(box.x + (x + 0.5) * ZOOM, box.y + (y + 0.5) * ZOOM);
}

async function drawDotAndSelect(page: Page) {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await page.mouse.up();
	await page.keyboard.press('m');
	await mouseOnPixel(page, 6, 6);
	await page.mouse.down();
	await mouseOnPixel(page, 10, 10);
	await page.mouse.up();
}

test('Ctrl+J extracts the selection to a new layer as one undo step', async ({ page }) => {
	await drawDotAndSelect(page);
	const layers = page.locator('.layers .name');
	await expect(layers).toHaveCount(1);

	await page.keyboard.press('Control+j');
	await expect(layers).toHaveCount(2);
	// composite is unchanged: the dot just lives on the new layer now
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);

	// ONE undo reverts both the layer add and the source clear
	await page.keyboard.press('Control+z');
	await expect(layers).toHaveCount(1);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);

	// redo, then hide the new (top) layer: the dot vanishes, proving the
	// source layer was cleared
	await page.keyboard.press('Control+Shift+z');
	await expect(layers).toHaveCount(2);
	await page.getByTitle('Hide layer').first().click();
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);
});

test('arrow keys nudge the selection by one pixel', async ({ page }) => {
	await drawDotAndSelect(page);

	await page.keyboard.press('Alt+ArrowRight');
	await page.keyboard.press('Alt+ArrowDown');
	await page.keyboard.press('Enter');

	expect(await page.evaluate(pixelOpaque, [9, 9] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);

	// the whole nudge is one undo step
	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [9, 9] as [number, number])).toBe(false);
});

test('loop range confines playback to the selected frames', async ({ page }) => {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();

	await page.getByRole('button', { name: 'Loop' }).click();
	await page.getByLabel('Loop range start').fill('2');
	await page.getByLabel('Loop range start').press('Enter');
	await page.getByLabel('Loop range end').fill('2');
	await page.getByLabel('Loop range end').press('Enter');

	// playback snaps into the range and stays there (fps 8: several ticks)
	await page.waitForTimeout(600);
	await expect(page.locator('.counter')).toHaveText('2 / 2');
	await page.waitForTimeout(400);
	await expect(page.locator('.counter')).toHaveText('2 / 2');
});

test('polygon tool fires a tip with dismiss and don\'t-show-again', async ({ page }) => {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();

	// clear the onboarding tip that fires on a fresh document
	const tip = page.locator('.tip');
	await expect(tip).toBeVisible();
	await page.getByRole('button', { name: 'Dismiss' }).click();

	await page.getByRole('button', { name: /Polygon/ }).click();
	await expect(tip).toContainText('place corners');
	await page.getByRole('button', { name: "Don't show again" }).click();
	await expect(tip).toHaveCount(0);

	// switching away and back never resurfaces a dismissed-forever tip
	await page.getByRole('button', { name: /Pencil/ }).click();
	await page.getByRole('button', { name: /Polygon/ }).click();
	await expect(tip).toHaveCount(0);
});
