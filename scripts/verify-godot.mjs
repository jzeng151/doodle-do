// Export verification (§4.6): drive the real app, capture the real exported
// sprite sheet + TexturePacker JSON downloads, then load them in stock Godot
// and assert the atlas frames build valid regions and animate.
//
// Godot has no built-in TexturePacker-JSON importer (unlike Phaser's
// load.atlas), so this reproduces what a hand-rolled Godot import path does
// with engine primitives only: raw PNG → Image, parse the JSON-hash, one
// AtlasTexture per frame, a SpriteFrames animation that plays. That is the
// Godot analog of the Phaser check, not a plugin test.
//
// Usage: node scripts/verify-godot.mjs [--no-build]
// (Export-capture logic mirrors verify-phaser.mjs by design; kept separate so
//  neither gate script depends on the other.)
import { execSync, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const PORT_APP = 4184;
const GODOT = process.env.GODOT_BIN ?? 'godot';

// SceneTree main-loop script: raw PNG + JSON-hash → AtlasTexture regions →
// SpriteFrames that plays. Engine primitives only (no import plugin).
const GODOT_SCRIPT = `extends SceneTree

const DIR := "__DIR__"

func _initialize() -> void:
	var res := _run()
	print("GODOT_RESULT " + JSON.stringify(res))
	quit(0 if res.get("ok", false) else 1)

func _run() -> Dictionary:
	# raw PNG → Image, bypassing the resource-import pipeline
	var png := FileAccess.get_file_as_bytes(DIR + "/sheet.png")
	if png.is_empty():
		return { "ok": false, "error": "sheet.png unreadable" }
	var img := Image.new()
	if img.load_png_from_buffer(png) != OK:
		return { "ok": false, "error": "PNG decode failed" }
	var tex := ImageTexture.create_from_image(img)
	var iw := img.get_width()
	var ih := img.get_height()

	# parse the TexturePacker JSON-hash atlas (§4.6 primary schema)
	var json := JSON.new()
	if json.parse(FileAccess.get_file_as_string(DIR + "/sheet.json")) != OK:
		return { "ok": false, "error": "atlas JSON parse: " + json.get_error_message() }
	var frames_dict: Dictionary = (json.data as Dictionary).get("frames", {})
	var names := frames_dict.keys()
	names.sort()

	# one AtlasTexture per frame; every region must sit inside the sheet
	var sf := SpriteFrames.new()
	sf.add_animation("loop")
	for name in names:
		var f: Dictionary = (frames_dict[name] as Dictionary).get("frame", {})
		var r := Rect2(f.get("x", 0), f.get("y", 0), f.get("w", 0), f.get("h", 0))
		if r.size.x <= 0 or r.size.y <= 0:
			return { "ok": false, "error": "empty region for " + str(name) }
		if r.position.x < 0 or r.position.y < 0 or r.end.x > iw or r.end.y > ih:
			return { "ok": false, "error": "region out of bounds for " + str(name) }
		var at := AtlasTexture.new()
		at.atlas = tex
		at.region = r
		sf.add_frame("loop", at)

	# animate it, mirroring the Phaser "animation playing" assertion
	var spr := AnimatedSprite2D.new()
	spr.sprite_frames = sf
	get_root().add_child(spr)
	spr.play("loop")

	# companion schema must parse too
	var dd := JSON.new()
	var dd_ok := dd.parse(FileAccess.get_file_as_string(DIR + "/doodledo.json")) == OK

	return {
		"ok": true,
		"image_size": [iw, ih],
		"frames": names,
		"frame_count": sf.get_frame_count("loop"),
		"playing": spr.is_playing(),
		"doodledo_ok": dd_ok
	}
`;

if (!process.argv.includes('--no-build')) {
	console.log('building…');
	execSync('npm run build', { stdio: 'inherit' });
}

const workDir = mkdtempSync(join(tmpdir(), 'doodledo-godot-'));
const appServer = spawn('npx', ['vite', 'preview', '--port', String(PORT_APP), '--strictPort'], {
	stdio: 'ignore'
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
	await browser.close();
	console.log(`captured export: ${downloads.map((d) => d.suggestedFilename()).join(', ')}`);

	// --- 2. load it in stock Godot (engine primitives only) ---
	writeFileSync(join(workDir, 'project.godot'), 'config_version=5\n\n[application]\n\nconfig/name="doodledo-godot-verify"\n');
	writeFileSync(join(workDir, 'verify.gd'), GODOT_SCRIPT.replace('__DIR__', workDir));

	const run = spawnSync(GODOT, ['--headless', '--path', workDir, '--script', 'res://verify.gd'], {
		encoding: 'utf8',
		timeout: 60000
	});
	const out = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;
	const line = out.split('\n').find((l) => l.startsWith('GODOT_RESULT '));
	if (!line) {
		console.log(out.trim());
		throw new Error('no GODOT_RESULT sentinel — Godot did not run the script to completion');
	}
	const result = JSON.parse(line.slice('GODOT_RESULT '.length));

	console.log('\nGodot import verification');
	console.log(`  image size: ${result.image_size?.join('×') ?? '(none)'}`);
	console.log(`  atlas frames: ${result.frames?.join(', ') ?? '(none)'}`);
	console.log(`  SpriteFrames count: ${result.frame_count}`);
	console.log(`  animation playing: ${result.playing}`);
	console.log(`  doodledo.json parses: ${result.doodledo_ok}`);
	if (!result.ok) console.log(`  error: ${result.error}`);

	const pass =
		result.ok &&
		result.frames.length === 2 && // default doc has 2 frames
		result.frames.includes('frame-0') &&
		result.frames.includes('frame-1') &&
		result.frame_count === 2 &&
		result.playing &&
		result.doodledo_ok;
	console.log(pass ? '\nPASS' : '\nFAIL');
	process.exitCode = pass ? 0 : 1;
} finally {
	appServer.kill();
}
