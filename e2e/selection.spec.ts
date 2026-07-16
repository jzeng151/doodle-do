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

test('shift adds a second marquee; both regions move as one undo step', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	// two dots far apart
	await mouseOnPixel(page, 5, 5);
	await page.mouse.down();
	await page.mouse.up();
	await mouseOnPixel(page, 20, 5);
	await page.mouse.down();
	await page.mouse.up();

	await page.keyboard.press('m');
	await mouseOnPixel(page, 3, 3);
	await page.mouse.down();
	await mouseOnPixel(page, 7, 7);
	await page.mouse.up();

	// shift-drag adds a second region around the second dot
	await page.keyboard.down('Shift');
	await mouseOnPixel(page, 18, 3);
	await page.mouse.down();
	await mouseOnPixel(page, 22, 7);
	await page.mouse.up();
	await page.keyboard.up('Shift');

	// drag from inside the first region: both move by (0, +10)
	await mouseOnPixel(page, 5, 5);
	await page.mouse.down();
	await mouseOnPixel(page, 5, 15);
	await page.mouse.up();
	await page.keyboard.press('Enter');

	expect(await page.evaluate(pixelOpaque, [5, 15] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [20, 15] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [5, 5] as [number, number])).toBe(false);
	expect(await page.evaluate(pixelOpaque, [20, 5] as [number, number])).toBe(false);

	// one undo restores both regions
	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [5, 5] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [20, 5] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [5, 15] as [number, number])).toBe(false);
	expect(await page.evaluate(pixelOpaque, [20, 15] as [number, number])).toBe(false);
});

test('rotate handle turns a selection 90 degrees with shift snap', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	// horizontal 5x1 bar at y=16, x=10..14
	await mouseOnPixel(page, 10, 16);
	await page.mouse.down();
	await mouseOnPixel(page, 14, 16);
	await page.mouse.up();

	await page.keyboard.press('m');
	await mouseOnPixel(page, 10, 16);
	await page.mouse.down();
	await mouseOnPixel(page, 14, 16);
	await page.mouse.up();

	// grab the rotate handle: HANDLE_OFFSET=16 css px above the bbox top-edge
	// midpoint (mirrors EditorCanvas.svelte); bbox = (10,16,5,1), mid = (12.5,16)
	const box = (await page.locator('canvas.editor').boundingBox())!;
	const midX = box.x + 12.5 * ZOOM;
	const centerY = box.y + 16.5 * ZOOM;
	await page.mouse.move(midX, box.y + 16 * ZOOM - 16);
	await page.mouse.down();
	// with shift held, drag a quarter turn to snap to exactly 90 degrees
	await page.keyboard.down('Shift');
	await page.mouse.move(midX + 60, centerY);
	await page.mouse.up();
	await page.keyboard.up('Shift');
	await page.keyboard.press('Enter');

	// the bar is now vertical at x=12, y=14..18
	expect(await page.evaluate(pixelOpaque, [12, 14] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [12, 18] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [10, 16] as [number, number])).toBe(false);
	expect(await page.evaluate(pixelOpaque, [14, 16] as [number, number])).toBe(false);

	// one undo restores the horizontal bar
	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [10, 16] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [14, 16] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [12, 14] as [number, number])).toBe(false);
});

test('lasso selects a freehand region and moves it', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await page.mouse.up();

	// lasso a loop around the dot; release auto-closes it
	await page.keyboard.press('l');
	await mouseOnPixel(page, 5, 5);
	await page.mouse.down();
	await mouseOnPixel(page, 11, 5);
	await mouseOnPixel(page, 11, 11);
	await mouseOnPixel(page, 5, 11);
	await page.mouse.up();

	// drag from inside to move by (0, +10), then commit
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await mouseOnPixel(page, 8, 18);
	await page.mouse.up();
	await page.keyboard.press('Enter');

	expect(await page.evaluate(pixelOpaque, [8, 18] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);

	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [8, 18] as [number, number])).toBe(false);
});

test('wand selects only the contiguous same-color region', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	// a 2-pixel blob at (5,5)-(6,5) and a separate dot at (12,5)
	await mouseOnPixel(page, 5, 5);
	await page.mouse.down();
	await mouseOnPixel(page, 6, 5);
	await page.mouse.up();
	await mouseOnPixel(page, 12, 5);
	await page.mouse.down();
	await page.mouse.up();

	// wand-click the blob, then drag it down by 8
	await page.keyboard.press('w');
	await mouseOnPixel(page, 5, 5);
	await page.mouse.down();
	await page.mouse.up();
	await mouseOnPixel(page, 5, 5);
	await page.mouse.down();
	await mouseOnPixel(page, 5, 13);
	await page.mouse.up();
	await page.keyboard.press('Enter');

	expect(await page.evaluate(pixelOpaque, [5, 13] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [6, 13] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [5, 5] as [number, number])).toBe(false);
	expect(await page.evaluate(pixelOpaque, [12, 5] as [number, number])).toBe(true); // untouched
	expect(await page.evaluate(pixelOpaque, [12, 13] as [number, number])).toBe(false);

	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [5, 5] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [5, 13] as [number, number])).toBe(false);
});

test('polygon selects via placed vertices, closed on the first vertex', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas.editor').waitFor();

	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await page.mouse.up();

	// place four vertices, then click the first one again to close
	await page.keyboard.press('p');
	for (const [x, y] of [
		[4, 4],
		[13, 4],
		[13, 13],
		[4, 13],
		[4, 4]
	] as [number, number][]) {
		await mouseOnPixel(page, x, y);
		await page.mouse.down();
		await page.mouse.up();
	}

	// drag from inside to move by (0, +10), then commit
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await mouseOnPixel(page, 8, 18);
	await page.mouse.up();
	await page.keyboard.press('Enter');

	expect(await page.evaluate(pixelOpaque, [8, 18] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);

	await page.keyboard.press('Control+z');
	expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	expect(await page.evaluate(pixelOpaque, [8, 18] as [number, number])).toBe(false);
});
