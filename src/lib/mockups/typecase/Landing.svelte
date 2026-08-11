<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const MODES = [
		{ n: 'FOCUS', k: '1', great: 'Drawing one frame with onion-skin context.', bad: 'Comparing many frames at once.' },
		{ n: 'GRID', k: '2', great: 'Seeing and editing every frame side by side.', bad: 'Detail work on a single frame.' },
		{ n: 'LOOP', k: '3', great: 'Judging the motion at full speed.', bad: 'You need to draw. Switch back to edit.' }
	];

	const MARGINALIA = [
		{ id: 'T06', copy: 'Great pixel art usually uses surprisingly few colors. Limits make choices easier.' },
		{ id: 'T02', copy: 'The red ghost is your previous frame. Draw where things have moved to, not where they were.' },
		{ id: 'T10', copy: "Longer isn't always better. A tight 4-frame loop often reads better than a loose 8." },
		{ id: 'T15', copy: 'Your work autosaves in the browser, but a project file on disk is the only copy you truly own.' }
	];

	const PULLS = [
		['I', 'name.png', 'Sprite sheet, uniform grid'],
		['II', 'name.json', 'TexturePacker JSON-hash atlas'],
		['III', 'name.doodledo.json', 'frameSize, fps, per-frame rects'],
		['IV', 'name.gif', 'Animated, per-frame delays'],
		['V', 'name-frames.zip', 'One PNG per frame']
	];

	const COLOPHON = [
		['PALETTE', 'Sixteen sorts to start, sixty-four to the case'],
		['ALPHA', 'One bit. No soft edges, no half-tones'],
		['IMPRESSION', '0.1 ms p95 against a 16 ms budget'],
		['STORAGE', 'Local autosave, and a file on disk you own']
	];

	const RATES = [
		[4, 'Choppy. Every pose readable.'],
		[8, 'The classic rate. Four sorts.'],
		[16, 'Smoother, and twice the setting.']
	] as const;
</script>

<div class="mock shop">
	<header class="rail">
		<span class="mark">DOODLE&#8209;DO</span>
		<span class="sub">JOBBING PRINTER &middot; PIXEL ANIMATION</span>
		<nav>
			<a href="#chase">CHASE</a><a href="#rate">RATE</a><a href="#views">VIEWS</a>
			<a href="#margin">MARGIN</a><a href="#pulls">PULLS</a>
		</nav>
		<a class="btn ink" href="#chase">START SETTING</a>
	</header>

	<section class="hero" id="chase">
		<div class="pitch">
			<h1>Sixteen sorts.<br />Four frames.<br />One running press.</h1>
			<p class="lede">
				Frame-by-frame pixel animation in the browser. The press never stops: every sort you set
				lands in the loop on the next impression, and the shop teaches as you work.
			</p>
			<div class="cta">
				<a class="btn ink big" href="#chase">START SETTING</a>
				<a class="btn big" href="#pulls">SEE THE PULLS</a>
			</div>
			<p class="fine">No account. Nothing uploaded. No AI. Runs with the network off.</p>
		</div>

		<!-- the forme: four frames locked up in a chase with quoins -->
		<figure class="chase">
			<figcaption class="chase-label">THE CHASE &middot; FOUR FRAMES LOCKED UP</figcaption>
			<div class="forme">
				{#each [0, 1, 2, 3] as i (i)}
					<div class="sort" class:live={i === 1}>
						<Sprite frame={i} scale={7} />
						<span class="nick">{['I', 'II', 'III', 'IV'][i]}</span>
					</div>
				{/each}
				<span class="quoin q1" aria-hidden="true"></span>
				<span class="quoin q2" aria-hidden="true"></span>
			</div>
			<div class="press">
				<span class="press-lab">IMPRESSION</span>
				<Sprite playing scale={6} />
				<span class="press-rate">8 / SEC</span>
			</div>
		</figure>
	</section>

	<!-- the type case: compartments, one colour to a box -->
	<section class="case-row">
		<h2 class="rule-head"><span>THE CASE</span></h2>
		<p class="intro">
			A locked palette is a type case. Sixteen compartments to start, sixty-four at the most, and
			every colour you place has to come out of one of them. That is not a restriction bolted on
			afterwards; it is why the work holds together.
		</p>
		<div class="typecase">
			{#each PALETTE as hex, i (hex)}
				<span class="box" style="--c: {hex}"><i>{String(i + 1).padStart(2, '0')}</i></span>
			{/each}
			<span class="box empty"><i>—</i></span>
		</div>
	</section>

	<section class="pull-sheet" id="rate">
		<h2 class="rule-head"><span>PROOFS AT THREE SPEEDS</span></h2>
		<p class="intro">
			The same four sorts, run at three rates. Nothing was recut between these pulls; only the
			press speed changed. Smoothness comes from the in-betweens, not the tempo.
		</p>
		<div class="proofs">
			{#each RATES as [fps, note] (fps)}
				<figure class="proof">
					<div class="proof-stage"><Sprite playing {fps} scale={6} /></div>
					<figcaption><strong>{fps} / SEC</strong>{note}</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section class="pull-sheet" id="views">
		<h2 class="rule-head"><span>THREE STONES, ONE FORME</span></h2>
		<p class="intro">
			Focus, Grid, and Loop are the same forme seen three ways. Switch and your frame, zoom,
			palette, and history are where you left them. Each is set with what it is bad at, because a
			specimen that only shows the best cut is an advertisement.
		</p>
		<table class="specimen">
			<thead><tr><th>KEY</th><th>STONE</th><th>SET FOR</th><th>STRAINS WHEN</th></tr></thead>
			<tbody>
				{#each MODES as m (m.n)}
					<tr><td class="k">{m.k}</td><td class="n">{m.n}</td><td>{m.great}</td><td class="strain">{m.bad}</td></tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="pull-sheet" id="margin">
		<h2 class="rule-head"><span>NOTES IN THE MARGIN</span></h2>
		<p class="intro">
			Twenty-six of them, set from what you just did. One at a time, never a dialog, each capped so
			it stops on its own, and every one dismissible for good.
		</p>
		<ul class="margin">
			{#each MARGINALIA as m (m.id)}
				<li><span class="ref">{m.id}</span><p>{m.copy}</p></li>
			{/each}
		</ul>
	</section>

	<section class="pull-sheet" id="pulls">
		<h2 class="rule-head"><span>THE PULLS</span></h2>
		<p class="intro">
			Five files come off the press. Sheet export is checked against the real engines, not
			asserted: one test loads a pull in stock Phaser, another imports it into stock Godot.
		</p>
		<table class="specimen">
			<thead><tr><th>NO.</th><th>FILE</th><th>CONTENTS</th></tr></thead>
			<tbody>
				{#each PULLS as [no, file, what] (no)}
					<tr><td class="k">{no}</td><td class="n file">{file}</td><td>{what}</td></tr>
				{/each}
			</tbody>
		</table>
	</section>

	<footer class="imprint">
		<div class="imprint-body">
			<h2>COLOPHON</h2>
			<dl>
				{#each COLOPHON as [k, v] (k)}
					<div><dt>{k}</dt><dd>{v}</dd></div>
				{/each}
			</dl>
			<a class="btn ink big" href="#chase">START SETTING</a>
		</div>
		<p class="note">
			The figure is a four-frame walk cycle set for this sheet from the sixteen-colour starter case.
		</p>
	</footer>
</div>

<style>
	.shop {
		--wood: #a8783f;
		--wood-dk: #74522a;
		--wood-lt: #c49a63;
		--lead: #7b7f83;
		--lead-dk: #565b60;
		--paper: #ece5d6;
		--paper-lt: #f6f1e6;
		--ink: #17140f;
		--spot: #b8351f;
		--grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='320'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8 0.014' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='70' height='320' filter='url(%23g)' opacity='0.5'/%3E%3C/svg%3E");
		min-height: 100%;
		background-color: var(--paper);
		color: var(--ink);
		font-family: Petrona, Georgia, serif;
		font-size: 15px;
		line-height: 1.6;
		padding: 0 clamp(1rem, 4vw, 4rem);
	}

	.rail {
		display: flex;
		align-items: center;
		gap: clamp(0.8rem, 2.5vw, 2rem);
		margin: 0 calc(clamp(1rem, 4vw, 4rem) * -1);
		padding: 0.8rem clamp(1.4rem, 5vw, 4.5rem);
		background-color: var(--wood-dk);
		background-image: var(--grain);
		border-bottom: 4px solid var(--ink);
		color: var(--paper-lt);
	}
	.mark {
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: clamp(1.05rem, 1.9vw, 1.4rem);
		letter-spacing: 0.01em;
		text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
	}
	.sub {
		font-size: 0.625rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #efe3cd;
	}
	.rail nav {
		display: flex;
		gap: clamp(0.7rem, 1.8vw, 1.5rem);
		margin-left: auto;
	}
	.rail nav a {
		font-size: 0.6875rem;
		letter-spacing: 0.16em;
		color: #e7dcc4;
		text-decoration: none;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}
	.rail nav a:hover {
		color: #fff;
		border-bottom-color: var(--spot);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.1rem;
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		text-decoration: none;
		color: var(--ink);
		background: var(--paper-lt);
		border: 2px solid var(--ink);
		box-shadow: 2px 2px 0 rgba(23, 20, 15, 0.28);
	}
	.btn:hover {
		background: #fffaf0;
	}
	.btn.ink {
		color: var(--paper-lt);
		background: var(--spot);
		border-color: #7d2214;
	}
	.btn.ink:hover {
		background: #9c2b19;
	}
	.btn.big {
		padding: 0.85rem 1.6rem;
		font-size: 0.8125rem;
	}

	/* ---------- hero ---------- */
	.hero {
		display: grid;
		grid-template-columns: minmax(280px, 25rem) 1fr;
		gap: clamp(1.8rem, 4vw, 3.5rem);
		align-items: center;
		padding: clamp(2.2rem, 5vw, 4rem) 0 clamp(1.5rem, 3vw, 2.5rem);
	}
	h1 {
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: clamp(1.9rem, 3.6vw, 3.1rem);
		line-height: 1.02;
		letter-spacing: -0.005em;
		text-wrap: balance;
	}
	.lede {
		margin-top: 1.2rem;
		max-width: 38ch;
		font-size: 1.0625rem;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-top: 1.7rem;
	}
	.fine {
		margin-top: 1rem;
		font-size: 0.6875rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #6d6455;
	}

	.chase {
		background-color: var(--lead-dk);
		background-image: var(--grain);
		border: 6px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(23, 20, 15, 0.3);
		padding: clamp(0.9rem, 2vw, 1.4rem);
	}
	.chase-label {
		font-size: 0.625rem;
		letter-spacing: 0.2em;
		color: #cdd2d6;
		margin-bottom: 0.8rem;
	}
	.forme {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		padding: 10px;
		background: var(--lead);
		border: 3px solid #3c4145;
	}
	.sort {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 5;
		padding: 8px 6px 16px;
		background: linear-gradient(180deg, #9aa0a5, #7b8186);
		border: 1px solid #4a4f53;
		box-shadow:
			inset 1px 1px 0 rgba(255, 255, 255, 0.35),
			inset -1px -1px 0 rgba(0, 0, 0, 0.35);
	}
	.sort :global(canvas) {
		background: #dfd8c8;
		outline: 1px solid #4a4f53;
	}
	.sort.live {
		background: linear-gradient(180deg, #b3a08a, #8f7a62);
		box-shadow:
			inset 1px 1px 0 rgba(255, 255, 255, 0.3),
			0 0 0 2px var(--spot);
	}
	/* the nick: the notch that tells a compositor which way up a sort goes */
	.nick {
		position: absolute;
		bottom: 3px;
		font-size: 0.5625rem;
		letter-spacing: 0.12em;
		color: #14171a;
	}
	.quoin {
		position: absolute;
		background: linear-gradient(135deg, #8f9599, #5c6165);
		border: 1px solid #3c4145;
	}
	.q1 {
		right: -3px;
		top: 14%;
		width: 8px;
		height: 34%;
	}
	.q2 {
		left: 14%;
		bottom: -3px;
		width: 34%;
		height: 8px;
	}
	.press {
		display: inline-flex;
		align-items: center;
		gap: 0.9rem;
		margin-top: 0.9rem;
		padding: 0.5rem 0.8rem;
		background: var(--paper-lt);
		border: 2px solid var(--ink);
	}
	.press :global(canvas) {
		background: repeating-conic-gradient(#e2dac6 0% 25%, #f2ecdd 0% 50%) 0 0 / 10px 10px;
		outline: 1px solid #b6ac95;
	}
	.press-lab,
	.press-rate {
		font-size: 0.625rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.press-rate {
		color: var(--spot);
	}

	/* ---------- the case ---------- */
	.case-row,
	.pull-sheet {
		padding: clamp(2rem, 4vw, 3.2rem) 0 0;
	}
	.rule-head {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: clamp(1rem, 1.7vw, 1.25rem);
		letter-spacing: 0.04em;
	}
	.rule-head::after {
		content: '';
		flex: 1;
		height: 0;
		border-top: 3px double var(--ink);
	}
	.intro {
		max-width: 68ch;
		margin-top: 0.9rem;
	}
	.typecase {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
		gap: 5px;
		margin-top: 1.4rem;
		padding: 10px;
		background-color: var(--wood);
		background-image: var(--grain);
		border: 5px solid var(--wood-dk);
		box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.25);
	}
	.box {
		position: relative;
		aspect-ratio: 5 / 4;
		background: var(--c);
		border: 2px solid var(--wood-dk);
		box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.4);
	}
	.box.empty {
		background: repeating-linear-gradient(45deg, #b98c56 0 6px, #a8783f 6px 12px);
	}
	.box i {
		position: absolute;
		left: 3px;
		bottom: 2px;
		font-style: normal;
		font-size: 0.5625rem;
		letter-spacing: 0.08em;
		color: rgba(236, 229, 214, 0.85);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.7);
	}

	.proofs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: clamp(0.8rem, 2vw, 1.4rem);
		margin-top: 1.4rem;
	}
	.proof {
		background: var(--paper-lt);
		border: 2px solid var(--ink);
		box-shadow: 3px 3px 0 rgba(23, 20, 15, 0.22);
	}
	.proof-stage {
		display: flex;
		justify-content: center;
		padding: 1.4rem 0;
		border-bottom: 2px solid var(--ink);
	}
	.proof-stage :global(canvas) {
		background: repeating-conic-gradient(#e2dac6 0% 25%, #f2ecdd 0% 50%) 0 0 / 10px 10px;
	}
	.proof figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.8rem 0.9rem;
		font-size: 0.875rem;
	}
	.proof strong {
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 1.0625rem;
		letter-spacing: 0.04em;
	}

	.specimen {
		width: 100%;
		margin-top: 1.4rem;
		border-collapse: collapse;
		background: var(--paper-lt);
		border: 2px solid var(--ink);
	}
	.specimen th {
		padding: 0.5rem 0.8rem;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-align: left;
		color: var(--paper-lt);
		background: var(--ink);
	}
	.specimen td {
		padding: 0.6rem 0.8rem;
		font-size: 0.9375rem;
		border-bottom: 1px solid #cfc6b1;
		vertical-align: baseline;
	}
	.specimen .k {
		width: 4ch;
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 0.8125rem;
		color: var(--spot);
	}
	.specimen .n {
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 0.875rem;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}
	.specimen .file {
		color: var(--spot);
	}
	.specimen .strain {
		color: #7a4a2e;
		font-style: italic;
	}

	.margin {
		margin-top: 1.4rem;
		border-top: 3px double var(--ink);
	}
	.margin li {
		display: grid;
		grid-template-columns: 5rem 1fr;
		align-items: start;
		border-bottom: 1px solid #cfc6b1;
	}
	.ref {
		align-self: stretch;
		padding: 0.9rem 0.9rem;
		font-size: 0.6875rem;
		letter-spacing: 0.16em;
		color: var(--spot);
		border-right: 1px solid var(--spot);
	}
	.margin p {
		padding: 0.85rem 1rem;
		font-size: 1rem;
	}

	.imprint {
		margin-top: clamp(2.5rem, 5vw, 4rem);
		padding-top: clamp(1.4rem, 3vw, 2rem);
		border-top: 6px double var(--ink);
	}
	.imprint-body {
		display: grid;
		gap: 1.4rem;
		justify-items: start;
	}
	.imprint h2 {
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 1.0625rem;
		letter-spacing: 0.14em;
	}
	.imprint dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
		gap: 1rem 2rem;
		width: 100%;
	}
	.imprint dt {
		font-size: 0.625rem;
		letter-spacing: 0.18em;
		color: #6d6455;
	}
	.imprint dd {
		margin: 0.2rem 0 0;
		font-size: 0.9375rem;
	}
	.note {
		margin-top: 1.5rem;
		font-size: 0.75rem;
		color: #6d6455;
		max-width: 70ch;
	}

	@media (max-width: 880px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.rail nav,
		.sub {
			display: none;
		}
	}
</style>
