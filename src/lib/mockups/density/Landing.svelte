<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const SPECS = [
		['PALETTE', '16', '/ 64 max'],
		['CANVAS', '16', '× 16 px'],
		['FRAMES', '04', '@ 8 fps'],
		['ALPHA', '1', 'bit'],
		['LOOP', '500', 'ms'],
		['P95', '0.1', 'ms']
	];

	const MODES = [
		['FOCUS', '1', 'Drawing one frame with onion-skin context', 'Comparing many frames at once'],
		['GRID', '2', 'Seeing and editing every frame side by side', 'Detail work on a single frame'],
		['LOOP', '3', 'Judging the motion at full speed', 'You need to draw; switch back to edit']
	];

	const TIPS = [
		['T02', 'ONION', 'The red ghost is your previous frame. Draw where things have moved to, not where they were.'],
		['T09', 'RATE', 'Classic pixel animation often runs at 6-10 FPS. Smoothness comes from good in-betweens, not speed.'],
		['T10', 'LENGTH', "Longer isn't always better. A tight 4-frame loop often reads better than a loose 8."],
		['T06', 'PALETTE', 'Great pixel art usually uses surprisingly few colors. Limits make choices easier.'],
		['T03', 'FRAMES', 'Duplicating and nudging is how most animation actually gets made.'],
		['T15', 'SAVE', 'A project file on disk is the only copy you truly own.']
	];

	const OUT = [
		['SHEET', 'name.png', 'Uniform grid', 'PNG'],
		['ATLAS', 'name.json', 'TexturePacker JSON-hash', 'JSON'],
		['SPEC', 'name.doodledo.json', 'frameSize, fps, rects', 'JSON'],
		['GIF', 'name.gif', 'Per-frame delays', 'GIF'],
		['ZIP', 'name-frames.zip', 'One PNG per frame', 'ZIP']
	];

	const TOOLS = ['PENCIL B', 'ERASER E', 'FILL G', 'PICK I', 'SELECT M', 'LASSO L', 'WAND W', 'POLY P'];
	const RATES = [4, 8, 16] as const;
	const NAV = ['EDITOR', 'RATE', 'VIEWS', 'NOTES', 'OUTPUT', 'SPEC'];
	const UTIL = ['LOCAL-FIRST', 'NO ACCOUNT', 'NO AI', 'OFFLINE', 'PWA'];
</script>

<div class="mock site">
	<div class="util-rail">
		{#each UTIL as u (u)}<span>{u}</span>{/each}
		<span class="ver">v0.0.1 / PHASE 3</span>
	</div>

	<header class="head">
		<a class="mark" href="#top">DOODLE<span>-DO</span></a>
		<nav>{#each NAV as n (n)}<a href="#top">{n}</a>{/each}</nav>
		<a class="btn" href="#top">START DRAWING<i>›</i></a>
	</header>

	<!-- the mosaic: every module ruled, tabbed, and packed edge to edge -->
	<section class="mosaic" id="top">
		<article class="mod lead">
			<div class="tab">MAIN</div>
			<h1>Draw a frame.<br />The loop already has it.</h1>
			<p class="lede">
				Frame-by-frame pixel animation in the browser. Playback never stops while you work, so
				every stroke lands in a running loop instead of a still image.
			</p>
			<div class="badges">
				<span class="badge red">LOCAL</span><span class="badge">NO ACCOUNT</span>
				<span class="badge">NO AI</span><span class="badge">OFFLINE</span>
			</div>
			<div class="acts">
				<a class="btn" href="#top">START DRAWING<i>›</i></a>
				<a class="btn ghost" href="#out">SEE OUTPUT<i>›</i></a>
			</div>
		</article>

		<article class="mod fig">
			<div class="tab">OUTPUT / LIVE</div>
			<div class="fig-stage"><Sprite playing scale={9} /></div>
			<table class="mini">
				<tbody>
					<tr><td>SIZE</td><td class="v">16 × 16</td></tr>
					<tr><td>FRAMES</td><td class="v">04</td></tr>
					<tr><td>RATE</td><td class="v red">8 fps</td></tr>
				</tbody>
			</table>
		</article>

		<article class="mod stats">
			<div class="tab">SPEC</div>
			<dl>
				{#each SPECS as [k, n, u] (k)}
					<div><dt>{k}</dt><dd><b>{n}</b><span>{u}</span></dd></div>
				{/each}
			</dl>
		</article>

		<article class="mod tools">
			<div class="tab">TOOLS / 8</div>
			<ul>{#each TOOLS as t (t)}<li>{t}</li>{/each}</ul>
		</article>

		<article class="mod engines">
			<div class="tab">VERIFIED</div>
			<ul class="checks">
				<li><span class="ok">PASS</span>Loads in stock Phaser</li>
				<li><span class="ok">PASS</span>Imports into stock Godot</li>
				<li><span class="ok">PASS</span>0.1 ms p95 / 16 ms budget</li>
			</ul>
			<p class="note">Export is exercised by tests that run the real engines, not asserted.</p>
		</article>
	</section>

	<section class="row" id="rate">
		<h2 class="bar">RATE <span>Frame rate is not smoothness</span></h2>
		<div class="grid-3">
			{#each RATES as fps (fps)}
				<figure class="mod">
					<div class="tab">{fps} FPS</div>
					<div class="fig-stage sm"><Sprite playing {fps} scale={5} /></div>
					<p class="note">
						{fps === 4 ? 'Choppy. Every pose readable.' : fps === 8 ? 'The classic rate. Four drawings.' : 'Smoother, and twice the work.'}
					</p>
				</figure>
			{/each}
			<p class="wide-note">
				Same four drawings, three clocks. Nothing was redrawn between these; only the rate changed.
			</p>
		</div>
	</section>

	<section class="row" id="views">
		<h2 class="bar">VIEWS <span>Three views over one session</span></h2>
		<table class="dense">
			<thead><tr><th>MODE</th><th>KEY</th><th>INTENDED USE</th><th>KNOWN LIMIT</th></tr></thead>
			<tbody>
				{#each MODES as [n, k, use, lim] (n)}
					<tr><td class="k">{n}</td><td class="c">{k}</td><td>{use}</td><td class="lim">{lim}</td></tr>
				{/each}
			</tbody>
		</table>
		<p class="wide-note">
			Switching preserves the document, current frame, zoom, and palette. The limit column is
			printed because a tool that only lists strengths is an advert.
		</p>
	</section>

	<section class="row" id="notes">
		<h2 class="bar">NOTES <span>26 events, capped, dismissible</span></h2>
		<ul class="tips">
			{#each TIPS as [id, cat, copy] (id)}
				<li><span class="tid">{id}</span><span class="cat">{cat}</span><p>{copy}</p></li>
			{/each}
		</ul>
	</section>

	<section class="row" id="out">
		<h2 class="bar">OUTPUT <span>Five files, engine-ready</span></h2>
		<table class="dense">
			<thead><tr><th>ID</th><th>FILE</th><th>CONTENTS</th><th>TYPE</th></tr></thead>
			<tbody>
				{#each OUT as [id, file, what, type] (id)}
					<tr><td class="k">{id}</td><td class="f">{file}</td><td>{what}</td><td class="c">{type}</td></tr>
				{/each}
			</tbody>
		</table>
	</section>

	<footer class="foot">
		<div class="foot-main">
			<span class="mark">DOODLE<span>-DO</span></span>
			<a class="btn" href="#top">START DRAWING<i>›</i></a>
		</div>
		<p class="note">
			Figure is a four-frame walk cycle authored for this page from the sixteen-color starter
			palette.
		</p>
	</footer>
</div>

<style>
	.site {
		--white: #ffffff;
		--ink: #111111;
		--red: #e60012;
		--line: #dadada;
		--surface: #f2f2f2;
		--sub: #666666;
		--muted: #6f6f6f;
		min-height: 100%;
		background: var(--white);
		color: var(--ink);
		font-family: 'Noto Sans JP', system-ui, sans-serif;
		font-size: 12px;
		line-height: 1.55;
		padding: 0 clamp(0.5rem, 1.6vw, 1.5rem);
	}

	.util-rail {
		display: flex;
		flex-wrap: wrap;
		gap: 0 14px;
		padding: 5px 0;
		font-size: 9px;
		letter-spacing: 0.06em;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
	}
	.ver {
		margin-left: auto;
	}

	.head {
		display: flex;
		align-items: center;
		gap: clamp(0.8rem, 2.5vw, 2rem);
		padding: 9px 0;
		border-bottom: 2px solid var(--ink);
	}
	.mark {
		font-weight: 900;
		font-size: 17px;
		letter-spacing: -0.02em;
		color: var(--ink);
		text-decoration: none;
	}
	.mark span {
		color: var(--red);
	}
	.head nav {
		display: flex;
		gap: 14px;
		margin-right: auto;
	}
	.head nav a {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--ink);
		text-decoration: none;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}
	.head nav a:hover {
		border-bottom-color: var(--red);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 13px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-decoration: none;
		color: var(--white);
		background: var(--red);
		border: 1px solid var(--red);
	}
	.btn:hover {
		background: #c0000f;
	}
	.btn.ghost {
		color: var(--ink);
		background: var(--white);
		border-color: var(--line);
	}
	.btn.ghost:hover {
		background: var(--surface);
	}
	.btn i {
		font-style: normal;
		font-size: 13px;
		line-height: 1;
	}

	/* the module mosaic */
	.mosaic {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 6px;
		padding: 8px 0;
	}
	.mod {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 24px 10px 10px;
		background: var(--white);
		border: 1px solid var(--line);
	}
	/* the small header tab is the module's own label, not a decorative stripe */
	.tab {
		position: absolute;
		top: 0;
		left: 0;
		padding: 3px 8px;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--white);
		background: var(--ink);
	}
	.mod.lead .tab,
	.mod.fig .tab {
		background: var(--red);
	}
	.lead {
		grid-column: span 7;
	}
	.fig {
		grid-column: span 5;
	}
	.stats {
		grid-column: span 4;
	}
	.tools {
		grid-column: span 3;
	}
	.engines {
		grid-column: span 5;
	}

	h1 {
		font-size: clamp(22px, 3vw, 34px);
		font-weight: 900;
		line-height: 1.12;
		letter-spacing: -0.03em;
		margin-top: 4px;
	}
	.lede {
		max-width: 46ch;
		margin-top: 8px;
		font-size: 13px;
		line-height: 1.7;
		color: #2b2b2b;
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 12px;
	}
	.badge {
		padding: 2px 6px;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.06em;
		border: 1px solid var(--line);
		color: var(--sub);
	}
	.badge.red {
		color: var(--white);
		background: var(--red);
		border-color: var(--red);
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: auto;
		padding-top: 12px;
	}

	.fig-stage {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		min-height: 96px;
		padding: 8px 0;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.fig-stage :global(canvas) {
		background: repeating-conic-gradient(#e6e6e6 0% 25%, #f7f7f7 0% 50%) 0 0 / 10px 10px;
		outline: 1px solid var(--line);
	}
	.fig-stage.sm {
		padding: 10px 0;
	}
	.mini {
		width: 100%;
		margin-top: 8px;
		border-collapse: collapse;
	}
	.mini td {
		padding: 3px 6px;
		font-size: 10px;
		border-bottom: 1px solid var(--line);
	}
	.mini td:first-child {
		color: var(--sub);
		letter-spacing: 0.06em;
		width: 6em;
	}
	.v {
		text-align: right;
		font-weight: 700;
	}
	.v.red {
		color: var(--red);
	}

	.stats dl {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-auto-rows: 1fr;
		gap: 1px;
		background: var(--line);
		border: 1px solid var(--line);
	}
	.stats dl > div {
		padding: 7px 8px;
		background: var(--white);
	}
	.stats dt {
		font-size: 9px;
		letter-spacing: 0.06em;
		color: var(--sub);
	}
	.stats dd {
		margin: 1px 0 0;
		display: flex;
		align-items: baseline;
		gap: 3px;
	}
	.stats b {
		font-size: 19px;
		font-weight: 900;
		letter-spacing: -0.03em;
		color: var(--red);
	}
	.stats dd span {
		font-size: 9px;
		color: var(--muted);
	}

	.tools ul {
		flex: 1;
		display: grid;
		grid-auto-rows: 1fr;
		gap: 1px;
		background: var(--line);
		border: 1px solid var(--line);
	}
	.tools li {
		padding: 4px 8px;
		background: var(--white);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.04em;
	}

	.checks {
		display: grid;
		gap: 3px;
		align-content: start;
	}
	.checks li {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}
	.ok {
		padding: 1px 5px;
		font-size: 9px;
		font-weight: 700;
		color: var(--white);
		background: #0a8a3c;
	}
	.note {
		margin-top: 8px;
		font-size: 11px;
		color: var(--sub);
		line-height: 1.6;
	}

	.row {
		padding: 14px 0 0;
	}
	.bar {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 5px 9px;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.1em;
		color: var(--white);
		background: var(--ink);
	}
	.bar span {
		font-size: 10px;
		font-weight: 400;
		letter-spacing: 0.02em;
		color: #cfcfcf;
	}
	.grid-3 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
		margin-top: 8px;
	}
	.wide-note {
		grid-column: 1 / -1;
		margin-top: 2px;
		font-size: 11px;
		color: var(--sub);
		max-width: 90ch;
	}

	.dense {
		width: 100%;
		margin-top: 8px;
		border-collapse: collapse;
		border: 1px solid var(--line);
	}
	.dense th {
		padding: 5px 9px;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-align: left;
		color: var(--sub);
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}
	.dense td {
		padding: 6px 9px;
		font-size: 11.5px;
		border-bottom: 1px solid var(--line);
		vertical-align: baseline;
	}
	.dense .k {
		font-weight: 700;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}
	.dense .c {
		color: var(--sub);
		white-space: nowrap;
	}
	.dense .f {
		color: var(--red);
		font-weight: 500;
		white-space: nowrap;
	}
	.dense .lim {
		color: var(--red);
	}

	.tips {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1px;
		margin-top: 8px;
		background: var(--line);
		border: 1px solid var(--line);
	}
	.tips li {
		display: grid;
		grid-template-columns: 2.6rem 4.4rem 1fr;
		gap: 8px;
		align-items: baseline;
		padding: 7px 9px;
		background: var(--white);
	}
	.tid {
		font-size: 9px;
		font-weight: 700;
		color: var(--red);
	}
	.cat {
		font-size: 9px;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.tips p {
		font-size: 11.5px;
		line-height: 1.55;
	}

	.foot {
		margin-top: 18px;
		padding: 12px 0 10px;
		border-top: 2px solid var(--ink);
	}
	.foot-main {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	@media (max-width: 900px) {
		.lead,
		.fig,
		.stats,
		.tools,
		.engines {
			grid-column: span 12;
		}
		.head nav {
			display: none;
		}
	}
</style>
