<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const MODES = [
		{ n: 'FOCUS', k: '1', great: 'Drawing one frame with onion-skin context.', bad: 'Comparing many frames at once.' },
		{ n: 'GRID', k: '2', great: 'Seeing and editing every frame side by side.', bad: 'Detail work on a single frame.' },
		{ n: 'LOOP', k: '3', great: 'Judging the motion at full speed.', bad: 'You need to draw. Switch back to edit.' }
	];

	const NOTES = [
		['T02', 'The red ghost is your previous frame. Draw where things have moved to, not where they were.'],
		['T09', 'Classic pixel animation often runs at 6-10 FPS. Smoothness comes from good in-betweens, not speed.'],
		['T10', "Longer isn't always better. A tight 4-frame loop often reads better than a loose 8."],
		['T15', 'Your work autosaves in the browser, but a project file on disk is the only copy you truly own.']
	];

	const TRAYS = [
		['SHEET', 'name.png', 'Sprite sheet on a uniform grid'],
		['ATLAS', 'name.json', 'TexturePacker JSON. Loads in stock Phaser'],
		['SPEC', 'name.doodledo.json', 'frameSize, fps, per-frame rects'],
		['GIF', 'name.gif', 'Animated, per-frame delays'],
		['ZIP', 'name-frames.zip', 'One PNG per frame']
	];

	const DIALS = [
		['PALETTE', '16', 'of 64'],
		['CANVAS', '16×16', 'px'],
		['ALPHA', '1', 'bit'],
		['P95', '0.1', 'ms']
	];

	const RATES = [
		[4, 'Choppy. Every pose readable.'],
		[8, 'The classic rate. Four sheets.'],
		[16, 'Smoother, and twice the printing.']
	] as const;
</script>

<div class="mock bay">
	<div class="safelight" aria-hidden="true"></div>

	<header class="head">
		<span class="mark">DOODLE&#8209;DO</span>
		<span class="sub">PRINTING BAY</span>
		<nav>
			<a href="#line">THE LINE</a><a href="#timer">TIMER</a><a href="#bays">BAYS</a>
			<a href="#notes">NOTES</a><a href="#trays">TRAYS</a>
		</nav>
		<a class="btn" href="#line">START DRAWING</a>
	</header>

	<section class="hero" id="line">
		<div class="pitch">
			<h1>The print is<br />already wet.</h1>
			<p class="lede">
				Frame-by-frame pixel animation in the browser. Playback never stops while you work, so
				every stroke comes up in the loop on the next pass. Nothing has to be developed first.
			</p>
			<div class="cta">
				<a class="btn big" href="#line">START DRAWING</a>
				<a class="btn ghost big" href="#trays">SEE THE TRAYS</a>
			</div>
			<p class="fine">No account &middot; nothing uploaded &middot; no AI &middot; runs with the network off</p>
		</div>

		<!-- the drying line: the frame strip, pegged up and still dripping -->
		<figure class="line">
			<div class="wire" aria-hidden="true"></div>
			<div class="prints">
				{#each [0, 1, 2, 3] as i (i)}
					<div class="print" class:live={i === 1}>
						<span class="peg" aria-hidden="true"></span>
						<Sprite frame={i} scale={6} />
						<span class="edge">{String(i + 1).padStart(2, '0')}</span>
					</div>
				{/each}
			</div>
			<figcaption>
				<span class="lab">ON THE LINE</span>
				<span class="v">4 sheets &middot; 8 per second &middot; 500 ms</span>
			</figcaption>
		</figure>
	</section>

	<section class="band" id="timer">
		<div class="band-head">
			<h2>Frame rate is not smoothness</h2>
			<p>
				The same four sheets, three exposures. Nothing was reprinted between these; only the timer
				changed. Smoothness comes from the in-betweens, not the clock.
			</p>
		</div>
		<div class="three">
			{#each RATES as [fps, note] (fps)}
				<figure class="tray">
					<div class="dial" aria-hidden="true" style="--turn: {(fps / 24) * 270 - 135}deg">
						<span class="needle"></span>
					</div>
					<div class="bath"><Sprite playing {fps} scale={6} /></div>
					<figcaption><strong>{fps}<i>/sec</i></strong>{note}</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section class="band" id="bays">
		<div class="band-head">
			<h2>Three bays, one negative</h2>
			<p>
				Focus, Grid, and Loop are the same document seen three ways. Switch and your frame, zoom,
				palette, and history are where you left them. Each bay is labelled with what it strains
				at, because a shop that only posts its successes teaches nobody.
			</p>
		</div>
		<div class="three">
			{#each MODES as m (m.n)}
				<article class="tray mode">
					<header><span class="key">{m.k}</span><h3>{m.n}</h3></header>
					<dl>
						<dt>GOOD FOR</dt><dd>{m.great}</dd>
						<dt class="warn">STRAINS WHEN</dt><dd>{m.bad}</dd>
					</dl>
				</article>
			{/each}
		</div>
	</section>

	<section class="band" id="notes">
		<div class="band-head">
			<h2>Notes pinned above the bench</h2>
			<p>
				Twenty-six of them, wired to what you just did. One at a time, never a dialog, capped so
				they stop on their own, and every one dismissible forever.
			</p>
		</div>
		<ul class="notes">
			{#each NOTES as [id, copy] (id)}
				<li><span class="nid">{id}</span><p>{copy}</p></li>
			{/each}
		</ul>
	</section>

	<section class="band" id="trays">
		<div class="band-head">
			<h2>What comes out of the trays</h2>
			<p>
				Export is checked against the engines rather than asserted: one test loads a real export in
				stock Phaser, another imports it into stock Godot, and both run on every change.
			</p>
		</div>
		<table class="manifest">
			<tbody>
				{#each TRAYS as [k, file, what] (k)}
					<tr><td class="k">{k}</td><td class="f">{file}</td><td>{what}</td></tr>
				{/each}
			</tbody>
		</table>
	</section>

	<footer class="bench">
		<dl class="dials">
			{#each DIALS as [k, v, u] (k)}
				<div><dt>{k}</dt><dd><b>{v}</b><span>{u}</span></dd></div>
			{/each}
		</dl>
		<a class="btn big" href="#line">START DRAWING</a>
		<p class="colophon">
			The sheets are a four-frame walk cycle authored for this page from the sixteen-colour starter
			palette.
		</p>
	</footer>
</div>

<style>
	.bay {
		--dark: #14100e;
		--dark-2: #1e1815;
		--amber: #e08a2c;
		--amber-dim: #a4661f;
		--print: #d8d4cc;
		--print-dim: #9a958c;
		--enamel: #e8e4dc;
		position: relative;
		min-height: 100%;
		background: var(--dark);
		color: var(--print);
		font-family: Karla, system-ui, sans-serif;
		font-size: 15px;
		line-height: 1.6;
		padding: 0 clamp(1rem, 4vw, 4rem);
		overflow-x: hidden;
	}
	/* the safelight itself: one warm source, everything else falls off from it */
	.safelight {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			120% 80% at 78% 0%,
			rgba(224, 138, 44, 0.3),
			rgba(224, 138, 44, 0.08) 42%,
			transparent 72%
		);
		pointer-events: none;
	}
	.bay > *:not(.safelight) {
		position: relative;
	}

	.head {
		display: flex;
		align-items: baseline;
		gap: clamp(0.8rem, 2.5vw, 2rem);
		padding: 1.3rem 0 1rem;
		border-bottom: 1px solid rgba(216, 212, 204, 0.16);
	}
	.mark {
		font-family: Anton, system-ui, sans-serif;
		font-size: clamp(1.1rem, 2vw, 1.5rem);
		letter-spacing: 0.04em;
		color: var(--enamel);
	}
	.sub {
		font-size: 0.6875rem;
		letter-spacing: 0.22em;
		color: var(--amber);
	}
	.head nav {
		display: flex;
		gap: clamp(0.7rem, 1.8vw, 1.5rem);
		margin-left: auto;
	}
	.head nav a {
		font-size: 0.6875rem;
		letter-spacing: 0.16em;
		color: var(--print-dim);
		text-decoration: none;
	}
	.head nav a:hover {
		color: var(--amber);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 1.2rem;
		font-family: Anton, sans-serif;
		font-size: 0.8125rem;
		letter-spacing: 0.1em;
		text-decoration: none;
		color: var(--dark);
		background: var(--amber);
	}
	.btn:hover {
		background: #f0993a;
	}
	.btn.ghost {
		color: var(--amber);
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--amber-dim);
	}
	.btn.ghost:hover {
		color: var(--dark);
		background: var(--amber);
	}
	.btn.big {
		padding: 0.9rem 1.7rem;
		font-size: 0.9375rem;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(280px, 25rem) 1fr;
		gap: clamp(1.8rem, 4vw, 3.5rem);
		align-items: center;
		padding: clamp(2.2rem, 5vw, 4.5rem) 0 clamp(1.5rem, 3vw, 2.5rem);
	}
	h1 {
		font-family: Anton, sans-serif;
		font-size: clamp(2.1rem, 4.2vw, 3.5rem);
		line-height: 1.02;
		letter-spacing: 0.005em;
		color: var(--enamel);
	}
	.lede {
		margin-top: 1.2rem;
		max-width: 38ch;
		color: var(--print-dim);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-top: 1.8rem;
	}
	.fine {
		margin-top: 1rem;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		color: #928c81;
	}

	.line {
		position: relative;
		padding: 2.6rem 0 0;
	}
	.wire {
		position: absolute;
		top: 16px;
		left: -4%;
		right: -4%;
		height: 2px;
		background: linear-gradient(180deg, #6b6259, #3a342e);
	}
	.prints {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: clamp(6px, 1.4vw, 16px);
	}
	.print {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 3 / 4;
		padding: 12px 8px 20px;
		background: var(--print);
		box-shadow: 0 10px 22px rgba(0, 0, 0, 0.55);
	}
	.print :global(canvas) {
		background: #eceae4;
	}
	/* the sheet still in the bath sits lower and reads warmer */
	.print.live {
		background: #efece5;
		transform: translateY(6px);
		box-shadow:
			0 12px 26px rgba(0, 0, 0, 0.6),
			0 0 0 2px var(--amber);
	}
	.peg {
		position: absolute;
		top: -14px;
		width: 8px;
		height: 20px;
		background: #b8ad9d;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
	}
	.edge {
		position: absolute;
		bottom: 5px;
		font-size: 0.625rem;
		letter-spacing: 0.14em;
		color: #6b6259;
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.8rem;
		margin-top: 1.2rem;
	}
	.lab {
		font-size: 0.6875rem;
		letter-spacing: 0.18em;
		color: var(--amber);
	}
	.v {
		font-size: 0.8125rem;
		color: var(--print-dim);
	}

	.band {
		padding: clamp(2.2rem, 4.5vw, 3.6rem) 0 0;
		border-top: 1px solid rgba(216, 212, 204, 0.14);
	}
	.band-head {
		max-width: 66ch;
		margin-bottom: 1.6rem;
	}
	h2 {
		font-family: Anton, sans-serif;
		font-size: clamp(1.3rem, 2.3vw, 1.9rem);
		letter-spacing: 0.01em;
		color: var(--enamel);
	}
	.band-head p {
		margin-top: 0.8rem;
		color: var(--print-dim);
	}

	.three {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
		gap: clamp(0.8rem, 2vw, 1.4rem);
	}
	/* an enamel developing tray: pale, shallow, rounded at the corners */
	.tray {
		background: var(--enamel);
		color: #241d19;
		border-radius: 10px;
		padding: 1.1rem;
		box-shadow: inset 0 0 0 3px #cfcabf;
	}
	.dial {
		position: relative;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: #2a2320;
		box-shadow: inset 0 0 0 3px #cfcabf;
	}
	.needle {
		position: absolute;
		left: 50%;
		bottom: 50%;
		width: 2px;
		height: 40%;
		background: var(--amber);
		transform-origin: 50% 100%;
		transform: translateX(-50%) rotate(var(--turn));
	}
	.bath {
		display: flex;
		justify-content: center;
		padding: 1.2rem 0 0.9rem;
	}
	.bath :global(canvas) {
		background: repeating-conic-gradient(#ddd8cd 0% 25%, #ece8df 0% 50%) 0 0 / 10px 10px;
		background-color: #e4dfd4;
	}
	.tray figcaption {
		display: block;
		margin-top: 0;
		padding-top: 0.7rem;
		border-top: 1px solid #cfcabf;
		font-size: 0.8125rem;
		color: #4a413a;
	}
	.tray strong {
		display: block;
		font-family: Anton, sans-serif;
		font-size: 1.4rem;
		color: #241d19;
	}
	.tray strong i {
		font-style: normal;
		font-size: 0.75rem;
		margin-left: 0.25em;
		color: #6b6259;
	}

	.mode header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding-bottom: 0.7rem;
		border-bottom: 1px solid #cfcabf;
	}
	.key {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		flex: none;
		font-size: 0.75rem;
		color: var(--enamel);
		background: #241d19;
		border-radius: 50%;
	}
	.mode h3 {
		font-family: Anton, sans-serif;
		font-size: 1.0625rem;
		letter-spacing: 0.06em;
	}
	.mode dt {
		margin-top: 0.9rem;
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		color: #6b6259;
	}
	.mode dt.warn {
		color: #a4441f;
	}
	.mode dd {
		margin: 0.2rem 0 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.notes {
		display: grid;
	}
	.notes li {
		display: grid;
		grid-template-columns: 4.5rem 1fr;
		gap: 1rem;
		padding: 0.95rem 0;
		border-top: 1px solid rgba(216, 212, 204, 0.14);
	}
	.notes li:last-child {
		border-bottom: 1px solid rgba(216, 212, 204, 0.14);
	}
	.nid {
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		color: var(--amber);
	}
	.notes p {
		max-width: 70ch;
		font-size: 0.9375rem;
	}

	.manifest {
		width: 100%;
		border-collapse: collapse;
	}
	.manifest td {
		padding: 0.7rem 0;
		font-size: 0.9375rem;
		border-top: 1px solid rgba(216, 212, 204, 0.14);
		vertical-align: baseline;
	}
	.manifest tr:last-child td {
		border-bottom: 1px solid rgba(216, 212, 204, 0.14);
	}
	.k {
		width: 7rem;
		font-family: Anton, sans-serif;
		font-size: 0.8125rem;
		letter-spacing: 0.1em;
	}
	.f {
		width: 15rem;
		color: var(--amber);
		white-space: nowrap;
	}

	.bench {
		display: grid;
		justify-items: start;
		gap: 1.5rem;
		padding: clamp(2rem, 4vw, 3rem) 0 clamp(1.5rem, 3vw, 2.5rem);
		margin-top: clamp(2rem, 4vw, 3rem);
		border-top: 1px solid rgba(216, 212, 204, 0.28);
	}
	.dials {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem 2rem;
		width: 100%;
	}
	.dials dt {
		font-size: 0.6875rem;
		letter-spacing: 0.16em;
		color: #928c81;
	}
	.dials dd {
		margin: 0.2rem 0 0;
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
	}
	.dials b {
		font-family: Anton, sans-serif;
		font-size: 1.5rem;
		color: var(--amber);
	}
	.dials span {
		font-size: 0.8125rem;
		color: var(--print-dim);
	}
	.colophon {
		font-size: 0.75rem;
		color: #928c81;
		max-width: 70ch;
	}

	@media (max-width: 860px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.head nav {
			display: none;
		}
	}
	/* four prints will not hang on a phone-width line without overflowing */
	@media (max-width: 560px) {
		.prints {
			grid-template-columns: repeat(2, 1fr);
			row-gap: 2.4rem;
		}
		.fine {
			letter-spacing: 0.04em;
			overflow-wrap: anywhere;
		}
	}
</style>
