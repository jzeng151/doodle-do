import { expect, test, type Locator, type Page } from '@playwright/test';

function canvasHasInk(sel: string) {
	const canvas = document.querySelector(sel) as HTMLCanvasElement;
	const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
	return data.some((v) => v !== 0);
}

function locatorHasInk(locator: Locator) {
	return locator.evaluate((canvas: HTMLCanvasElement) => {
		const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
		return data.some((value) => value !== 0);
	});
}

async function gotoApp(page: Page) {
	await page.goto('/canvas');
	await page.locator('canvas.editor').waitFor();
}

async function drawOn(page: Page, locator: ReturnType<Page['locator']>, from = 0.3, to = 0.7) {
	const box = (await locator.boundingBox())!;
	await page.mouse.move(box.x + box.width * from, box.y + box.height * from);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * to, box.y + box.height * to, { steps: 6 });
	await page.mouse.up();
}

const switcher = (page: Page) => page.getByRole('group', { name: 'Workspace mode' });

test('Phase 3 gate: mode switches preserve document, frame, and zoom', async ({ page }) => {
	await gotoApp(page);
	await drawOn(page, page.locator('canvas.editor'));
	await page.getByTitle('Zoom in').click();
	await page.getByTitle('Zoom in').click(); // 12 → 16
	await page.getByRole('group', { name: 'Frames' }).getByRole('button').nth(1).click();

	await switcher(page).getByRole('button', { name: 'Grid' }).click();
	// grid shows every frame as an editable canvas; the drawing is in tile 1
	const tiles = page.getByRole('group', { name: 'Editable frames' }).locator('.tile');
	await expect(tiles).toHaveCount(2);
	expect(
		await page.evaluate(canvasHasInk, '[aria-label="Editable frames"] .tile:first-child canvas')
	).toBe(true);
	// current frame carried over
	await expect(tiles.nth(1)).toHaveClass(/active/);

	await switcher(page).getByRole('button', { name: 'Loop' }).click();
	await expect(page.locator('.counter')).toBeVisible();

	await switcher(page).getByRole('button', { name: 'Focus' }).click();
	// zoom persisted: 32px doc at 16× = 512
	await expect(page.locator('canvas.editor')).toHaveAttribute('width', '512');
	// frame selection persisted
	await expect(
		page.getByRole('group', { name: 'Frames' }).getByRole('button').nth(1)
	).toHaveAttribute('aria-pressed', 'true');
	// document intact: the stroke still undoes
	await page.keyboard.press('Control+z');
	await page.getByRole('group', { name: 'Frames' }).getByRole('button').first().click();
	expect(await page.evaluate(canvasHasInk, 'canvas.editor')).toBe(false);
});

test('grid mode: strokes land on the frame you draw on', async ({ page }) => {
	await gotoApp(page);
	await switcher(page).getByRole('button', { name: 'Grid' }).click();
	const tiles = page.getByRole('group', { name: 'Editable frames' }).locator('.tile');
	await drawOn(page, tiles.nth(1).locator('canvas'));

	expect(
		await page.evaluate(canvasHasInk, '[aria-label="Editable frames"] .tile:nth-child(2) canvas')
	).toBe(true);
	expect(
		await page.evaluate(canvasHasInk, '[aria-label="Editable frames"] .tile:first-child canvas')
	).toBe(false);
	// drawing on a tile makes it the current frame
	await expect(tiles.nth(1)).toHaveClass(/active/);
	// and the whole drag is one undo step
	await page.keyboard.press('Control+z');
	expect(
		await page.evaluate(canvasHasInk, '[aria-label="Editable frames"] .tile:nth-child(2) canvas')
	).toBe(false);
});

test('keyboard lines commit on tool changes and work in Grid', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('button', { name: 'Line' }).click();
	const editor = page.locator('canvas.editor');
	await editor.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.getByRole('button', { name: 'Pencil' }).click();
	expect(await locatorHasInk(editor)).toBe(true);
	await page.keyboard.press('Control+z');

	await page.getByRole('button', { name: 'Line' }).click();
	await editor.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.getByRole('button', { name: 'Flip H' }).click();
	await page.keyboard.press('Control+z');
	expect(await locatorHasInk(editor)).toBe(true);
	await page.keyboard.press('Control+z');
	expect(await locatorHasInk(editor)).toBe(false);

	await page.getByRole('button', { name: 'Line' }).click();
	await switcher(page).getByRole('button', { name: 'Grid' }).click();
	const tile = page.getByRole('group', { name: 'Editable frames' }).locator('canvas').first();
	await tile.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('Space');
	expect(await locatorHasInk(tile)).toBe(true);
});

test('keyboard shapes preview until the second activation', async ({ page }) => {
	await gotoApp(page);
	await page.getByRole('button', { name: 'Rect' }).click();
	const editor = page.locator('canvas.editor');
	await editor.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Space');
	await page.getByRole('banner').getByRole('button', { name: 'New' }).focus();
	expect(await locatorHasInk(editor)).toBe(true);
	await page.keyboard.press('Control+z');
	expect(await locatorHasInk(editor)).toBe(false);
	await editor.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.getByRole('button', { name: 'Flip H' }).click();
	await page.keyboard.press('Control+z');
	expect(await locatorHasInk(editor)).toBe(true);
	await page.keyboard.press('Control+z');
	expect(await locatorHasInk(editor)).toBe(false);
});

test('selection shortcuts stay in editable selection views and target the fork pane', async ({ page }) => {
	await gotoApp(page);
	await switcher(page).getByRole('button', { name: 'Grid' }).click();
	await page.getByRole('group', { name: 'Editable frames' }).locator('canvas').first().focus();
	await page.keyboard.press('Control+a');
	await switcher(page).getByRole('button', { name: 'Focus' }).click();
	await expect(page.getByRole('button', { name: 'Rotate selection left 15 degrees' })).toBeDisabled();

	await switcher(page).getByRole('button', { name: 'Compare' }).click();
	const panes = page.locator('.editor-pane');
	await panes.nth(1).getByRole('button', { name: 'Select', exact: true }).click();
	await page.keyboard.press('Control+a');
	await expect(panes.nth(1).getByRole('button', { name: 'Rotate selection left 15 degrees' })).toBeEnabled();
	await expect(panes.first().getByRole('button', { name: 'Rotate selection left 15 degrees' })).toBeDisabled();
});

test('comparison playback commits a pending layer move', async ({ page }) => {
	await gotoApp(page);
	await switcher(page).getByRole('button', { name: 'Compare' }).click();
	const current = page.locator('.editor-pane').first();
	const editor = current.locator('canvas.editor');
	await drawOn(page, editor);
	await current.getByRole('button', { name: 'Move', exact: true }).click();
	await editor.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');

	await page.getByRole('button', { name: 'Compare animations' }).click();
	await expect.poll(() => locatorHasInk(page.locator('canvas.compare-canvas').first())).toBe(true);
});

test('Grid previews and keyboard-moves a floating layer', async ({ page }) => {
	await gotoApp(page);
	await drawOn(page, page.locator('canvas.editor'));
	await page.getByRole('button', { name: 'Move', exact: true }).click();
	await switcher(page).getByRole('button', { name: 'Grid' }).click();
	const tile = page.getByRole('group', { name: 'Editable frames' }).locator('canvas').first();
	await tile.focus();
	await page.keyboard.press('Space');
	await page.getByRole('button', { name: 'Loop' }).focus();
	expect(await locatorHasInk(tile)).toBe(true);
	await tile.focus();
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('Space');
	await page.getByRole('button', { name: 'Loop' }).focus();
	expect(await locatorHasInk(tile)).toBe(true);
});

test('loop mode: scrubber, counter, and play/pause', async ({ page }) => {
	await gotoApp(page);
	await switcher(page).getByRole('button', { name: 'Loop' }).click();
	await expect(page.locator('canvas.hero')).toBeVisible();
	await expect(page.locator('.counter')).toContainText('/ 2');
	const speed = page.getByLabel('Playback speed');
	await expect(speed).toHaveValue('1');
	await expect(speed.locator('option')).toHaveText(['0.25×', '0.5×', '1×', '2×']);
	await speed.selectOption('0.25');

	// scrubbing pauses and jumps
	await page.locator('.scrubber').fill('1');
	await expect(page.locator('.counter')).toHaveText('2 / 2');
	await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();

	await page.getByRole('button', { name: 'Play' }).click();
	await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

	// filmstrip click seeks and pauses
	await page.locator('.film-frame').first().click();
	await expect(page.locator('.counter')).toHaveText('1 / 2');
	await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();

	// playback speed is view state and survives closing and reopening Loop mode
	await switcher(page).getByRole('button', { name: 'Focus' }).click();
	await switcher(page).getByRole('button', { name: 'Loop' }).click();
	await expect(page.getByLabel('Playback speed')).toHaveValue('0.25');
});

test('saving a renamed clip replaces the selected clip', async ({ page }) => {
	await gotoApp(page);
	await switcher(page).getByRole('button', { name: 'Loop' }).click();
	const name = page.getByLabel('Name', { exact: true });
	await name.fill('walk');
	await page.getByRole('button', { name: 'Save clip' }).click();
	await name.fill('run');
	await page.getByRole('button', { name: 'Save clip' }).click();
	await expect(page.getByLabel('Clip').locator('option')).toHaveText(['All frames', 'run (1–2)']);
});

test('preview background setting is shared with Loop mode', async ({ page }) => {
	await gotoApp(page);
	const sidePanel = page.locator('.loop-panel');
	const sideToggle = sidePanel.getByRole('button', { name: 'Background' });
	await expect(sideToggle).toHaveAttribute('aria-pressed', 'true');

	await sideToggle.click();
	await expect(sidePanel.locator('canvas.loop')).toHaveCSS('background-image', 'none');

	await switcher(page).getByRole('button', { name: 'Loop' }).click();
	const loopToggle = page.getByRole('button', { name: 'Background' });
	await expect(loopToggle).toHaveAttribute('aria-pressed', 'false');
	await expect(page.locator('canvas.hero')).toHaveCSS('background-image', 'none');

	await loopToggle.click();
	await expect(page.locator('canvas.hero')).not.toHaveCSS('background-image', 'none');
	await switcher(page).getByRole('button', { name: 'Focus' }).click();
	await expect(sidePanel.getByRole('button', { name: 'Background' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('compare mode edits an independent fork and opens playback comparison', async ({ page }) => {
	await gotoApp(page);
	await switcher(page).getByRole('button', { name: 'Compare' }).click();
	await expect(page.getByRole('button', { name: 'Edit side by side' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	const editors = page.locator('.editor-pane');
	await expect(editors).toHaveCount(2);
	const currentCanvas = editors.nth(0).locator('canvas.editor');
	const forkCanvas = editors.nth(1).locator('canvas.editor');
	await drawOn(page, forkCanvas);
	expect(await locatorHasInk(currentCanvas)).toBe(false);
	expect(await locatorHasInk(forkCanvas)).toBe(true);

	await forkCanvas.focus();
	await page.keyboard.press('e');
	await expect(editors.nth(1).getByRole('button', { name: 'Eraser' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(editors.nth(0).getByRole('button', { name: 'Pencil' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await editors.nth(1).getByRole('button', { name: 'Duplicate' }).click();
	await expect(editors.nth(0).getByText('2 frames · Save/export target')).toBeVisible();
	await expect(editors.nth(1).getByText('3 frames · Session only')).toBeVisible();
	await editors.nth(0).getByRole('button', { name: 'Swap with fork' }).click();
	await expect(editors.nth(0).getByText('3 frames · Save/export target')).toBeVisible();
	await expect(editors.nth(1).getByText('2 frames · Session only')).toBeVisible();
	expect(await locatorHasInk(currentCanvas)).toBe(true);
	expect(await locatorHasInk(forkCanvas)).toBe(false);
	await editors.nth(0).getByRole('button', { name: 'Swap with fork' }).click();
	await expect(editors.nth(0).getByText('2 frames · Save/export target')).toBeVisible();
	await expect(editors.nth(1).getByText('3 frames · Session only')).toBeVisible();

	for (const name of ['Save project', 'Export sheet', 'Export GIF', 'Export frames']) {
		await expect(editors.nth(1).getByRole('button', { name })).toBeVisible();
	}
	await page.evaluate(() => {
		const target = window as typeof window & { savedForkName?: string };
		Object.defineProperty(window, 'showSaveFilePicker', {
			configurable: true,
			value: async ({ suggestedName }: { suggestedName: string }) => {
				target.savedForkName = suggestedName;
				return { createWritable: async () => ({ write: async () => {}, close: async () => {} }) };
			}
		});
	});
	await editors.nth(1).getByRole('button', { name: 'Save project' }).click();
	await expect.poll(() => page.evaluate(() => (window as typeof window & { savedForkName?: string }).savedForkName))
		.toBe('Untitled-fork.doodledo');

	page.once('dialog', (dialog) => dialog.accept());
	await editors.nth(1).getByRole('button', { name: 'Apply as current' }).click();
	await expect(editors.nth(0).getByText('3 frames · Save/export target')).toBeVisible();
	expect(await locatorHasInk(currentCanvas)).toBe(true);
	await editors.nth(0).getByRole('button', { name: 'Undo' }).click();
	await expect(editors.nth(0).getByText('2 frames · Save/export target')).toBeVisible();
	expect(await locatorHasInk(currentCanvas)).toBe(false);

	await page.getByRole('button', { name: 'Compare animations' }).click();
	await expect(page.getByRole('heading', { name: 'Animation comparison' })).toBeVisible();
	await expect(page.locator('canvas.compare-canvas')).toHaveCount(2);
	await expect(page.getByText('3 · Fork edits', { exact: false })).toBeVisible();

	await page.getByRole('button', { name: 'Edit side by side' }).click();
	await expect(page.locator('.editor-pane')).toHaveCount(2);
	await expect(page.getByText('3 frames · Session only')).toBeVisible();
});

test('B5: a floating selection commits on mode switch', async ({ page }) => {
	await gotoApp(page);
	const editor = page.locator('canvas.editor');
	const box = (await editor.boundingBox())!;
	const z = 12;
	// dot at (8,8)
	await page.mouse.move(box.x + 8.5 * z, box.y + 8.5 * z);
	await page.mouse.down();
	await page.mouse.up();
	// select and start a move
	await page.keyboard.press('m');
	await page.mouse.move(box.x + 6 * z, box.y + 6 * z);
	await page.mouse.down();
	await page.mouse.move(box.x + 11 * z, box.y + 11 * z);
	await page.mouse.up();
	await page.mouse.move(box.x + 8.5 * z, box.y + 8.5 * z);
	await page.mouse.down();
	await page.mouse.move(box.x + 20.5 * z, box.y + 20.5 * z);
	await page.mouse.up();

	// switch to grid while floating: the move must commit as one command
	await switcher(page).getByRole('button', { name: 'Grid' }).click();
	await switcher(page).getByRole('button', { name: 'Focus' }).click();
	const opaqueAt = ([x, y]: [number, number]) => {
		const canvas = document.querySelector('canvas.editor') as HTMLCanvasElement;
		const zoom = canvas.width / 32;
		const d = canvas
			.getContext('2d')!
			.getImageData(Math.floor((x + 0.5) * zoom), Math.floor((y + 0.5) * zoom), 1, 1).data;
		return d[3] > 0;
	};
	expect(await page.evaluate(opaqueAt, [20, 20] as [number, number])).toBe(true);
	expect(await page.evaluate(opaqueAt, [8, 8] as [number, number])).toBe(false);
	// one undo reverts the whole move
	await page.keyboard.press('Control+z');
	expect(await page.evaluate(opaqueAt, [8, 8] as [number, number])).toBe(true);
});

test('mode switcher carries the teaching tooltips', async ({ page }) => {
	await gotoApp(page);
	for (const name of ['Focus', 'Grid', 'Loop', 'Compare']) {
		const title = await switcher(page).getByRole('button', { name }).getAttribute('title');
		expect(title).toContain('Best for:');
		expect(title).toContain('Less useful for:');
	}
});
