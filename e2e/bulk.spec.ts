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

function frameOption(page: Page, index: number) {
	return page.getByRole('group', { name: 'Frames' }).getByRole('button').nth(index);
}

test('a stroke lands on every bulk-selected frame as one undo step', async ({ page }) => {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
	await page.getByRole('button', { name: 'Onion' }).click(); // onion ghosts would read as opaque pixels

	// 3 frames; select frame 1, ctrl-click frames 2 and 3 into the set
	await page.getByTitle('Add blank frame').click(); // frame 3
	await frameOption(page, 0).click();
	await frameOption(page, 1).click({ modifiers: ['Control'] });
	await frameOption(page, 2).click({ modifiers: ['Control'] });

	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await page.mouse.up();

	// the dot exists on all three frames
	for (const f of [1, 2, 0]) {
		await frameOption(page, f).click(); // plain click also exits bulk mode
		expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
	}

	// ONE undo clears all three
	await page.keyboard.press('Control+z');
	for (const f of [1, 2, 0]) {
		await frameOption(page, f).click();
		expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);
	}
});

test('a selection move applies to every bulk-selected frame', async ({ page }) => {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
	await page.getByRole('button', { name: 'Onion' }).click();

	// bulk-draw a dot on both default frames, keeping the set active
	await frameOption(page, 1).click({ modifiers: ['Control'] });
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await page.mouse.up();

	// bulk selection: marquee the dot, drag it to (16,16), commit
	await page.keyboard.press('m');
	await mouseOnPixel(page, 6, 6);
	await page.mouse.down();
	await mouseOnPixel(page, 10, 10);
	await page.mouse.up();
	await mouseOnPixel(page, 8, 8);
	await page.mouse.down();
	await mouseOnPixel(page, 16, 16);
	await page.mouse.up();
	await page.keyboard.press('Enter');

	for (const f of [1, 0]) {
		await frameOption(page, f).click();
		expect(await page.evaluate(pixelOpaque, [16, 16] as [number, number])).toBe(true);
		expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(false);
	}

	// ONE undo restores both frames
	await page.keyboard.press('Control+z');
	for (const f of [1, 0]) {
		await frameOption(page, f).click();
		expect(await page.evaluate(pixelOpaque, [8, 8] as [number, number])).toBe(true);
		expect(await page.evaluate(pixelOpaque, [16, 16] as [number, number])).toBe(false);
	}
});
