import { expect, test } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

test('draw a stroke, see it in the live loop, undo it', async ({ page }) => {
	await page.goto('/');
	const editor = page.locator('canvas.editor');
	const undo = page.getByRole('button', { name: 'Undo' });
	await expect(undo).toBeDisabled();

	const box = (await editor.boundingBox())!;
	await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, { steps: 10 });
	await page.mouse.up();

	// stroke landed on the editor canvas
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(true);
	// and shows up in the always-playing loop preview (frame 1 of 2)
	await expect
		.poll(() => page.evaluate(canvasHasInk, 'canvas.loop'), { timeout: 3000 })
		.toBe(true);

	// the whole drag undoes as ONE step (B2)
	await expect(undo).toBeEnabled();
	await undo.click();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
	await expect(undo).toBeDisabled();
});
