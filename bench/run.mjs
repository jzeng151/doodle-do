// Bench driver (§5): builds the app, serves it, runs /bench in headless
// Chromium, prints the numbers, and exits non-zero if the Phase 0 gate
// fails. Usage: npm run bench [-- --no-build]
import { spawn, execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 4179;
const noBuild = process.argv.includes('--no-build');

if (!noBuild) {
	console.log('building…');
	execSync('npm run build', { stdio: 'inherit' });
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
	stdio: 'ignore'
});

function fmt(stats) {
	return `n=${stats.count}  mean=${stats.mean.toFixed(3)}ms  p50=${stats.p50.toFixed(3)}ms  p95=${stats.p95.toFixed(3)}ms  max=${stats.max.toFixed(3)}ms`;
}

try {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	// wait for preview server
	for (let i = 0; ; i++) {
		try {
			await page.goto(`http://localhost:${PORT}/bench`, { timeout: 2000 });
			break;
		} catch (e) {
			if (i > 20) throw e;
			await new Promise((r) => setTimeout(r, 500));
		}
	}
	await page.waitForFunction(() => window.__doodleBench, null, { timeout: 60000 });
	const r = await page.evaluate(() => window.__doodleBench);
	await browser.close();

	console.log('\nDoodle-Do bench — 64×64, 4 layers, 12 frames');
	console.log(`stroke→loop latency   ${fmt(r.strokeToLoop)}`);
	console.log(
		`  outliers: ${r.strokeToLoopOutliers.map((o) => `#${o.index}=${o.ms.toFixed(1)}ms`).join('  ')}`
	);
	console.log(`stroke finalize       ${fmt(r.strokeFinalize)}`);
	console.log(`grid redraw (12f)     ${r.gridRedrawMs.toFixed(3)}ms`);
	console.log(`worst composite       ${r.worstCaseCompositeMs.toFixed(3)}ms (128×128, 8 layers, full)`);
	console.log(
		`\nPhase 0 gate: stroke→loop p95 < ${r.gate.limitMs}ms → ${r.gate.passed ? 'PASS' : 'FAIL'}`
	);
	process.exitCode = r.gate.passed ? 0 : 1;
} finally {
	server.kill();
}
