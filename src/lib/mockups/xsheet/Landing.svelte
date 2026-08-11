<script lang="ts">
	import Sprite from '../Sprite.svelte';

	// The sheet's own rows. Frames 1-4 are drawn; the rest is the empty ruling
	// every exposure sheet carries, which is what makes a filled one read as work.
	const ROWS = 10;
	const DRAWN = 4;
	const ACTION = ['contact', 'passing, up 1px', 'contact, other foot', 'passing, down 1px'];
	const CAMERA = ['HOLD 1', '', '', 'LOOP → 01'];

	const MODES = [
		{ n: 'FOCUS', k: '1', great: 'Drawing one frame with onion-skin context.', bad: 'Comparing many frames at once.' },
		{ n: 'GRID', k: '2', great: 'Seeing and editing every frame side by side.', bad: 'Detail work on a single frame.' },
		{ n: 'LOOP', k: '3', great: 'Judging the motion at full speed.', bad: 'You need to draw. Switch back to edit.' }
	];

	const NOTES = [
		{ id: 'T02', copy: 'The red ghost is your previous frame. Draw where things have moved to, not where they were.' },
		{ id: 'T03', copy: 'Duplicating and nudging is how most animation actually gets made. Small changes between frames read as smooth motion.' },
		{ id: 'T10', copy: "Longer isn't always better. A tight 4-frame loop often reads better than a loose 8." },
		{ id: 'T15', copy: 'Your work autosaves in the browser, but a project file on disk is the only copy you truly own.' }
	];

	const DELIVERY = [
		['01', 'name.png', 'Sprite sheet, uniform grid'],
		['02', 'name.json', 'TexturePacker JSON-hash atlas'],
		['03', 'name.doodledo.json', 'frameSize, fps, per-frame rects'],
		['04', 'name.gif', 'Animated, per-frame delays'],
		['05', 'name-frames.zip', 'One PNG per frame']
	];
</script>

<div class="mock sheet">
	<div class="pegbar" aria-hidden="true">
		<span class="peg round"></span><span class="peg bar"></span><span class="peg round"></span>
	</div>

	<div class="page">
		<header class="masthead">
			<div class="stamp">
				<strong>DOODLE&#8209;DO</strong>
				<span>EXPOSURE SHEET &nbsp;/&nbsp; PIXEL ANIMATION</span>
			</div>
			<nav>
				<a href="#sheet">SHEET</a><a href="#modes">MODES</a><a href="#notes">NOTES</a><a href="#delivery">DELIVERY</a>
			</nav>
			<a class="ink-btn" href="#sheet">START DRAWING</a>
		</header>

		<section class="hero" id="sheet">
			<div class="pitch">
				<h1>Every frame gets a row.<br />Every row gets a reason.</h1>
				<p class="lede">
					Frame-by-frame pixel animation in the browser. The loop plays while you draw, and the
					tool writes the animation notes in the margin as you go.
				</p>
				<div class="cta">
					<a class="ink-btn solid" href="#sheet">START DRAWING</a>
					<a class="ink-btn" href="#delivery">SEE THE DELIVERY</a>
				</div>
				<p class="pencil">no account &middot; nothing uploaded &middot; works with the wifi off</p>
			</div>

			<figure class="xsheet">
				<table>
					<caption class="sr-only">Exposure sheet for a four-frame walk cycle</caption>
					<thead>
						<tr>
							<th class="c-no">NO.</th>
							<th class="c-draw">DRAWING</th>
							<th class="c-act">ACTION</th>
							<th class="c-ms">MS</th>
							<th class="c-cam">CAMERA</th>
						</tr>
					</thead>
					<tbody>
						{#each { length: ROWS } as _, i (i)}
							<tr class:beat={i % 4 === 0} class:empty={i >= DRAWN}>
								<td class="c-no">{String(i + 1).padStart(2, '0')}</td>
								<td class="c-draw">
									{#if i < DRAWN}<Sprite frame={i} scale={2} />{/if}
								</td>
								<td class="c-act hand">{ACTION[i] ?? ''}</td>
								<td class="c-ms">{i < DRAWN ? '125' : ''}</td>
								<td class="c-cam">{CAMERA[i] ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<figcaption>
					<span class="hand">4 drawings @ 8 fps = a walk that never stops</span>
					<Sprite playing scale={4} />
				</figcaption>
			</figure>
		</section>

		<section class="block" id="modes">
			<h2><span class="rule"></span>THREE VIEWS, ONE SESSION</h2>
			<p class="intro">
				Focus, Grid, and Loop are the same document seen three ways. Switch and your frame, zoom,
				palette, and history are where you left them. Each one is printed with what it is bad at,
				because a sheet that only lists strengths is a sales sheet.
			</p>
			<div class="modes">
				{#each MODES as m (m.n)}
					<article>
						<h3>{m.n}<i>KEY {m.k}</i></h3>
						<dl>
							<dt>GREAT AT</dt>
							<dd>{m.great}</dd>
							<dt class="warn">STRAINS WHEN</dt>
							<dd class="warn-body">{m.bad}</dd>
						</dl>
					</article>
				{/each}
			</div>
		</section>

		<section class="block" id="notes">
			<h2><span class="rule"></span>NOTES IN THE MARGIN</h2>
			<p class="intro">
				Twenty-six of them, wired to what you just did. One at a time, never a dialog, each one
				capped so it stops on its own, and every one dismissible forever.
			</p>
			<ul class="notes">
				{#each NOTES as n (n.id)}
					<li>
						<span class="ref">{n.id}</span>
						<p class="hand">{n.copy}</p>
					</li>
				{/each}
			</ul>
		</section>

		<section class="block" id="delivery">
			<h2><span class="rule"></span>DELIVERY</h2>
			<p class="intro">
				Export is checked against the engines, not asserted: one test loads a real export in stock
				Phaser, another imports it into stock Godot, and both run on every change.
			</p>
			<table class="docket">
				<thead>
					<tr><th>ITEM</th><th>FILE</th><th>CONTENTS</th></tr>
				</thead>
				<tbody>
					{#each DELIVERY as [no, file, what] (no)}
						<tr><td>{no}</td><td class="file">{file}</td><td>{what}</td></tr>
					{/each}
				</tbody>
			</table>
		</section>

		<footer class="approval">
			<div class="approval-body">
				<dl class="spec">
					<div><dt>PALETTE</dt><dd>16 to start, 64 ceiling</dd></div>
					<div><dt>ALPHA</dt><dd>1&#8209;bit. No soft edges</dd></div>
					<div><dt>STROKE &rarr; LOOP</dt><dd>0.1 ms p95 / 16 ms budget</dd></div>
					<div><dt>STORAGE</dt><dd>Local autosave + file on disk</dd></div>
				</dl>
				<div class="chop">
					<span class="hand">approved</span>
					<span class="chop-mark">DD</span>
				</div>
			</div>
			<a class="ink-btn solid big" href="#sheet">START DRAWING</a>
			<p class="colophon">
				Drawing shown is a four-frame walk cycle authored for this sheet, from the sixteen-color
				starter palette.
			</p>
		</footer>
	</div>
</div>

<style>
	.sheet {
		--paper: #e9e1cf;
		--paper-2: #f1ebdc;
		--ink: #2b2721;
		--ink-2: #5c574e;
		--rule: #9aa9ad;
		--rule-soft: #c3c8bd;
		--red: #c8352b;
		--fibre: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E");
		display: flex;
		min-height: 100%;
		background-color: var(--paper);
		background-image: var(--fibre);
		color: var(--ink);
		font-family: 'Courier Prime', ui-monospace, monospace;
		font-size: 0.875rem;
	}
	.hand {
		font-family: Caveat, 'Courier Prime', cursive;
		font-size: 1.15em;
		color: var(--ink-2);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	/* ---------- peg bar ---------- */
	.pegbar {
		align-self: stretch;
		width: clamp(26px, 3vw, 44px);
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: clamp(20px, 4vh, 46px);
		padding-top: clamp(60px, 12vh, 140px);
		background: linear-gradient(90deg, #ded5c1, #e9e1cf 70%);
		border-right: 1px solid var(--rule-soft);
	}
	/* punched holes, not printed dots: the shadow reads through the sheet */
	.peg {
		background: #b0a693;
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.55),
			inset 0 -1px 0 rgba(255, 255, 255, 0.5),
			0 1px 0 rgba(255, 255, 255, 0.45);
	}
	.peg.round {
		width: 13px;
		height: 13px;
		border-radius: 50%;
	}
	.peg.bar {
		width: 26px;
		height: 12px;
		border-radius: 6px;
	}

	.page {
		flex: 1;
		min-width: 0;
		padding: 0 clamp(1.2rem, 4vw, 4rem);
	}

	/* ---------- masthead ---------- */
	.masthead {
		display: flex;
		align-items: center;
		gap: clamp(1rem, 3vw, 2.5rem);
		padding: 1.4rem 0 1.1rem;
		border-bottom: 2px solid var(--ink);
	}
	.stamp {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 0.4rem 0.7rem;
		border: 2px solid var(--red);
		border-radius: 2px;
		color: var(--red);
		transform: rotate(-1.2deg);
	}
	.stamp strong {
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: 0.06em;
	}
	.stamp span {
		font-size: 0.5625rem;
		letter-spacing: 0.16em;
	}
	.masthead nav {
		display: flex;
		gap: clamp(0.8rem, 2vw, 1.8rem);
		margin-right: auto;
	}
	.masthead nav a {
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		color: var(--ink-2);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		padding-bottom: 2px;
	}
	.masthead nav a:hover {
		color: var(--ink);
		border-bottom-color: var(--red);
	}

	.ink-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.05rem;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-decoration: none;
		color: var(--ink);
		background: var(--paper-2);
		border: 1.5px solid var(--ink);
		border-radius: 2px;
		transition: background 120ms cubic-bezier(0.2, 0, 0, 1);
	}
	.ink-btn:hover {
		background: #ded5c1;
	}
	.ink-btn.solid {
		color: var(--paper-2);
		background: var(--red);
		border-color: var(--red);
	}
	.ink-btn.solid:hover {
		background: #a92a22;
	}
	.ink-btn.big {
		padding: 0.85rem 1.5rem;
		font-size: 0.8125rem;
	}

	/* ---------- hero ---------- */
	.hero {
		display: grid;
		grid-template-columns: minmax(280px, 27rem) 1fr;
		gap: clamp(2rem, 4vw, 4rem);
		align-items: start;
		padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(2rem, 4vw, 3.5rem);
	}
	h1 {
		font-size: clamp(1.85rem, 3.4vw, 2.9rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.025em;
		text-wrap: balance;
	}
	.lede {
		margin-top: 1.3rem;
		max-width: 40ch;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.9rem;
	}
	.pencil {
		margin-top: 1.1rem;
		font-family: Caveat, cursive;
		font-size: 1.15rem;
		color: var(--ink-2);
		transform: rotate(-0.6deg);
	}

	.xsheet {
		background: var(--paper-2);
		border: 1px solid var(--rule);
		box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06), 0 14px 30px rgba(60, 50, 30, 0.13);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	.xsheet th {
		padding: 0.5rem 0.5rem;
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-align: left;
		color: var(--ink);
		background: #ded5c1;
		border-bottom: 1.5px solid var(--ink);
	}
	.xsheet td {
		padding: 0.28rem 0.5rem;
		border-bottom: 1px solid var(--rule-soft);
		border-right: 1px solid var(--rule-soft);
		font-size: 0.75rem;
		vertical-align: middle;
	}
	.xsheet tr.beat td {
		border-top: 1.5px solid var(--rule);
	}
	.xsheet tr.empty td {
		height: 1.7rem;
	}
	.c-no {
		width: 3ch;
		color: var(--ink-2);
	}
	.c-draw {
		width: 44px;
	}
	.c-draw :global(canvas) {
		background: repeating-conic-gradient(#e2dac6 0% 25%, #efe9da 0% 50%) 0 0 / 8px 8px;
		outline: 1px solid var(--rule-soft);
	}
	.c-ms {
		width: 5ch;
		text-align: right;
		color: var(--ink-2);
	}
	.c-cam {
		width: 13ch;
		color: var(--red);
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		border-right: none !important;
		border-left: 2px solid var(--red);
	}
	figcaption {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 0.8rem;
		border-top: 1.5px solid var(--ink);
		background: #ded5c1;
	}
	figcaption :global(canvas) {
		background: repeating-conic-gradient(#d5ccb7 0% 25%, #e2dac6 0% 50%) 0 0 / 8px 8px;
		outline: 1px solid var(--rule);
	}

	/* ---------- blocks ---------- */
	.block {
		padding: clamp(2.5rem, 5vw, 4.5rem) 0;
		border-top: 1px solid var(--rule);
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: clamp(0.9375rem, 1.6vw, 1.125rem);
		font-weight: 700;
		letter-spacing: 0.2em;
	}
	h2 .rule {
		width: 34px;
		height: 0;
		flex: none;
		border-top: 3px solid var(--red);
	}
	.intro {
		max-width: 68ch;
		margin-top: 1rem;
		line-height: 1.65;
		color: var(--ink-2);
	}

	.modes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: clamp(1rem, 2vw, 1.6rem);
		margin-top: 2.2rem;
	}
	.modes article {
		background: var(--paper-2);
		border: 1px solid var(--rule);
		padding: 1.1rem;
	}
	h3 {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.6rem;
		padding-bottom: 0.7rem;
		margin-bottom: 0.9rem;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		border-bottom: 1.5px solid var(--ink);
	}
	h3 i {
		font-style: normal;
		font-size: 0.5625rem;
		letter-spacing: 0.14em;
		color: var(--ink-2);
	}
	dt {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--ink-2);
	}
	dt.warn {
		margin-top: 0.9rem;
		color: var(--red);
	}
	dd {
		margin: 0.3rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	.warn-body {
		color: var(--ink-2);
	}

	.notes {
		margin-top: 2.2rem;
	}
	.notes {
		border-top: 1px solid var(--rule);
	}
	.notes li {
		display: grid;
		grid-template-columns: 5.5rem 1fr;
		align-items: start;
		background: var(--paper-2);
		border-bottom: 1px solid var(--rule-soft);
	}
	.ref {
		align-self: stretch;
		padding: 0.9rem 1rem;
		font-size: 0.625rem;
		letter-spacing: 0.14em;
		color: var(--red);
		background: #e3d9c4;
		border-right: 1px solid var(--red);
	}
	.notes p {
		padding: 0.85rem 1.1rem;
	}
	.notes p {
		font-size: 1.0625rem;
		line-height: 1.45;
		max-width: 70ch;
	}

	.docket {
		margin-top: 2.2rem;
		background: var(--paper-2);
		border: 1px solid var(--rule);
	}
	.docket th {
		padding: 0.55rem 0.8rem;
		font-size: 0.5625rem;
		letter-spacing: 0.16em;
		text-align: left;
		background: #ded5c1;
		border-bottom: 1.5px solid var(--ink);
	}
	.docket td {
		padding: 0.6rem 0.8rem;
		font-size: 0.8125rem;
		border-bottom: 1px solid var(--rule-soft);
	}
	.docket td:first-child {
		color: var(--ink-2);
		width: 4ch;
	}
	.file {
		font-weight: 700;
	}

	/* ---------- approval ---------- */
	.approval {
		padding: clamp(2.5rem, 5vw, 4rem) 0 clamp(2rem, 4vw, 3rem);
		border-top: 2px solid var(--ink);
	}
	.approval-body {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}
	.spec {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.9rem 2rem;
		flex: 1;
		min-width: 260px;
	}
	.spec dt {
		font-size: 0.5625rem;
	}
	.spec dd {
		font-size: 0.75rem;
		color: var(--ink);
	}
	.chop {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}
	.chop-mark {
		display: grid;
		place-items: center;
		width: 58px;
		height: 58px;
		border: 2.5px solid var(--red);
		border-radius: 50%;
		color: var(--red);
		font-weight: 700;
		font-size: 1.3rem;
		letter-spacing: 0.06em;
		transform: rotate(-8deg);
		opacity: 0.85;
	}
	.approval .ink-btn {
		margin-top: 2rem;
	}
	.colophon {
		margin-top: 1.6rem;
		font-size: 0.6875rem;
		color: #7d786e;
		max-width: 70ch;
	}

	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.masthead nav {
			display: none;
		}
		.c-act {
			display: none;
		}
	}
</style>
