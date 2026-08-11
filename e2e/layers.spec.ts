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

async function drawDot(page: Page, x: number, y: number) {
	const box = (await page.locator('canvas.editor').boundingBox())!;
	await page.mouse.move(box.x + (x + 0.5) * ZOOM, box.y + (y + 0.5) * ZOOM);
	await page.mouse.down();
	await page.mouse.up();
}

test('merge down flattens two layers as one undo step', async ({ page }) => {
	await page.goto('/#editor');
	await page.locator('canvas.editor').waitFor();

	await drawDot(page, 8, 8); // layer 1
	await page.getByTitle('Add layer').click();
	await drawDot(page, 12, 12); // layer 2 (active after add)

	const layers = page.locator('.layers .name');
	await expect(layers).toHaveCount(2);

	await page.getByTitle('Merge into layer below').click();
	await expect(layers).toHaveCount(1);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [12, 12] as [number, number])).toBe(true);

	// ONE undo restores both layers, composite unchanged
	await page.keyboard.press('Control+z');
	await expect(layers).toHaveCount(2);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [12, 12] as [number, number])).toBe(true);
});

test('send layer to frame copies it onto the target frame', async ({ page }) => {
	await page.goto('/#editor');
	await page.locator('canvas.editor').waitFor();
	await page.getByRole('button', { name: 'Onion' }).click(); // onion ghosts would read as opaque pixels

	await drawDot(page, 8, 8); // frame 1, layer 1

	await page.getByTitle('Send layer to another frame').click();
	await page.getByRole('spinbutton', { name: 'Frame' }).fill('2');
	await page.getByRole('button', { name: 'Copy' }).click();

	// the source frame is untouched, the target gained the pixels
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	await page.locator('canvas.editor').focus();
	await page.keyboard.press('PageDown'); // frame 2
	await expect.poll(() => page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);

	// one undo removes the copied layer from the target
	await page.keyboard.press('Control+z');
	await expect.poll(() => page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);
	await page.keyboard.press('PageUp'); // back on frame 1: still intact
	await expect.poll(() => page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
});
