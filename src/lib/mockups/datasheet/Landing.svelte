<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const FEATURES = [
		'Frame-by-frame raster editor, 1-bit alpha, indexed palette',
		'Continuous loop playback during edit; no render step',
		'Three views over one session: focus, grid, loop',
		'Onion skin, previous frame red, next frame green',
		'Contextual instruction layer, 26 events, capped and dismissible',
		'Sprite sheet, atlas, GIF, and per-frame PNG output',
		'Local-only storage. No account, no network dependency'
	];

	const RATINGS = [
		['Palette size', '1', '16', '64', 'colors', 'Starter set is 16'],
		['Canvas edge', '1', '32', '512', 'px', 'Square or rectangular'],
		['Frame rate', '1', '8', '24', 'fps', 'Per-document; per-frame override in ms'],
		['Alpha depth', '—', '1', '1', 'bit', 'Thresholded at 128 on import'],
		['Stroke → loop', '—', '0.1', '16', 'ms', 'p95 measured; 16 ms is the budget'],
		['Undo depth', '—', '∞', '∞', 'steps', 'Session-scoped command bus']
	];

	const PINS = [
		['1', 'B', 'PENCIL', 'Place palette color, sizes 1–4 px'],
		['2', 'E', 'ERASER', 'Clear to index 0'],
		['3', 'G', 'FILL', 'Flood fill, 4-connected'],
		['4', 'I', 'PICK', 'Sample index under cursor'],
		['5', 'M', 'SELECT', 'Rectangular region'],
		['6', 'L', 'LASSO', 'Freehand region'],
		['7', 'W', 'WAND', 'Contiguous same-index region'],
		['8', 'P', 'POLYGON', 'Click-placed vertices, Enter to close'],
		['9', 'O', 'ONION', 'Toggle adjacent-frame ghosts'],
		['10', '1/2/3', 'MODE', 'Focus / grid / loop']
	];

	const MODES = [
		['FOCUS', '1', 'Drawing one frame with onion-skin context', 'Comparing many frames at once'],
		['GRID', '2', 'Seeing and editing every frame side by side', 'Detail work on a single frame'],
		['LOOP', '3', 'Judging the motion at full speed', 'You need to draw; switch back to edit']
	];

	const OUTPUTS = [
		['DD-SHEET', 'name.png', 'Uniform-grid sprite sheet'],
		['DD-ATLAS', 'name.json', 'TexturePacker JSON-hash. Verified in stock Phaser'],
		['DD-SPEC', 'name.doodledo.json', 'frameSize, fps, per-frame rects'],
		['DD-GIF', 'name.gif', 'Per-frame delays, index-0 transparency'],
		['DD-FRAMES', 'name-frames.zip', 'One PNG per frame']
	];

	const REVISIONS = [
		['0', 'Rendering spike. Canvas 2D confirmed against the 16 ms budget'],
		['1', 'Editor, palette, frames, layers, undo, autosave, export'],
		['2', 'Selection tools, instruction layer, strip import, offline install'],
		['3', 'Grid and loop views as pure views over one session']
	];
</script>

<div class="mock doc">
	<header class="head">
		<div class="ident">
			<span class="pn">DD&#8209;16</span>
			<div>
				<h1>DOODLE&#8209;DO</h1>
				<p>Frame-sequenced pixel animation device</p>
			</div>
		</div>
		<nav>
			<a href="#desc">1 DESCRIPTION</a><a href="#ratings">2 RATINGS</a><a href="#pins">3 CONTROLS</a>
			<a href="#modes">4 MODES</a><a href="#out">5 OUTPUT</a>
		</nav>
		<a class="act" href="#desc">OPEN THE DEVICE</a>
	</header>

	<section class="desc" id="desc">
		<div class="col">
			<h2><span class="num">1</span>Description</h2>
			<p class="body">
				DD-16 draws animation one frame at a time and plays the result continuously while you
				work. There is no render step and no preview button: the loop is the working surface,
				and every stroke enters it on the next pass.
			</p>
			<p class="body">
				The device teaches while it runs. Twenty-six instruction events fire from real editing
				actions, one at a time, each capped and permanently dismissible. Output is verified
				against stock game engines rather than asserted.
			</p>
			<h3>Features</h3>
			<ul class="features">
				{#each FEATURES as f (f)}
					<li>{f}</li>
				{/each}
			</ul>
			<a class="act big" href="#desc">OPEN THE DEVICE</a>
			<p class="tiny">No account. Nothing uploaded. Runs with the network off.</p>
		</div>

		<div class="col">
			<figure class="fig">
				<figcaption>Figure 1. Functional block diagram</figcaption>
				<svg viewBox="0 0 600 196" role="img" aria-label="Pointer to tool to command to document to compositor, with an undo bus and a loop and export branch">
					{#each [['POINTER', 6], ['TOOL', 126], ['COMMAND', 246], ['DOCUMENT', 366], ['COMPOSITOR', 486]] as [label, x] (label)}
						<rect x={x} y="28" width="102" height="46" class="box" />
						<text x={Number(x) + 51} y="56" class="lbl">{label}</text>
					{/each}
					{#each [108, 228, 348, 468] as x (x)}
						<line x1={x} y1="51" x2={x + 16} y2="51" class="wire" />
						<polygon points="{x + 18},51 {x + 11},47.5 {x + 11},54.5" class="tip" />
					{/each}

					<rect x="246" y="124" width="222" height="42" class="box dash" />
					<text x="357" y="150" class="lbl">UNDO / REDO BUS</text>
					<line x1="417" y1="74" x2="417" y2="124" class="wire" />
					<polygon points="417,76 413.5,83 420.5,83" class="tip" />
					<line x1="297" y1="74" x2="297" y2="122" class="wire" />
					<polygon points="297,124 293.5,117 300.5,117" class="tip" />

					<rect x="486" y="124" width="102" height="42" class="box" />
					<text x="537" y="150" class="lbl">LOOP + OUT</text>
					<line x1="537" y1="74" x2="537" y2="122" class="wire" />
					<polygon points="537,124 533.5,117 540.5,117" class="tip" />

					<text x="6" y="188" class="foot">All stages run on the main thread except GIF and ZIP encoding.</text>
				</svg>
			</figure>

			<figure class="fig events">
				<figcaption>Figure 2. Instruction event, typical</figcaption>
				<div class="event">
					<div class="event-hd"><span class="eid">T02</span><span>fires on: second frame drawn with onion skin active</span></div>
					<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
					<dl class="event-kv">
						<div><dt>CAP</dt><dd>2 occurrences, ever</dd></div>
						<div><dt>PRESENTATION</dt><dd>Toast. Never modal, never stacked</dd></div>
						<div><dt>DISMISS</dt><dd>Per-event, permanent, plus a global off</dd></div>
					</dl>
				</div>
			</figure>

			<figure class="fig sample">
				<figcaption>Figure 3. Typical output, 16 &times; 16, four frames, 8 fps</figcaption>
				<div class="sample-row">
					{#each [0, 1, 2, 3] as i (i)}
						<div class="cell"><Sprite frame={i} scale={4} /><span>{i + 1}</span></div>
					{/each}
					<div class="cell live"><Sprite playing scale={4} /><span>LOOP</span></div>
				</div>
			</figure>
		</div>
	</section>

	<section class="block" id="ratings">
		<h2><span class="num">2</span>Operating ratings</h2>
		<table>
			<thead>
				<tr><th>Parameter</th><th>Min</th><th>Typ</th><th>Max</th><th>Unit</th><th>Conditions</th></tr>
			</thead>
			<tbody>
				{#each RATINGS as r (r[0])}
					<tr>
						<td class="name">{r[0]}</td><td class="n">{r[1]}</td><td class="n typ">{r[2]}</td>
						<td class="n">{r[3]}</td><td class="unit">{r[4]}</td><td class="cond">{r[5]}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="tiny">
			Stroke-to-loop is the p95 of the project's own performance harness, measured in headless
			Chromium against a 16 ms frame budget.
		</p>
	</section>

	<section class="block" id="pins">
		<h2><span class="num">3</span>Control assignments</h2>
		<table>
			<thead><tr><th>No.</th><th>Key</th><th>Name</th><th>Function</th></tr></thead>
			<tbody>
				{#each PINS as p (p[0])}
					<tr><td class="n">{p[0]}</td><td class="key">{p[1]}</td><td class="name">{p[2]}</td><td class="cond">{p[3]}</td></tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="block" id="modes">
		<h2><span class="num">4</span>Operating modes</h2>
		<p class="body wide">
			The three views are the same session, not three documents. Switching preserves the document,
			current frame, zoom, and palette. The limits column is printed because a device that only
			documents its strengths is a brochure.
		</p>
		<table>
			<thead><tr><th>Mode</th><th>Key</th><th>Intended use</th><th>Known limit</th></tr></thead>
			<tbody>
				{#each MODES as m (m[0])}
					<tr>
						<td class="name">{m[0]}</td><td class="key">{m[1]}</td><td class="cond">{m[2]}</td>
						<td class="cond limit">{m[3]}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="block" id="out">
		<h2><span class="num">5</span>Output formats</h2>
		<table>
			<thead><tr><th>Designation</th><th>File</th><th>Description</th></tr></thead>
			<tbody>
				{#each OUTPUTS as o (o[0])}
					<tr><td class="name">{o[0]}</td><td class="key file">{o[1]}</td><td class="cond">{o[2]}</td></tr>
				{/each}
			</tbody>
		</table>
		<p class="tiny">
			Sheet export is exercised by two verification runs: one loads a real export in stock Phaser,
			the other imports it into stock Godot through engine primitives. Stock Godot ships no
			TexturePacker importer, so the Godot path uses raw PNG plus the JSON-hash atlas.
		</p>
	</section>

	<footer class="ctl">
		<div class="ctl-grid">
			<div>
				<h3>Revision history</h3>
				<table class="rev">
					<tbody>
						{#each REVISIONS as [n, what] (n)}
							<tr><td class="n">{n}</td><td class="cond">{what}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="ctl-act">
				<h3>Get the device</h3>
				<p class="body">
					It runs in the browser and installs for offline use. Work autosaves locally; a project
					file on disk is the only copy you own.
				</p>
				<a class="act big" href="#desc">OPEN THE DEVICE</a>
			</div>
		</div>
		<p class="stamp">
			DD&#8209;16 &nbsp;&middot;&nbsp; DOODLE&#8209;DO &nbsp;&middot;&nbsp; Artwork in figure 2 is a
			four-frame walk cycle authored for this document from the sixteen-color starter palette.
		</p>
	</footer>
</div>

<style>
	.doc {
		--paper: #eef1f3;
		--paper-2: #e2e7ea;
		--ink: #12181c;
		--ink-2: #4d5860;
		--rule: #b6c0c6;
		--cyan: #007f8d;
		--cyan-ink: #005a65;
		min-height: 100%;
		background: var(--paper);
		color: var(--ink);
		font-family: Barlow, system-ui, sans-serif;
		padding: 0 clamp(1rem, 4vw, 4rem) clamp(2rem, 4vw, 3rem);
	}
	.body {
		font-size: 0.9375rem;
		line-height: 1.62;
		color: #2a343a;
		max-width: 62ch;
	}
	.body + .body {
		margin-top: 0.9rem;
	}
	.body.wide {
		max-width: 74ch;
		margin-top: 1rem;
	}
	.tiny {
		margin-top: 0.9rem;
		font-size: 0.75rem;
		line-height: 1.55;
		color: var(--ink-2);
		max-width: 74ch;
	}

	/* ---------- head ---------- */
	.head {
		display: flex;
		align-items: center;
		gap: clamp(1rem, 3vw, 2.5rem);
		padding: 1.3rem 0 1rem;
		border-bottom: 3px solid var(--ink);
	}
	.ident {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}
	.pn {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.02em;
		color: var(--paper);
		background: var(--ink);
		padding: 0.45rem 0.55rem;
	}
	h1 {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: clamp(0.9375rem, 1.7vw, 1.25rem);
		font-weight: 800;
		letter-spacing: -0.03em;
	}
	.ident p {
		font-size: 0.75rem;
		color: var(--ink-2);
		margin-top: 2px;
	}
	.head nav {
		display: flex;
		gap: clamp(0.7rem, 1.8vw, 1.5rem);
		margin-right: auto;
	}
	.head nav a {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5625rem;
		letter-spacing: -0.02em;
		color: var(--ink-2);
		text-decoration: none;
		padding-bottom: 3px;
		border-bottom: 2px solid transparent;
	}
	.head nav a:hover {
		color: var(--ink);
		border-bottom-color: var(--cyan);
	}

	.act {
		display: inline-flex;
		align-items: center;
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-decoration: none;
		color: var(--paper);
		background: var(--cyan);
		padding: 0.7rem 1.1rem;
		border: 1px solid var(--cyan-ink);
		transition: background 110ms cubic-bezier(0.2, 0, 0, 1);
	}
	.act:hover {
		background: var(--cyan-ink);
	}
	.act.big {
		margin-top: 1.6rem;
		padding: 0.95rem 1.6rem;
		font-size: 0.75rem;
	}

	/* ---------- description ---------- */
	.desc {
		display: grid;
		grid-template-columns: minmax(300px, 1fr) minmax(320px, 1.05fr);
		gap: clamp(1.5rem, 4vw, 3.5rem);
		padding: clamp(2rem, 4vw, 3.2rem) 0;
	}
	h2 {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: clamp(0.9375rem, 1.6vw, 1.1875rem);
		font-weight: 800;
		letter-spacing: -0.035em;
		padding-bottom: 0.6rem;
		border-bottom: 2px solid var(--ink);
		margin-bottom: 1.1rem;
	}
	.num {
		display: grid;
		place-items: center;
		width: 1.5em;
		height: 1.5em;
		font-size: 0.75rem;
		color: var(--paper);
		background: var(--cyan);
	}
	h3 {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		color: var(--cyan-ink);
		margin-top: 1.6rem;
		padding-bottom: 0.45rem;
		border-bottom: 1px solid var(--rule);
	}
	.features {
		margin-top: 0.85rem;
	}
	.features li {
		position: relative;
		padding: 0.32rem 0 0.32rem 1.15rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #2a343a;
	}
	.features li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.72em;
		width: 6px;
		height: 6px;
		background: var(--cyan);
	}

	.fig {
		background: #fff;
		border: 1px solid var(--rule);
		padding: 1rem;
	}
	.fig + .fig {
		margin-top: 1rem;
	}
	figcaption {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5625rem;
		letter-spacing: -0.02em;
		color: var(--ink-2);
		margin-bottom: 0.9rem;
	}
	.fig svg {
		width: 100%;
		height: auto;
	}
	.box {
		fill: var(--paper-2);
		stroke: var(--ink);
		stroke-width: 1.5;
	}
	.box.dash {
		fill: #fff;
		stroke: var(--cyan);
		stroke-dasharray: 5 3;
	}
	.lbl {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: -0.04em;
		text-anchor: middle;
		fill: var(--ink);
	}
	.wire {
		stroke: var(--ink);
		stroke-width: 1.5;
	}
	.tip {
		fill: var(--ink);
	}
	.foot {
		font-family: Barlow, sans-serif;
		font-size: 10px;
		fill: var(--ink-2);
	}
	.event-hd {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.6rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid var(--rule);
		font-size: 0.75rem;
		color: var(--ink-2);
	}
	.eid {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.625rem;
		color: #fff;
		background: var(--cyan);
		padding: 0.15rem 0.35rem;
	}
	.event > p {
		margin: 0.75rem 0 0;
		font-size: 0.9375rem;
		line-height: 1.55;
		color: #2a343a;
	}
	.event-kv {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.7rem 1.2rem;
		margin-top: 1rem;
	}
	.event-kv dt {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5rem;
		letter-spacing: -0.02em;
		color: var(--ink-2);
	}
	.event-kv dd {
		margin: 3px 0 0;
		font-size: 0.75rem;
		color: #2a343a;
	}
	.sample-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}
	.cell :global(canvas) {
		background: repeating-conic-gradient(#e2e7ea 0% 25%, #f4f7f8 0% 50%) 0 0 / 8px 8px;
		outline: 1px solid var(--rule);
	}
	.cell span {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5rem;
		color: var(--ink-2);
	}
	.cell.live :global(canvas) {
		outline: 2px solid var(--cyan);
	}
	.cell.live span {
		color: var(--cyan-ink);
	}

	/* ---------- tables ---------- */
	.block {
		padding: clamp(2rem, 4vw, 3.2rem) 0;
		border-top: 1px solid var(--rule);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1.1rem;
		background: #fff;
		border: 1px solid var(--rule);
		font-variant-numeric: tabular-nums;
	}
	th {
		padding: 0.5rem 0.75rem;
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5625rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-align: left;
		color: var(--paper);
		background: var(--ink);
	}
	td {
		padding: 0.55rem 0.75rem;
		font-size: 0.8125rem;
		border-bottom: 1px solid #dfe5e8;
		vertical-align: baseline;
	}
	tbody tr:nth-child(even) td {
		background: #f6f8f9;
	}
	.name {
		font-weight: 600;
	}
	.n,
	.unit {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.6875rem;
		white-space: nowrap;
	}
	.n {
		text-align: right;
	}
	.typ {
		color: var(--cyan-ink);
		font-weight: 600;
	}
	.unit {
		color: var(--ink-2);
	}
	.cond {
		color: #2a343a;
	}
	.limit {
		color: var(--cyan-ink);
	}
	.key {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.6875rem;
		white-space: nowrap;
	}
	.file {
		color: var(--cyan-ink);
	}

	/* ---------- control block ---------- */
	.ctl {
		padding-top: clamp(2rem, 4vw, 3rem);
		border-top: 3px solid var(--ink);
	}
	.ctl-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: clamp(1.5rem, 4vw, 3.5rem);
	}
	.ctl h3 {
		margin-top: 0;
	}
	.rev {
		margin-top: 0.9rem;
	}
	.rev td:first-child {
		width: 3ch;
		color: var(--cyan-ink);
		font-weight: 600;
	}
	.ctl-act .body {
		margin-top: 0.9rem;
	}
	.stamp {
		margin-top: 2.4rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--rule);
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5625rem;
		line-height: 1.7;
		letter-spacing: -0.02em;
		color: var(--ink-2);
	}

	@media (max-width: 900px) {
		.desc {
			grid-template-columns: 1fr;
		}
		.head nav {
			display: none;
		}
		.cond {
			font-size: 0.75rem;
		}
	}
</style>
