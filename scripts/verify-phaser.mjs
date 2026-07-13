// Export verification (§4.6): drive the real app, capture the real exported
// sprite sheet + TexturePacker JSON downloads, then load them in a stock
// Phaser project and assert the atlas frames arrive and animate.
// Usage: node scripts/verify-phaser.mjs [--no-build]
import { execSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { chromium } from '@playwright/test';

const PORT_APP = 4182;
const PORT_FIXTURE = 4183;

if (!process.argv.includes('--no-build')) {
	console.log('building…');
	execSync('npm run build', { stdio: 'inherit' });
}

const workDir = mkdtempSync(join(tmpdir(), 'doodledo-phaser-'));
const appServer = spawn('npx', ['vite', 'preview', '--port', String(PORT_APP), '--strictPort'], {
	stdio: 'ignore'
});

const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.png': 'image/png'
};
const fixtureServer = createServer((req, res) => {
	const file = join(workDir, req.url === '/' ? 'index.html' : req.url.slice(1));
	if (!existsSync(file)) {
		res.writeHead(404).end();
		return;
	}
	res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
	res.end(readFileSync(file));
});

try {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// --- 1. produce a real export through the real UI ---
	for (let i = 0; ; i++) {
		try {
			await page.goto(`http://localhost:${PORT_APP}/`, { timeout: 2000 });
			break;
		} catch (e) {
			if (i > 20) throw e;
			await new Promise((r) => setTimeout(r, 500));
		}
	}
	await page.locator('canvas.editor').waitFor();
	const box = await page.locator('canvas.editor').boundingBox();
	await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7, { steps: 8 });
	await page.mouse.up();

	const downloads = [];
	page.on('download', (d) => downloads.push(d));
	await page.getByRole('button', { name: 'Export sheet' }).click();
	while (downloads.length < 3) await new Promise((r) => setTimeout(r, 100));
	for (const d of downloads) {
		const name = d.suggestedFilename();
		const normalized = name.endsWith('.doodledo.json')
			? 'doodledo.json'
			: name.endsWith('.png')
				? 'sheet.png'
				: 'sheet.json';
		await d.saveAs(join(workDir, normalized));
	}
	console.log(`captured export: ${downloads.map((d) => d.suggestedFilename()).join(', ')}`);

	// --- 2. load it in stock Phaser ---
	copyFileSync('node_modules/phaser/dist/phaser.min.js', join(workDir, 'phaser.min.js'));
	writeFileSync(
		join(workDir, 'index.html'),
		`<!doctype html><script src="phaser.min.js"></script><script>
		window.__result = null;
		new Phaser.Game({
			type: Phaser.CANVAS,
			width: 128, height: 128,
			scene: {
				preload() { this.load.atlas('doodle', 'sheet.png', 'sheet.json'); },
				create() {
					try {
						const frames = this.textures.get('doodle').getFrameNames();
						this.anims.create({
							key: 'loop',
							frames: frames.map((f) => ({ key: 'doodle', frame: f })),
							frameRate: 8, repeat: -1
						});
						const sprite = this.add.sprite(64, 64, 'doodle').play('loop');
						window.__result = { ok: true, frames, playing: sprite.anims.isPlaying };
					} catch (e) {
						window.__result = { ok: false, error: String(e) };
					}
				}
			}
		});
		</script>`
	);
	await new Promise((r) => fixtureServer.listen(PORT_FIXTURE, r));

	const errors = [];
	const phaserPage = await browser.newPage();
	phaserPage.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	phaserPage.on('pageerror', (e) => errors.push(e.message));
	await phaserPage.goto(`http://localhost:${PORT_FIXTURE}/`);
	await phaserPage.waitForFunction(() => window.__result, null, { timeout: 15000 });
	const result = await phaserPage.evaluate(() => window.__result);
	await browser.close();

	console.log('\nPhaser import verification');
	console.log(`  atlas frames: ${result.frames?.join(', ') ?? '(none)'}`);
	console.log(`  animation playing: ${result.playing}`);
	if (errors.length) console.log(`  console errors: ${errors.join(' | ')}`);

	const pass =
		result.ok &&
		result.frames.length === 2 && // default doc has 2 frames
		result.frames.includes('frame-0') &&
		result.frames.includes('frame-1') &&
		result.playing &&
		errors.length === 0;
	console.log(pass ? '\nPASS' : '\nFAIL');
	process.exitCode = pass ? 0 : 1;
} finally {
	appServer.kill();
	fixtureServer.close();
}
