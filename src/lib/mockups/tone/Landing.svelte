<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const MODES = [
		{ n: 'FOCUS', k: '1', great: 'Drawing one frame with onion-skin context.', bad: 'Comparing many frames at once.' },
		{ n: 'GRID', k: '2', great: 'Seeing and editing every frame side by side.', bad: 'Detail work on a single frame.' },
		{ n: 'LOOP', k: '3', great: 'Judging the motion at full speed.', bad: 'You need to draw. Switch back to edit.' }
	];

	const LINES = [
		{ id: 'T02', copy: 'The red ghost is your previous frame. Draw where things have moved to, not where they were.' },
		{ id: 'T09', copy: 'Classic pixel animation often runs at 6-10 FPS. Smoothness comes from good in-betweens, not speed.' },
		{ id: 'T06', copy: 'Great pixel art usually uses surprisingly few colors. Limits make choices easier.' },
		{ id: 'T15', copy: 'A project file on disk is the only copy you truly own.' }
	];

	const SHIPS = [
		['SHEET', 'PNG sprite sheet on a uniform grid'],
		['ATLAS', 'TexturePacker JSON-hash. Loads in stock Phaser'],
		['SPEC', 'doodledo.json: frameSize, fps, per-frame rects'],
		['GIF', 'Animated, per-frame delays, index-0 alpha'],
		['ZIP', 'One PNG per frame']
	];

	const RATES = [
		[4, 'Every pose readable. Reads as a stomp.'],
		[8, 'The classic rate. Four drawings is enough.'],
		[16, 'Smoother, and twice the drawing.']
	] as const;
</script>

<div class="mock page">
	<header class="chapter">
		<div class="logo">
			<span class="kanji" aria-hidden="true">週刊</span>
			<h1 class="wordmark">DOODLE&#8209;DO</h1>
		</div>
		<p class="chapno">CH. 01 &mdash; THE LOOP THAT WOULD NOT STOP</p>
		<nav>
			<a href="#rate">RATE</a><a href="#modes">MODES</a><a href="#lines">LINES</a><a href="#ships">SHIPS</a>
		</nav>
	</header>

	<section class="spread" id="top">
		<article class="panel hero-panel">
			<div class="speed" aria-hidden="true"></div>
			<div class="hero-body">
				<h2 class="shout">
					<span>YOU DRAW ONE</span>
					<span>FRAME.</span>
					<span class="inv">THE LOOP ALREADY</span>
					<span class="inv">HAS IT.</span>
				</h2>
				<p class="dialogue">
					Frame-by-frame pixel animation in the browser. Playback never stops while you work,
					so every stroke lands in a running loop instead of a still image.
				</p>
				<div class="cta">
					<a class="tag solid" href="#top">START DRAWING</a>
					<a class="tag" href="#ships">SEE WHAT SHIPS</a>
				</div>
			</div>
			<div class="hero-stage">
				<div class="ground tone-30" aria-hidden="true"></div>
				<Sprite playing scale={15} />
				<svg class="sfx" viewBox="0 0 260 70" aria-hidden="true">
					<text x="4" y="52" class="sfx-text">TMP TMP TMP</text>
				</svg>
			</div>
			<span class="pageno">01</span>
		</article>

		<aside class="panel gutter-note">
			<p class="small">
				No account. Nothing uploaded. No AI. Installs and runs with the network off.
			</p>
		</aside>
	</section>

	<section class="strip" id="rate">
		<h3 class="heading">FRAME RATE IS NOT SMOOTHNESS</h3>
		<p class="lede">
			The same four drawings, clocked three ways. Nothing was redrawn between these panels; only
			the rate changed.
		</p>
		<div class="panels three">
			{#each RATES as [fps, note] (fps)}
				<figure class="panel">
					<div class="stage tone-10">
						<Sprite playing {fps} scale={6} />
					</div>
					<figcaption>
						<strong>{fps} FPS</strong>
						<span>{note}</span>
					</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section class="strip" id="modes">
		<h3 class="heading">THREE VIEWS. ONE SESSION.</h3>
		<p class="lede">
			Focus, Grid, and Loop are the same document seen three ways. Switch and your frame, zoom,
			palette, and history are where you left them. Each panel prints what it is bad at.
		</p>
		<div class="panels three">
			{#each MODES as m (m.n)}
				<article class="panel mode">
					<header class="mode-head tone-60">
						<span>{m.n}</span><i>{m.k}</i>
					</header>
					<dl>
						<dt>GREAT AT</dt>
						<dd>{m.great}</dd>
						<dt class="inv">STRAINS WHEN</dt>
						<dd>{m.bad}</dd>
					</dl>
				</article>
			{/each}
		</div>
	</section>

	<section class="strip" id="lines">
		<h3 class="heading">THE TOOL HAS LINES</h3>
		<p class="lede">
			Twenty-six of them, wired to what you just did. One at a time, never a dialog, capped so they
			stop on their own, and every one dismissible forever.
		</p>
		<ul class="bubbles">
			{#each LINES as l (l.id)}
				<li>
					<div class="bubble">
						<p>{l.copy}</p>
						<span class="tail" aria-hidden="true"></span>
					</div>
					<span class="cue">{l.id}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="strip" id="ships">
		<h3 class="heading">WHAT SHIPS</h3>
		<p class="lede">
			Export is checked against the engines, not asserted: one test loads a real export in stock
			Phaser, another imports it into stock Godot, and both run on every change.
		</p>
		<ul class="ships">
			{#each SHIPS as [k, v] (k)}
				<li><strong>{k}</strong><span>{v}</span></li>
			{/each}
		</ul>
	</section>

	<footer class="colophon">
		<div class="close-panel">
			<h3 class="shout small-shout">START DRAWING</h3>
			<a class="tag solid big" href="#top">OPEN THE EDITOR</a>
		</div>
		<dl class="spec">
			<div><dt>PALETTE</dt><dd>16 to start, 64 ceiling</dd></div>
			<div><dt>ALPHA</dt><dd>1-bit. No soft edges</dd></div>
			<div><dt>STROKE &rarr; LOOP</dt><dd>0.1 ms p95 / 16 ms budget</dd></div>
			<div><dt>STORAGE</dt><dd>Local autosave + file on disk</dd></div>
		</dl>
		<p class="fine">
			Drawing shown is a four-frame walk cycle authored for this page, from the sixteen-color
			starter palette.
		</p>
	</footer>
</div>

<style>
	.page {
		--paper: #f2efe6;
		--paper-2: #e9e5d9;
		--ink: #111111;
		--gray: #6a675f;
		--dot: #111111;
		--newsprint: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f)' opacity='0.42'/%3E%3C/svg%3E");
		min-height: 100%;
		background-color: var(--paper);
		background-image: var(--newsprint);
		color: var(--ink);
		font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
		padding: 0 clamp(0.9rem, 3vw, 3rem) clamp(2rem, 4vw, 3rem);
		overflow-x: hidden;
	}

	/* halftone: real dot pitches, not a gray fill */
	.tone-10 {
		background-image: radial-gradient(circle at 50% 50%, var(--dot) 1.1px, transparent 1.2px);
		background-size: 6px 6px;
	}
	.tone-30 {
		background-image: radial-gradient(circle at 50% 50%, var(--dot) 1.9px, transparent 2px);
		background-size: 6px 6px;
	}
	.tone-60 {
		background-image: radial-gradient(circle at 50% 50%, var(--dot) 2.9px, transparent 3px);
		background-size: 6px 6px;
	}

	.panel {
		background: var(--paper);
		border: 2.5px solid var(--ink);
		position: relative;
	}

	/* ---------- chapter head ---------- */
	.chapter {
		display: flex;
		align-items: flex-end;
		gap: clamp(1rem, 3vw, 2.5rem);
		padding: 1.5rem 0 1rem;
		border-bottom: 4px solid var(--ink);
	}
	.logo {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}
	.kanji {
		font-size: 0.875rem;
		font-weight: 700;
		writing-mode: vertical-rl;
		color: var(--paper);
		background: var(--ink);
		padding: 0.35rem 0.15rem;
		letter-spacing: 0.1em;
	}
	.wordmark {
		font-size: clamp(1.5rem, 3.2vw, 2.4rem);
		font-weight: 900;
		letter-spacing: -0.03em;
		line-height: 0.9;
	}
	.chapno {
		flex: 1;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--gray);
		padding-bottom: 0.35rem;
	}
	.chapter nav {
		display: flex;
		gap: 1.1rem;
		padding-bottom: 0.35rem;
	}
	.chapter nav a {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--ink);
		text-decoration: none;
		border-bottom: 2px solid transparent;
	}
	.chapter nav a:hover {
		border-bottom-color: var(--ink);
	}

	/* ---------- tags (the only buttons) ---------- */
	.tag {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 1.15rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-decoration: none;
		color: var(--ink);
		background: var(--paper);
		border: 2.5px solid var(--ink);
		transition: transform 110ms cubic-bezier(0.2, 0, 0, 1);
	}
	.tag.solid {
		color: var(--paper);
		background: var(--ink);
	}
	.tag:hover {
		transform: translate(-1px, -1px);
	}
	.tag.big {
		padding: 0.95rem 1.7rem;
		font-size: 0.875rem;
	}

	/* ---------- hero spread ---------- */
	.spread {
		display: grid;
		gap: 10px;
		padding: clamp(1rem, 2.5vw, 2rem) 0;
	}
	.hero-panel {
		display: grid;
		grid-template-columns: minmax(280px, 1fr) minmax(240px, 0.85fr);
		gap: clamp(1.2rem, 3vw, 2.5rem);
		align-items: center;
		padding: clamp(1.4rem, 3.5vw, 3rem);
		overflow: hidden;
	}
	.speed {
		position: absolute;
		inset: -30%;
		left: 42%;
		background: repeating-conic-gradient(
			from 0deg at 62% 52%,
			var(--ink) 0deg 0.16deg,
			transparent 0.16deg 1.15deg
		);
		-webkit-mask-image: radial-gradient(ellipse at 62% 52%, transparent 22%, #000 58%, transparent 96%);
		mask-image: radial-gradient(ellipse at 62% 52%, transparent 22%, #000 58%, transparent 96%);
		opacity: 0.62;
		pointer-events: none;
	}
	.hero-body {
		position: relative;
		z-index: 1;
	}
	/* Each line is its own block so the inverted ones can carry a solid plate
	   without the boxes overlapping, which is what inline backgrounds do at
	   a display line-height. */
	.shout {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		font-size: clamp(1.9rem, 4.1vw, 3.1rem);
		font-weight: 900;
		line-height: 1.06;
		letter-spacing: -0.035em;
	}
	.shout span {
		padding: 0.04em 0.14em 0.1em;
		margin-left: -0.14em;
	}
	.shout .inv {
		background: var(--ink);
		color: var(--paper);
	}
	.dialogue {
		margin-top: 1.4rem;
		max-width: 36ch;
		font-size: 1rem;
		line-height: 1.6;
		color: #33302b;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.8rem;
	}
	.hero-stage {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		min-height: 250px;
	}
	.ground {
		position: absolute;
		left: 4%;
		right: 4%;
		bottom: 74px;
		height: 34px;
		border-top: 3px solid var(--ink);
		opacity: 0.5;
		-webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
		mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
	}
	.hero-stage :global(canvas) {
		position: relative;
		margin-bottom: 4px;
	}
	.sfx {
		width: 100%;
		max-width: 260px;
		margin-top: 0.2rem;
	}
	.sfx-text {
		font-family: 'Zen Kaku Gothic New', sans-serif;
		font-size: 40px;
		font-weight: 900;
		letter-spacing: -0.02em;
		fill: var(--paper);
		stroke: var(--ink);
		stroke-width: 6;
		paint-order: stroke fill;
		transform: skewX(-9deg);
	}
	.pageno {
		position: absolute;
		right: 10px;
		bottom: 6px;
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--gray);
	}
	.gutter-note {
		padding: 0.7rem 1rem;
		border-width: 2.5px;
	}
	.small {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		color: #33302b;
	}

	/* ---------- strips ---------- */
	.strip {
		padding: clamp(2.5rem, 5vw, 4.5rem) 0 0;
	}
	.heading {
		display: inline-block;
		font-size: clamp(1.05rem, 2vw, 1.5rem);
		font-weight: 900;
		letter-spacing: -0.01em;
		color: var(--paper);
		background: var(--ink);
		padding: 0.3rem 0.7rem;
	}
	.lede {
		max-width: 66ch;
		margin-top: 1rem;
		font-size: 0.9375rem;
		line-height: 1.65;
		color: #33302b;
	}
	.panels {
		display: grid;
		gap: 10px;
		margin-top: 1.8rem;
	}
	.panels.three {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}
	.strip figure .stage {
		display: flex;
		justify-content: center;
		padding: 1.7rem 0;
		border-bottom: 2.5px solid var(--ink);
	}
	.strip figure .stage :global(canvas) {
		background: var(--paper);
		outline: 2px solid var(--ink);
	}
	figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
	}
	figcaption strong {
		font-size: 1.125rem;
		font-weight: 900;
	}
	figcaption span {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: #33302b;
	}

	.mode-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.7rem 1rem;
		border-bottom: 2.5px solid var(--ink);
		font-weight: 900;
		letter-spacing: 0.1em;
		background-color: var(--paper-2);
	}
	.mode-head i {
		font-style: normal;
		font-size: 0.6875rem;
		color: var(--paper);
		background: var(--ink);
		width: 1.55em;
		height: 1.55em;
		display: grid;
		place-items: center;
	}
	.mode dl {
		padding: 1rem;
	}
	.mode dt {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--gray);
	}
	.mode dt.inv {
		margin-top: 0.9rem;
		color: var(--paper);
		background: var(--ink);
		display: inline-block;
		padding: 0.1rem 0.35rem;
	}
	.mode dd {
		margin: 0.3rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.bubbles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.6rem 1.2rem;
		margin-top: 2rem;
	}
	.bubbles li {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.bubble {
		position: relative;
		padding: 1.1rem 1.2rem;
		background: var(--paper);
		border: 2.5px solid var(--ink);
		border-radius: 22px;
	}
	.bubble p {
		font-size: 0.9375rem;
		line-height: 1.5;
	}
	.tail {
		position: absolute;
		left: 30px;
		bottom: -15px;
		width: 20px;
		height: 16px;
		background: var(--paper);
		border-right: 2.5px solid var(--ink);
		border-bottom: 2.5px solid var(--ink);
		transform: skewX(-26deg);
	}
	.cue {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--gray);
		padding-left: 3.6rem;
	}

	.ships {
		margin-top: 1.8rem;
		border: 2.5px solid var(--ink);
	}
	.ships li {
		display: grid;
		grid-template-columns: 6.5rem 1fr;
		gap: 1rem;
		align-items: baseline;
		padding: 0.85rem 1.1rem;
	}
	.ships li + li {
		border-top: 1.5px solid var(--ink);
	}
	.ships strong {
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.14em;
	}
	.ships span {
		font-size: 0.875rem;
		color: #33302b;
	}

	/* ---------- colophon ---------- */
	.colophon {
		margin-top: clamp(3rem, 6vw, 5rem);
		padding-top: clamp(1.6rem, 3vw, 2.5rem);
		border-top: 4px solid var(--ink);
	}
	.close-panel {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: clamp(1.5rem, 3.5vw, 2.6rem);
		background: var(--ink);
	}
	.small-shout {
		font-size: clamp(1.6rem, 3.4vw, 2.6rem);
		font-weight: 900;
		letter-spacing: -0.03em;
		color: var(--paper);
	}
	.close-panel .tag.solid {
		color: var(--ink);
		background: var(--paper);
		border-color: var(--paper);
	}
	.spec {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem 2rem;
		margin-top: 1.8rem;
	}
	.spec dt {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: var(--gray);
	}
	.spec dd {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
	}
	.fine {
		margin-top: 1.5rem;
		font-size: 0.75rem;
		color: var(--gray);
		max-width: 70ch;
	}

	@media (max-width: 820px) {
		.hero-panel {
			grid-template-columns: 1fr;
		}
		.chapter {
			flex-wrap: wrap;
		}
		.chapter nav {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tag {
			transition: none;
		}
	}
</style>
