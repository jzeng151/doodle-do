<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const MODES = [
		{ n: 'FOCUS', k: '1', great: 'Drawing one frame with onion-skin context.', bad: 'Comparing many frames at once.' },
		{ n: 'GRID', k: '2', great: 'Seeing and editing every frame side by side.', bad: 'Detail work on a single frame.' },
		{ n: 'LOOP', k: '3', great: 'Judging the motion at full speed.', bad: 'You need to draw. Switch back to edit.' }
	];

	const BALLOONS = [
		{ id: 'T02', copy: 'The red ghost is your previous frame. Draw where things have moved to, not where they were.' },
		{ id: 'T09', copy: 'Classic pixel animation often runs at 6-10 FPS. Smoothness comes from good in-betweens, not speed.' },
		{ id: 'T06', copy: 'Great pixel art usually uses surprisingly few colors. Limits make choices easier.' },
		{ id: 'T15', copy: 'A project file on disk is the only copy you truly own.' }
	];

	const CARGO = [
		['SHEET', 'PNG sprite sheet, uniform grid'],
		['ATLAS', 'TexturePacker JSON. Loads in stock Phaser'],
		['SPEC', 'doodledo.json: frameSize, fps, frame rects'],
		['GIF', 'Animated, per-frame delays'],
		['ZIP', 'One PNG per frame']
	];

	const RATES = [
		[4, 'Choppy. Every pose readable.'],
		[8, 'The classic rate. Four drawings.'],
		[16, 'Smoother, and twice the work.']
	] as const;

	const LOG = [
		['PALETTE', '16 to start, 64 ceiling'],
		['ALPHA', '1-bit. No soft edges'],
		['STROKE → LOOP', '0.1 ms p95 / 16 ms budget'],
		['STORAGE', 'Local autosave + file on disk']
	];
</script>

<div class="mock album">
	<header class="banner">
		<span class="mark">DOODLE&#8209;DO</span>
		<nav>
			<a href="#rate">RATE</a><a href="#modes">MODES</a><a href="#balloons">NOTES</a><a href="#cargo">CARGO</a>
		</nav>
		<a class="btn red" href="#top">START DRAWING</a>
	</header>

	<!-- tier 1: the wide establishing panel -->
	<section class="tier tier-1" id="top">
		<article class="panel establishing">
			<svg class="scene" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
				<rect width="1440" height="400" fill="#8cc4e8" />
				<g fill="#f2f0ea" stroke="#14110f" stroke-width="3" stroke-linejoin="round">
					<path d="M232 96q-30 0-30-25t30-25q7-30 39-30t39 25q25-7 39 11t-9 39z" />
					<path d="M900 64q-24 0-24-20t24-20q6-24 31-24t31 20q20-6 31 9t-7 31z" />
					<path d="M1290 140q-20 0-20-17t20-17q5-20 26-20t26 17q17-5 26 7t-6 26z" />
				</g>
				<g stroke="#14110f" stroke-width="3" stroke-linejoin="round">
					<path d="M520 300v-118h44v118z" fill="#d8352a" />
					<path d="M512 182h60l-30-34z" fill="#f2f0ea" />
					<path d="M528 206h28v26h-28z" fill="#8cc4e8" />
					<path d="M1180 300v-150h56v150z" fill="#4a6f92" />
					<path d="M1180 150h56M1208 150v-30" />
					<path d="M1196 178h24v22h-24zM1196 216h24v22h-24z" fill="#f2f0ea" />
					<path d="M980 300v-64h34v64z" fill="#e0c48f" />
					<path d="M972 236h50l-25-26z" fill="#4d8f80" />
				</g>
				<path d="M0 300h1440v100H0z" fill="#4d8f80" stroke="#14110f" stroke-width="3" />
				<path d="M0 336h1440" stroke="#14110f" stroke-width="3" opacity="0.3" />
			</svg>
			<div class="scene-figure"><Sprite playing scale={13} /></div>
			<p class="caption-box">
				The loop is already running. Everything you draw joins it on the next pass.
			</p>
			<div class="balloon hero-balloon">
				<p>Draw one frame.<br />The loop already has it.</p>
				<span class="tail" aria-hidden="true"></span>
			</div>
			<span class="tier-no" aria-hidden="true">1</span>
		</article>
	</section>

	<section class="lede-row">
		<p class="lede">
			Frame-by-frame pixel animation in the browser. Playback never stops while you work, and the
			tool teaches animation as you go.
		</p>
		<div class="cta">
			<a class="btn red" href="#top">START DRAWING</a>
			<a class="btn" href="#cargo">SEE THE CARGO</a>
		</div>
		<p class="fine">No account. Nothing uploaded. No AI. Runs with the network off.</p>
	</section>

	<!-- tier 2: the rate demonstration -->
	<section class="tier tier-3" id="rate">
		<h2 class="caption-box head">Frame rate is not smoothness. The same four drawings, clocked three ways.</h2>
		{#each RATES as [fps, note] (fps)}
			<figure class="panel">
				<div class="stage"><Sprite playing {fps} scale={7} /></div>
				<figcaption><strong>{fps} FPS</strong>{note}</figcaption>
			</figure>
		{/each}
	</section>

	<!-- tier 3: the three views -->
	<section class="tier tier-3" id="modes">
		<h2 class="caption-box head">
			Three views over one session. Switch and your frame, zoom, palette, and history stay put.
		</h2>
		{#each MODES as m (m.n)}
			<article class="panel mode">
				<header><span class="key">{m.k}</span><h3>{m.n}</h3></header>
				<dl>
					<dt>GREAT AT</dt><dd>{m.great}</dd>
					<dt class="warn">STRAINS WHEN</dt><dd>{m.bad}</dd>
				</dl>
			</article>
		{/each}
	</section>

	<!-- tier 4: the tool speaks -->
	<section class="tier balloons" id="balloons">
		<h2 class="caption-box head">
			Twenty-six notes, wired to what you just did. One at a time, never a dialog, every one
			dismissible forever.
		</h2>
		{#each BALLOONS as b (b.id)}
			<div class="balloon">
				<p>{b.copy}</p>
				<span class="tail" aria-hidden="true"></span>
				<span class="cue">{b.id}</span>
			</div>
		{/each}
	</section>

	<section class="tier cargo" id="cargo">
		<h2 class="caption-box head">
			What comes off the ship. Export is checked against the real engines: one test loads it in
			stock Phaser, another imports it into stock Godot.
		</h2>
		<ul class="manifest">
			{#each CARGO as [k, v] (k)}
				<li><span class="crate">{k}</span><span>{v}</span></li>
			{/each}
		</ul>
	</section>

	<footer class="logbook">
		<div class="log-panel">
			<h2>LOGBOOK</h2>
			<dl>
				{#each LOG as [k, v] (k)}
					<div><dt>{k}</dt><dd>{v}</dd></div>
				{/each}
			</dl>
		</div>
		<a class="btn red big" href="#top">START DRAWING</a>
		<p class="colophon">
			The figure is a four-frame walk cycle authored for this page, from the sixteen-color starter
			palette.
		</p>
	</footer>
</div>

<style>
	.album {
		--sky: #8cc4e8;
		--paper: #f2f0ea;
		--yellow: #f2cf5b;
		--red: #d8352a;
		--green: #4d8f80;
		--steel: #4a6f92;
		--ink: #14110f;
		--ochre: #e0c48f;
		--line: 3px;
		min-height: 100%;
		background: var(--sky);
		color: var(--ink);
		font-family: 'Nunito Sans', system-ui, sans-serif;
		padding: 0 clamp(0.9rem, 3vw, 3rem);
		overflow-x: hidden;
	}

	/* one unvarying line weight holds every object on the page */
	.panel,
	.balloon,
	.caption-box,
	.btn,
	.crate,
	.key,
	.log-panel,
	.manifest {
		border: var(--line) solid var(--ink);
	}

	.banner {
		display: flex;
		align-items: center;
		gap: clamp(1rem, 3vw, 2.5rem);
		margin: 0 clamp(-0.9rem, -3vw, -3rem);
		padding: 0.85rem clamp(1.2rem, 4vw, 3.5rem);
		background: var(--yellow);
		border-bottom: var(--line) solid var(--ink);
	}
	.mark {
		font-family: Grandstander, system-ui, sans-serif;
		font-weight: 800;
		font-size: clamp(1.05rem, 1.9vw, 1.45rem);
		letter-spacing: 0.01em;
	}
	.banner nav {
		display: flex;
		gap: clamp(0.8rem, 2vw, 1.8rem);
		margin-right: auto;
	}
	.banner nav a {
		font-family: Grandstander, sans-serif;
		font-weight: 600;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		color: var(--ink);
		text-decoration: none;
	}
	.banner nav a:hover {
		text-decoration: underline;
		text-decoration-thickness: 3px;
		text-underline-offset: 4px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.6rem 1.15rem;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-decoration: none;
		color: var(--ink);
		background: var(--paper);
		border-radius: 7px;
	}
	.btn.red {
		background: var(--red);
		color: var(--paper);
	}
	.btn.red:hover {
		background: #b92a20;
	}
	.btn:hover {
		background: var(--ochre);
	}
	.btn.big {
		padding: 0.9rem 1.8rem;
		font-size: 0.9375rem;
	}

	/* the album's waffle grid */
	.tier {
		display: grid;
		gap: 14px;
		padding: 14px 0 0;
	}
	.tier-3 {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}
	.panel {
		position: relative;
		background: var(--paper);
		border-radius: 4px;
		overflow: hidden;
	}

	/* the panel takes the scene's own aspect so nothing is cropped, and the
	   figure is placed in the same proportional space as the horizon */
	.establishing {
		aspect-ratio: 1440 / 400;
		min-height: 250px;
	}
	.scene {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.scene-figure {
		position: absolute;
		left: 50%;
		bottom: 19%;
		transform: translateX(-50%);
	}
	.caption-box {
		position: relative;
		margin: 0;
		padding: 0.7rem 0.9rem;
		background: var(--yellow);
		font-family: Grandstander, sans-serif;
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.35;
		letter-spacing: 0.01em;
	}
	.establishing .caption-box {
		position: absolute;
		left: 14px;
		bottom: 14px;
		max-width: 30ch;
		border-radius: 3px;
	}
	.balloon {
		position: relative;
		padding: 1rem 1.15rem;
		background: var(--paper);
		border-radius: 20px;
	}
	.balloon p {
		font-family: Grandstander, sans-serif;
		font-weight: 600;
		font-size: 0.9375rem;
		line-height: 1.4;
	}
	.hero-balloon {
		position: absolute;
		top: 16px;
		left: 16px;
		max-width: 20ch;
	}
	.hero-balloon p {
		font-size: clamp(1.15rem, 2.2vw, 1.7rem);
		font-weight: 800;
		line-height: 1.12;
	}
	.tail {
		position: absolute;
		left: 34px;
		bottom: -17px;
		width: 22px;
		height: 20px;
		background: var(--paper);
		border-right: var(--line) solid var(--ink);
		border-bottom: var(--line) solid var(--ink);
		border-bottom-right-radius: 3px;
		transform: skewX(-24deg);
	}
	.tier-no {
		position: absolute;
		right: 10px;
		bottom: 8px;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.75rem;
		color: var(--ink);
		opacity: 0.5;
	}

	.lede-row {
		display: grid;
		gap: 1rem;
		justify-items: start;
		padding: 1.6rem 0 0.4rem;
	}
	.lede {
		max-width: 52ch;
		font-size: 1.0625rem;
		line-height: 1.6;
		font-weight: 600;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	.fine {
		font-family: Grandstander, sans-serif;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
	}

	.head {
		grid-column: 1 / -1;
		max-width: 78ch;
		border-radius: 3px;
	}

	.stage {
		display: flex;
		justify-content: center;
		padding: 1.6rem 0;
		background: var(--sky);
		border-bottom: var(--line) solid var(--ink);
	}
	figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
		font-size: 0.8125rem;
		line-height: 1.45;
	}
	figcaption strong {
		font-family: Grandstander, sans-serif;
		font-weight: 800;
		font-size: 1.125rem;
	}

	.mode header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 1rem;
		background: var(--steel);
		border-bottom: var(--line) solid var(--ink);
	}
	.key {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		flex: none;
		background: var(--yellow);
		border-radius: 4px;
		font-family: Grandstander, sans-serif;
		font-weight: 800;
		font-size: 0.8125rem;
	}
	.mode h3 {
		font-family: Grandstander, sans-serif;
		font-weight: 800;
		font-size: 1.0625rem;
		letter-spacing: 0.06em;
		color: var(--paper);
	}
	.mode dl {
		padding: 1rem;
	}
	.mode dt {
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
	}
	.mode dt.warn {
		margin-top: 0.9rem;
		color: var(--red);
	}
	.mode dd {
		margin: 0.3rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.balloons {
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem 14px;
	}
	.cue {
		position: absolute;
		left: 40px;
		bottom: -30px;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
	}

	.manifest {
		grid-column: 1 / -1;
		background: var(--paper);
		border-radius: 4px;
		overflow: hidden;
	}
	.manifest li {
		display: grid;
		grid-template-columns: 7.5rem 1fr;
		gap: 1rem;
		align-items: center;
		padding: 0.7rem 0.9rem;
	}
	.manifest li + li {
		border-top: var(--line) solid var(--ink);
	}
	.crate {
		display: inline-flex;
		justify-content: center;
		padding: 0.25rem 0.5rem;
		background: var(--ochre);
		border-radius: 3px;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.6875rem;
		letter-spacing: 0.08em;
	}
	.manifest span:last-child {
		font-size: 0.875rem;
	}

	.logbook {
		display: grid;
		justify-items: start;
		gap: 1.2rem;
		padding: 2.5rem 0 1rem;
	}
	.log-panel {
		width: 100%;
		background: var(--paper);
		border-radius: 4px;
		padding: 1.2rem;
	}
	.log-panel h2 {
		font-family: Grandstander, sans-serif;
		font-weight: 800;
		font-size: 1.0625rem;
		letter-spacing: 0.14em;
		padding-bottom: 0.7rem;
		margin-bottom: 1rem;
		border-bottom: var(--line) solid var(--ink);
	}
	.log-panel dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 0.9rem 1.6rem;
	}
	.log-panel dt {
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
	}
	.log-panel dd {
		margin: 0.2rem 0 0;
		font-size: 0.8125rem;
	}
	.colophon {
		font-size: 0.75rem;
		font-weight: 600;
		max-width: 68ch;
	}

	@media (max-width: 760px) {
		.banner nav {
			display: none;
		}
		.hero-balloon {
			max-width: 15ch;
		}
		.establishing .caption-box {
			max-width: 24ch;
			font-size: 0.8125rem;
		}
	}
</style>
