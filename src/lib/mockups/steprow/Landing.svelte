<script lang="ts">
	import { onMount } from 'svelte';
	import Sprite from '../Sprite.svelte';
	import SevenSeg from './SevenSeg.svelte';

	const FRAMES = 4;
	const STEPS = 16;

	let step = $state(0);
	let running = $state(true);

	onMount(() => {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)');
		if (reduce.matches) running = false;
		const timer = setInterval(() => {
			if (running) step = (step + 1) % FRAMES;
		}, 125);
		return () => clearInterval(timer);
	});

	// Quartered like the machine it comes from: 1-4 red, 5-8 orange, 9-12
	// yellow, 13-16 white. Every key keeps its full colour, as on the panel;
	// the LEDs alone say which steps are armed and where the chase is.
	const QUARTER = ['red', 'orange', 'yellow', 'white'] as const;
	const quarterOf = (i: number) => QUARTER[Math.floor(i / 4)];

	const MODES = [
		{
			n: 'FOCUS',
			key: '1',
			great: 'Drawing one frame with onion-skin context.',
			strains: 'Comparing many frames at once.'
		},
		{
			n: 'GRID',
			key: '2',
			great: 'Seeing and editing every frame side by side.',
			strains: 'Detail work on a single frame.'
		},
		{
			n: 'LOOP',
			key: '3',
			great: 'Judging the motion at full speed.',
			strains: 'You need to draw. Switch back to edit.'
		}
	];

	// Verbatim from src/lib/learn/tips.ts. The product's own voice.
	const LEGENDS = [
		{ id: 'T02', copy: 'The red ghost is your previous frame. Draw where things have moved to, not where they were.' },
		{ id: 'T09', copy: 'Classic pixel animation often runs at 6-10 FPS. Smoothness comes from good in-betweens, not speed.' },
		{ id: 'T10', copy: "Longer isn't always better. A tight 4-frame loop often reads better than a loose 8. The loop preview never lies." },
		{ id: 'T06', copy: 'Great pixel art usually uses surprisingly few colors. Limits make choices easier.' },
		{ id: 'T15', copy: 'Your work autosaves in the browser, but a project file on disk is the only copy you truly own.' }
	];

	const JACKS = [
		{ jack: 'SHEET', label: 'PNG sprite sheet', note: 'One image, uniform grid' },
		{ jack: 'ATLAS', label: 'TexturePacker JSON', note: 'Loads natively in Phaser' },
		{ jack: 'SPEC', label: 'doodledo.json', note: 'frameSize, fps, frame rects' },
		{ jack: 'GIF', label: 'Animated GIF', note: 'Delays, index-0 alpha' },
		{ jack: 'ZIP', label: 'Frame PNGs', note: 'One file per frame' }
	];

	const RATES = [
		{ fps: 4, label: 'Choppy. You can read every pose.' },
		{ fps: 8, label: 'The classic rate. Four frames is enough.' },
		{ fps: 16, label: 'Smoother, and twice the drawing.' }
	];

	const SPEC: [string, string][] = [
		['PALETTE', '16 to start, 64 max'],
		['ALPHA', '1-bit, no soft edges'],
		['RENDER', 'Canvas 2D'],
		['STROKE → LOOP', '0.1 ms p95 / 16 ms budget'],
		['STORAGE', 'Local. Autosave + file on disk'],
		['NETWORK', 'None required. Installs offline']
	];
</script>

{#snippet seam()}
	<div class="seam" aria-hidden="true"><i></i><i></i></div>
{/snippet}

<div class="mock panel">
	<div class="cheek left" aria-hidden="true"></div>
	<div class="cheek right" aria-hidden="true"></div>

	<header class="head">
		<span class="screw" aria-hidden="true"></span>
		<a class="mark" href="#top">DOODLE&#8209;DO</a>
		<nav>
			<a href="#loop">THE LOOP</a>
			<a href="#modes">MODES</a>
			<a href="#legends">LEGENDS</a>
			<a href="#output">OUTPUT</a>
		</nav>
		<a class="key-btn primary" href="#top">START DRAWING</a>
		<span class="screw" aria-hidden="true"></span>
	</header>

	<section class="hero" id="top">
		<div class="pitch">
			<h1>Draw a frame.<br />The loop already has it.</h1>
			<p class="lede">
				Frame-by-frame pixel animation in the browser. Playback never stops while you work, so
				every stroke lands in a running loop instead of a still image.
			</p>
			<div class="cta">
				<a class="key-btn primary big" href="#top">START DRAWING</a>
				<a class="key-btn big" href="#output">SEE THE EXPORT</a>
			</div>
			<p class="fine">No account. No upload. No AI. Works offline.</p>
		</div>

		<div class="machine">
			<span class="screw corner tl" aria-hidden="true"></span>
			<span class="screw corner tr" aria-hidden="true"></span>
			<span class="screw corner bl" aria-hidden="true"></span>
			<span class="screw corner br" aria-hidden="true"></span>

			<div class="bay readouts">
				<div class="meter">
					<span class="silk">RATE &middot; FPS</span>
					<SevenSeg value="08.0" height={52} />
				</div>
				<div class="meter knob-meter">
					<span class="silk">RATE</span>
					<span class="knob" aria-hidden="true"></span>
					<span class="knob-scale" aria-hidden="true"><i>1</i><i>24</i></span>
				</div>
				<div class="meter">
					<span class="silk">FRAMES</span>
					<SevenSeg value="04" height={52} color="#ffa500" />
				</div>
				<div class="meter stage">
					<span class="silk">OUTPUT</span>
					<Sprite frame={step} scale={7} />
				</div>
				<button
					class="key-btn run"
					class:armed={running}
					onclick={() => (running = !running)}
					aria-pressed={running}
				>
					{running ? 'STOP' : 'RUN'}
				</button>
			</div>

			{@render seam()}

			<div class="bay row-block">
				<span class="silk row-title">STEP ROW &middot; SIXTEEN STEPS</span>
				<ol class="numbers" aria-hidden="true">
					{#each { length: STEPS } as _, i (i)}
						<li>{i + 1}</li>
					{/each}
				</ol>
				<ol class="steps">
					{#each { length: STEPS } as _, i (i)}
						<li>
							<span class="led" class:armed={i < FRAMES} class:lit={i === step && running}></span>
							<span class="key" data-q={quarterOf(i)}></span>
						</li>
					{/each}
				</ol>
				<div class="brackets" aria-hidden="true">
					<span><i></i>1&ndash;4 LOOP</span><span><i></i>5&ndash;8</span><span><i></i>9&ndash;12</span
					><span><i></i>13&ndash;16</span>
				</div>
			</div>

			{@render seam()}

			<div class="bay outs">
				<p class="caption">
					Frames are steps. FPS is tempo. The lit lamps are your loop, and the bright one tells
					you where <em>now</em> is.
				</p>
				<div class="trio">
					<span class="silk">OUT</span>
					<a class="key-btn" href="#output">SHEET</a>
					<a class="key-btn" href="#output">GIF</a>
					<a class="key-btn" href="#output">FRAMES</a>
				</div>
			</div>
		</div>
	</section>

	<section class="module" id="loop">
		<div class="module-legend"><span class="silk">MODULE 01 &middot; RATE</span></div>
		<div class="module-body">
			<div class="band-head">
				<h2>Frame rate is not smoothness</h2>
				<p>
					The same four drawings, clocked three ways. Nothing was redrawn between these; only the
					rate changed. This is the argument the loop preview makes for you every time you touch
					a pixel.
				</p>
			</div>
		</div>
		<div class="bays three">
			{#each RATES as r (r.fps)}
				<figure class="sub-bay">
					<div class="rate-top">
						<SevenSeg value={String(r.fps).padStart(2, '0')} height={30} color="#ffd600" />
						<span class="silk">FPS</span>
					</div>
					<div class="rate-stage">
						<Sprite playing={running} continuous fps={r.fps} scale={6} />
					</div>
					<figcaption>{r.label}</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section class="module" id="modes">
		<div class="module-legend"><span class="silk">MODULE 02 &middot; VIEW SELECT</span></div>
		<div class="module-body">
			<div class="band-head">
				<h2>Three views. One session.</h2>
				<p>
					Focus, Grid, and Loop are the same document seen three ways: switch and your frame,
					zoom, palette, and history are exactly where you left them. Each one is silkscreened
					with what it is bad at, where you can read it.
				</p>
			</div>
		</div>
		<div class="selector">
			<div class="selector-head" aria-hidden="true">
				<span class="silk">KEY</span><span class="silk">VIEW</span>
				<span class="silk good">GREAT AT</span><span class="silk bad">STRAINS WHEN</span>
			</div>
			{#each MODES as m (m.n)}
				<div class="selector-row">
					<span class="mode-key" aria-hidden="true">{m.key}</span>
					<h3>{m.n}</h3>
					<p>{m.great}</p>
					<p class="strain">{m.strains}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="module" id="legends">
		<div class="module-legend"><span class="silk">MODULE 03 &middot; ANNUNCIATOR</span></div>
		<div class="module-body">
			<div class="band-head">
				<h2>The panel talks back</h2>
				<p>
					Twenty-six legends, wired to what you just did. One at a time, never a dialog, capped so
					they stop on their own, and every one can be switched off forever.
				</p>
			</div>
			<ul class="legends">
				{#each LEGENDS as l (l.id)}
					<li>
						<span class="lamp" aria-hidden="true"></span>
						<span class="legend-id">{l.id}</span>
						<p>{l.copy}</p>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="module" id="output">
		<div class="module-legend"><span class="silk">MODULE 04 &middot; REAR PANEL</span></div>
		<div class="module-body">
			<div class="band-head">
				<h2>The back panel</h2>
				<p>
					What comes out is the point. Sprite-sheet export is checked against the real engines,
					not asserted: one test loads an export in stock Phaser, another imports it into stock
					Godot, and both run in CI.
				</p>
			</div>
			<div class="jackfield">
				{#each JACKS as o (o.jack)}
					<div class="jack">
						<span class="socket" aria-hidden="true"></span>
						<span class="silk">{o.jack}</span>
						<strong>{o.label}</strong>
						<span class="jack-note">{o.note}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<footer class="plate">
		<span class="screw corner tl" aria-hidden="true"></span>
		<span class="screw corner tr" aria-hidden="true"></span>
		<span class="screw corner bl" aria-hidden="true"></span>
		<span class="screw corner br" aria-hidden="true"></span>
		<div class="plate-body">
			<h2 class="plate-mark">DOODLE&#8209;DO</h2>
			<dl class="spec">
				{#each SPEC as [k, v] (k)}
					<div><dt>{k}</dt><dd>{v}</dd></div>
				{/each}
			</dl>
			<a class="key-btn primary big" href="#top">START DRAWING</a>
		</div>
		<p class="colophon">
			Sprite shown is a four-frame walk cycle authored for this page, drawn from the sixteen-color
			starter palette.
		</p>
	</footer>
</div>

<style>
	.panel {
		--panel: #171717;
		--panel-hi: #202020;
		--panel-lo: #101010;
		--rule: #2e2e2e;
		--silk: #e9e6df;
		--silk-dim: #a29e95;
		--red: #ff3b30;
		--orange: #ff9a00;
		--yellow: #ffd600;
		--grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E");
		/* fractal noise stretched along one axis reads as end grain; a
		   three-stop gradient only ever reads as a brown stripe */
		--woodgrain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='300'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85 0.012' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='60' height='300' filter='url(%23w)' opacity='0.6'/%3E%3C/svg%3E");
		position: relative;
		min-height: 100%;
		background-color: var(--panel);
		background-image: var(--grain);
		color: var(--silk);
		font-family: Archivo, system-ui, sans-serif;
		padding: 0 clamp(2.4rem, 6vw, 6rem);
		overflow-x: hidden;
	}

	.cheek {
		position: absolute;
		top: 0;
		bottom: 0;
		width: clamp(18px, 2.4vw, 40px);
		background-color: #5a3a21;
		background-image: var(--woodgrain);
		box-shadow:
			inset -4px 0 9px rgba(0, 0, 0, 0.7),
			inset 4px 0 9px rgba(0, 0, 0, 0.7),
			inset 0 0 0 1px rgba(0, 0, 0, 0.55);
		z-index: 3;
	}
	.cheek.left {
		left: 0;
	}
	.cheek.right {
		right: 0;
	}

	.silk {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		color: var(--silk-dim);
		text-transform: uppercase;
	}

	/* ---------- hardware ---------- */
	.screw {
		width: 11px;
		height: 11px;
		flex: none;
		border-radius: 50%;
		background:
			linear-gradient(118deg, transparent 43%, #0b0b0b 43% 57%, transparent 57%),
			radial-gradient(circle at 35% 30%, #6d6d6d, #2b2b2b 70%, #171717);
		box-shadow:
			inset 0 -1px 1px rgba(0, 0, 0, 0.8),
			0 1px 0 rgba(255, 255, 255, 0.06);
	}
	.screw.corner {
		position: absolute;
		z-index: 2;
	}
	.screw.tl {
		top: 9px;
		left: 9px;
	}
	.screw.tr {
		top: 9px;
		right: 9px;
	}
	.screw.bl {
		bottom: 9px;
		left: 9px;
	}
	.screw.br {
		bottom: 9px;
		right: 9px;
	}
	.seam {
		display: flex;
		flex-direction: column;
	}
	.seam i {
		height: 1px;
	}
	.seam i:first-child {
		background: #0a0a0a;
	}
	.seam i:last-child {
		background: rgba(255, 255, 255, 0.07);
	}

	/* ---------- keys ---------- */
	.key-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.2rem;
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--silk);
		background: linear-gradient(180deg, #2c2c2c, #1c1c1c);
		border: 1px solid #3a3a3a;
		border-radius: 3px;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.09),
			0 2px 4px rgba(0, 0, 0, 0.55);
		transition:
			transform 90ms cubic-bezier(0.2, 0, 0, 1),
			box-shadow 90ms cubic-bezier(0.2, 0, 0, 1),
			background 90ms;
	}
	.key-btn:hover {
		background: linear-gradient(180deg, #383838, #232323);
	}
	.key-btn:active {
		transform: translateY(1px);
		box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.7);
	}
	.key-btn.primary {
		color: #150604;
		background: linear-gradient(180deg, #ff5647, #e02c22);
		border-color: #8f1a13;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.35),
			0 2px 5px rgba(0, 0, 0, 0.6),
			0 0 18px rgba(255, 59, 48, 0.18);
	}
	.key-btn.primary:hover {
		background: linear-gradient(180deg, #ff6a5c, #ee342a);
	}
	.key-btn.big {
		padding: 1rem 1.7rem;
		font-size: 0.8125rem;
	}
	.key-btn.run.armed {
		color: #150604;
		background: linear-gradient(180deg, #ff5647, #e02c22);
		border-color: #8f1a13;
	}

	/* ---------- head ---------- */
	.head {
		position: static;
		z-index: 4;
		display: flex;
		align-items: center;
		gap: clamp(1rem, 3vw, 2.5rem);
		background: linear-gradient(180deg, #1d1d1d, #141414);
		border-bottom: 1px solid var(--rule);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
		margin: 0 calc(clamp(2.4rem, 6vw, 6rem) * -1);
		padding: 0.9rem clamp(2.8rem, 7vw, 7rem);
	}
	.mark {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-weight: 700;
		font-size: clamp(1rem, 1.6vw, 1.35rem);
		letter-spacing: 0.06em;
		color: var(--silk);
		text-decoration: none;
		text-shadow: 0 1px 0 rgba(0, 0, 0, 0.9);
	}
	.head nav {
		display: flex;
		gap: clamp(0.9rem, 2vw, 2rem);
		margin-right: auto;
	}
	.head nav a {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		color: var(--silk-dim);
		text-decoration: none;
		padding-bottom: 3px;
		border-bottom: 2px solid transparent;
	}
	.head nav a:hover {
		color: var(--silk);
		border-bottom-color: var(--red);
	}

	/* ---------- hero ---------- */
	.hero {
		display: grid;
		grid-template-columns: minmax(280px, 24rem) 1fr;
		gap: clamp(2rem, 4vw, 4.5rem);
		align-items: center;
		padding: clamp(2.5rem, 6vw, 5.5rem) 0 clamp(2.5rem, 5vw, 4rem);
	}
	h1 {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-weight: 700;
		font-size: clamp(1.95rem, 3.4vw, 2.9rem);
		line-height: 1.03;
		letter-spacing: 0.005em;
		text-transform: uppercase;
		text-wrap: balance;
		text-shadow: 0 2px 0 rgba(0, 0, 0, 0.75);
	}
	.lede {
		margin-top: 1.4rem;
		max-width: 34ch;
		font-size: 1.0625rem;
		line-height: 1.55;
		color: #bdb9b1;
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 2rem;
	}
	.fine {
		margin-top: 1.1rem;
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		color: #8b8880;
		text-transform: uppercase;
	}

	.machine {
		position: relative;
		background-color: #1b1b1b;
		background-image: var(--grain), linear-gradient(180deg, var(--panel-hi), var(--panel-lo));
		border: 1px solid #333;
		border-radius: 5px;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			0 18px 44px rgba(0, 0, 0, 0.55);
	}
	.bay {
		padding: clamp(1.1rem, 2.2vw, 1.7rem) clamp(1.2rem, 2.4vw, 2rem);
	}
	.readouts {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: clamp(1.1rem, 2.6vw, 2.2rem);
		padding-top: 1.9rem;
	}
	.meter {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.meter.stage {
		margin-left: auto;
	}
	.meter.stage :global(canvas) {
		background: repeating-conic-gradient(#232323 0% 25%, #1b1b1b 0% 50%) 0 0 / 14px 14px;
		border: 1px solid #333;
	}
	.knob-meter {
		align-items: center;
		gap: 0.4rem;
	}
	.knob {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background:
			linear-gradient(38deg, transparent 46%, var(--yellow) 46% 54%, transparent 54%) center /
				100% 54% no-repeat,
			repeating-conic-gradient(from 0deg, #3d3d3d 0deg 4deg, #262626 4deg 8deg),
			radial-gradient(circle at 40% 32%, #4a4a4a, #232323 65%, #141414);
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.14),
			0 3px 5px rgba(0, 0, 0, 0.75);
	}
	.knob-scale {
		display: flex;
		gap: 1.6rem;
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.5625rem;
		color: #7c7970;
	}
	.knob-scale i {
		font-style: normal;
	}
	.readouts .run {
		padding: 0.6rem 1.2rem;
	}

	.row-title {
		display: block;
		margin-bottom: 0.9rem;
	}
	.numbers,
	.steps,
	.brackets {
		display: grid;
		grid-template-columns: repeat(16, 1fr);
		gap: clamp(3px, 0.5vw, 7px);
	}
	.numbers li {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.625rem;
		text-align: center;
		color: var(--silk-dim);
		font-variant-numeric: tabular-nums;
	}
	.steps {
		margin-top: 0.35rem;
	}
	.steps li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
	.led {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #2a1614;
		box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.9);
	}
	.led.armed {
		background: #ff3b30;
		box-shadow:
			inset 0 0 1px rgba(255, 255, 255, 0.6),
			0 0 6px 1px rgba(255, 59, 48, 0.55);
	}
	.led.lit {
		background: #fff2ef;
		box-shadow: 0 0 12px 4px rgba(255, 90, 74, 0.95);
	}
	.key {
		width: 100%;
		aspect-ratio: 3 / 5;
		border-radius: 3px;
		position: relative;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.22),
			0 2px 3px rgba(0, 0, 0, 0.6);
	}
	.key::after {
		content: '';
		position: absolute;
		top: 12%;
		left: 30%;
		width: 40%;
		height: 5%;
		border-radius: 2px;
		background: rgba(0, 0, 0, 0.4);
	}
	.key[data-q='red'] {
		background: linear-gradient(180deg, #ff5647, #d92c22);
	}
	.key[data-q='orange'] {
		background: linear-gradient(180deg, #ffab2e, #e07f00);
	}
	.key[data-q='yellow'] {
		background: linear-gradient(180deg, #ffe14d, #e5b800);
	}
	.key[data-q='white'] {
		background: linear-gradient(180deg, #ffffff, #d6d6d6);
	}
	/* drawn brackets, silkscreened under the row */
	.brackets {
		grid-template-columns: repeat(4, 1fr);
		margin-top: 0.75rem;
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.625rem;
		letter-spacing: 0.16em;
		color: #7c7970;
	}
	.brackets span {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}
	.brackets i {
		display: block;
		width: 100%;
		height: 6px;
		border: 1px solid #4a4a4a;
		border-top: none;
	}

	.outs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
	}
	.caption {
		font-size: 0.875rem;
		line-height: 1.5;
		color: #a5a29a;
		max-width: 46ch;
	}
	.caption em {
		font-style: normal;
		color: var(--yellow);
	}
	.trio {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.trio .silk {
		margin-right: 0.4rem;
	}
	.trio .key-btn {
		padding: 0.55rem 0.85rem;
		font-size: 0.6875rem;
	}

	/* ---------- modules ---------- */
	.module {
		position: relative;
		margin-top: clamp(2rem, 4vw, 3.2rem);
		background-color: #1a1a1a;
		background-image: var(--grain);
		border: 1px solid #303030;
		border-radius: 4px;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			0 10px 26px rgba(0, 0, 0, 0.35);
		overflow: hidden;
	}
	.module-legend {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.7rem clamp(1.2rem, 2.4vw, 2rem);
		border-bottom: 1px solid #0a0a0a;
		box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
	}
	.module-legend::before,
	.module-legend::after {
		content: '';
		width: 9px;
		height: 9px;
		flex: none;
		border-radius: 50%;
		background:
			linear-gradient(118deg, transparent 43%, #0b0b0b 43% 57%, transparent 57%),
			radial-gradient(circle at 35% 30%, #656565, #282828 70%, #161616);
	}
	.module-legend::after {
		margin-left: auto;
	}
	.module-body {
		padding: clamp(1.8rem, 4vw, 2.8rem) clamp(1.2rem, 2.4vw, 2rem) clamp(1.5rem, 3vw, 2.2rem);
	}
	.band-head {
		max-width: 62ch;
	}
	h2 {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-weight: 700;
		font-size: clamp(1.4rem, 2.4vw, 2rem);
		letter-spacing: 0.01em;
		line-height: 1.1;
		text-transform: uppercase;
		text-wrap: balance;
	}
	.band-head p {
		margin-top: 1rem;
		font-size: 1rem;
		line-height: 1.6;
		color: #b0ada5;
	}

	/* bays divided by panel seams, not floated as cards */
	.bays {
		display: grid;
		border-top: 1px solid #0a0a0a;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}
	.bays.three {
		grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
	}
	.sub-bay {
		padding: 1.4rem clamp(1.1rem, 2.2vw, 1.8rem);
	}
	.sub-bay + .sub-bay {
		border-left: 1px solid #0a0a0a;
		box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.05);
	}
	.rate-top {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.rate-stage {
		display: flex;
		justify-content: center;
		padding: 1.4rem 0 1.1rem;
	}
	.rate-stage :global(canvas) {
		background: repeating-conic-gradient(#242424 0% 25%, #1c1c1c 0% 50%) 0 0 / 12px 12px;
	}
	figcaption {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: #9b9890;
		border-top: 1px solid var(--rule);
		padding-top: 0.8rem;
	}

	/* selector plate: rows under one silkscreened header, not a bay row */
	.selector {
		margin-top: 2rem;
		border: 1px solid #0a0a0a;
		border-radius: 3px;
		background: #1e1e1e;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
		overflow: hidden;
	}
	.selector-head,
	.selector-row {
		display: grid;
		grid-template-columns: 3rem 6.5rem 1fr 1fr;
		gap: 1.2rem;
		align-items: center;
		padding: 0.85rem 1.3rem;
	}
	.selector-head {
		background: #161616;
		border-bottom: 1px solid #0a0a0a;
		box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05);
	}
	.selector-row + .selector-row {
		border-top: 1px solid #0a0a0a;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
	}
	.selector-row p {
		font-size: 0.875rem;
		line-height: 1.5;
		color: #b0ada5;
	}
	.selector-row .strain {
		color: #c9a06a;
	}
	.mode-key {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		flex: none;
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		color: #d9d5cc;
		background: linear-gradient(180deg, #2e2e2e, #1e1e1e);
		border: 1px solid #3c3c3c;
		border-radius: 3px;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}
	h3 {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 1.0625rem;
		font-weight: 700;
		letter-spacing: 0.1em;
	}
	.silk.good {
		color: #8fd66b;
	}
	.silk.bad {
		color: var(--orange);
	}

	.legends {
		display: grid;
		gap: 1px;
		margin-top: 2rem;
		background: #0a0a0a;
		border: 1px solid #0a0a0a;
		border-radius: 3px;
		overflow: hidden;
	}
	.legends li {
		display: grid;
		grid-template-columns: auto 3.4rem 1fr;
		align-items: baseline;
		gap: 1rem;
		padding: 1.05rem 1.3rem;
		background: #1e1e1e;
	}
	.lamp {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--yellow);
		box-shadow: 0 0 7px 1px rgba(255, 214, 0, 0.5);
		transform: translateY(-1px);
	}
	.legend-id {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: #8b8880;
		font-variant-numeric: tabular-nums;
	}
	.legends p {
		font-size: 0.9375rem;
		line-height: 1.5;
		color: #cfccc4;
		max-width: 70ch;
	}

	/* rear panel: one recessed plate of sockets, not five cards */
	.jackfield {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		margin-top: 2rem;
		background: #141414;
		border: 1px solid #0a0a0a;
		border-radius: 3px;
		box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.75);
	}
	.jack {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
		padding: 1.3rem 1.2rem;
	}
	.jack + .jack {
		border-left: 1px solid #0a0a0a;
		box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.04);
	}
	.socket {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: radial-gradient(circle at 50% 45%, #050505 30%, #565656 32%, #262626 68%, #101010);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.95),
			0 1px 0 rgba(255, 255, 255, 0.07);
		margin-bottom: 0.35rem;
	}
	.jack strong {
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.jack-note {
		font-size: 0.8125rem;
		color: #96938b;
	}

	/* ---------- plate ---------- */
	.plate {
		position: relative;
		margin: clamp(2rem, 4vw, 3.2rem) 0 clamp(2rem, 4vw, 3rem);
		padding: clamp(1.7rem, 3vw, 2.5rem);
		background-color: #1e1e1e;
		background-image: var(--grain), linear-gradient(180deg, #242424, #171717);
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
	}
	.plate-body {
		display: grid;
		grid-template-columns: minmax(180px, auto) 1fr auto;
		gap: clamp(1.5rem, 4vw, 3.5rem);
		align-items: center;
	}
	.plate-mark {
		font-size: clamp(1.1rem, 1.9vw, 1.5rem);
		letter-spacing: 0.06em;
	}
	.spec {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.85rem 1.6rem;
	}
	.spec dt {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: #85827a;
	}
	.spec dd {
		margin: 0.2rem 0 0;
		font-size: 0.8125rem;
		color: #d3d0c8;
	}
	.colophon {
		margin-top: 1.6rem;
		padding-top: 1rem;
		border-top: 1px solid var(--rule);
		font-size: 0.75rem;
		color: #6f6c65;
		max-width: 70ch;
	}

	@media (max-width: 900px) {
		.hero,
		.plate-body {
			grid-template-columns: 1fr;
		}
		.selector-head {
			display: none;
		}
		.selector-row {
			grid-template-columns: 3rem 1fr;
			gap: 0.5rem 1.2rem;
			row-gap: 0.5rem;
		}
		.selector-row p {
			grid-column: 2;
		}
		.head nav {
			display: none;
		}
	}
	/* on a phone the machine leads; the pitch follows it */
	@media (max-width: 720px) {
		.hero {
			padding-top: 1.6rem;
			gap: 1.4rem;
		}
		/* headline, then the machine, then the rest of the pitch */
		.pitch {
			display: contents;
		}
		h1 {
			order: -2;
		}
		.machine {
			order: -1;
		}
		.lede {
			margin-top: 0;
		}
		.head .key-btn {
			padding: 0.55rem 0.7rem;
			font-size: 0.625rem;
			letter-spacing: 0.06em;
			white-space: nowrap;
		}
		.readouts {
			gap: 1rem;
		}
		.meter.stage {
			margin-left: 0;
		}
		.brackets span:not(:first-child) {
			color: transparent;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.key-btn {
			transition: none;
		}
	}
</style>
