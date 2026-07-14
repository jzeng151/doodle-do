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

test('select, move, commit as one undo step', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	// draw a dot at (8,8)
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await page.mouse.up();
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);

	// marquee around it
	await page.keyboard.press('m');
	await expect(page.getByRole('button', { name: /Select/ })).toHaveClass(/active/);
	await mouseOnPixel(page, 6, 6);
	await page.mouse.down();
	await mouseOnPixel(page, 11, 11);
	await page.mouse.up();

	// drag from inside the marquee to move by (+8, +8), then commit
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await mouseOnPixel(page, 16, 16);
	await page.mouse.up();
	await page.keyboard.press('Enter');

	expect(await page.evaluate(pixelOpaque, [16, 16] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);

	// T14: undo removes the whole move in one step
	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [16, 16] as [number, number])).toBe(false);
});

test('escape cancels a floating move', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	await mouseOnPixel(page, 4, 4);
	await page.mouse.down();
	await page.mouse.up();

	await page.keyboard.press('m');
	await mouseOnPixel(page, 3, 3);
	await page.mouse.down();
	await mouseOnPixel(page, 6, 6);
	await page.mouse.up();
	await mouseOnPixel(page, 4, 4);
	await page.mouse.down();
	await mouseOnPixel(page, 20, 20);
	await page.mouse.up();
	await page.keyboard.press('Escape');

	expect(await page.evaluate(pixelOpaque, [4, 4] as [number, number])).toBe(true);
	// nothing to undo: the cancelled move never became a command
	await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled(); // the pencil dot
	await page.keyboard.press('Control+z');
	await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});
