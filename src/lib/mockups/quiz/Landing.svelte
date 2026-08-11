<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const MODES = [
		{ l: 'a', n: 'FOCUS', k: '1', great: 'drawing one frame with onion-skin context', bad: 'comparing lots of frames at once' },
		{ l: 'b', n: 'GRID', k: '2', great: 'seeing and editing every frame side by side', bad: 'detail work on a single frame' },
		{ l: 'c', n: 'LOOP', k: '3', great: 'judging the motion at full speed', bad: 'you need to draw. switch back!' }
	];

	const SCRAWLS = [
		['T02', 'The red ghost is your previous frame. Draw where things have moved to, not where they were.'],
		['T06', 'Great pixel art usually uses surprisingly few colors. Limits make choices easier.'],
		['T10', "Longer isn't always better. A tight 4-frame loop often reads better than a loose 8."],
		['T15', 'A project file on disk is the only copy you truly own.']
	];

	const TOOLS = [
		['a', 'PENCIL', 'B'],
		['b', 'ERASER', 'E'],
		['c', 'FILL', 'G'],
		['d', 'PICK', 'I'],
		['e', 'SELECT', 'M'],
		['f', 'LASSO', 'L'],
		['g', 'WAND', 'W'],
		['h', 'POLYGON', 'P']
	];

	const OUT = [
		['name.png', 'sprite sheet, uniform grid'],
		['name.json', 'texturepacker atlas — loads in stock Phaser'],
		['name.doodledo.json', 'frameSize, fps, per-frame rects'],
		['name.gif', 'animated, per-frame delays'],
		['name-frames.zip', 'one PNG per frame']
	];

	const RATES = [
		[4, 'choppy! every pose readable'],
		[8, 'the classic. four drawings'],
		[16, 'smoother — and twice the work']
	] as const;
</script>

<div class="mock spread">
	<header class="mast">
		<span class="logo">DOODLE&#8209;DO</span>
		<span class="flash">4 FRAMES!</span>
		<nav>
			<a href="#q1">Q1</a><a href="#q2">Q2</a><a href="#scrawl">NOTES</a><a href="#verdict">VERDICT</a>
		</nav>
		<a class="btn" href="#top">START DRAWING</a>
	</header>

	<section class="top-spread" id="top">
		<div class="headline">
			<h1><span>SO YOU</span> <span>CAN'T</span> <span class="hi">DRAW?</span></h1>
			<p class="stand">
				Frame-by-frame pixel animation in the browser. The loop never stops while you work, and
				the tool tells you what it is teaching you. Four drawings is a walk cycle. Really.
			</p>
			<div class="acts">
				<a class="btn big" href="#top">START DRAWING</a>
				<a class="btn ghost big" href="#out">WHAT YOU GET</a>
			</div>
			<p class="small">no account &middot; nothing uploaded &middot; no AI &middot; works offline</p>
		</div>

		<figure class="photo">
			<div class="tone" aria-hidden="true"></div>
			<div class="cut"><Sprite playing scale={12} /></div>
			<span class="circle" aria-hidden="true"></span>
			<figcaption class="scrawl">it's already looping →</figcaption>
		</figure>
	</section>

	<section class="q" id="q1">
		<h2 class="qhead"><span class="qno">Q1</span>Does frame rate make it smoother?</h2>
		<div class="options three">
			{#each RATES as [fps, note] (fps)}
				<label class="opt">
					<span class="box" aria-hidden="true"></span>
					<span class="stage"><Sprite playing {fps} scale={6} /></span>
					<b>{fps} fps</b>
					<span>{note}</span>
				</label>
			{/each}
		</div>
		<p class="answer">
			<b>No.</b> Same four drawings in all three. Nothing was redrawn; only the rate changed.
			Smoothness comes from good in-betweens, not from the clock.
		</p>
	</section>

	<section class="q" id="q2">
		<h2 class="qhead"><span class="qno">Q2</span>Which view are you working in?</h2>
		<ul class="options list">
			{#each MODES as m (m.n)}
				<li class="opt row">
					<span class="letter">{m.l}</span>
					<div>
						<b>{m.n}<i>key {m.k}</i></b>
						<span class="good">great at {m.great}</span>
						<span class="bad">strains when {m.bad}</span>
					</div>
				</li>
			{/each}
		</ul>
		<p class="answer">
			<b>All three.</b> They are the same session seen three ways: switch and your frame, zoom,
			palette, and history stay exactly where you left them.
		</p>
	</section>

	<section class="q" id="tools">
		<h2 class="qhead"><span class="qno">Q3</span>Tick everything you get</h2>
		<ul class="ticks">
			{#each TOOLS as [l, n, k] (n)}
				<li><span class="box ticked" aria-hidden="true"></span><span class="letter sm">{l}</span>{n}<i>{k}</i></li>
			{/each}
		</ul>
		<p class="answer"><b>All of them.</b> Plus onion skin, mirror-draw, layers, and undo that never runs out.</p>
	</section>

	<section class="q" id="scrawl">
		<h2 class="qhead"><span class="qno">Q4</span>Does it actually teach you anything?</h2>
		<ul class="scrawls">
			{#each SCRAWLS as [id, copy] (id)}
				<li><span class="nid">{id}</span><p>{copy}</p></li>
			{/each}
		</ul>
		<p class="answer">
			<b>Twenty-six times.</b> Each note fires from something you just did, shows once, never
			blocks, and can be switched off forever.
		</p>
	</section>

	<section class="q" id="out">
		<h2 class="qhead"><span class="qno">Q5</span>What comes out at the end?</h2>
		<ul class="files">
			{#each OUT as [f, what] (f)}
				<li><b>{f}</b><span>{what}</span></li>
			{/each}
		</ul>
		<p class="answer">
			Checked against the engines rather than asserted: one test loads a real export in stock
			Phaser, another imports it into stock Godot.
		</p>
	</section>

	<footer class="verdict" id="verdict">
		<span class="vlabel">YOUR RESULT</span>
		<h2>You are an animator who has not started yet.</h2>
		<dl class="facts">
			<div><dt>PALETTE</dt><dd>16 to start, 64 max</dd></div>
			<div><dt>ALPHA</dt><dd>1-bit, no soft edges</dd></div>
			<div><dt>STROKE → LOOP</dt><dd>0.1 ms p95 / 16 ms budget</dd></div>
			<div><dt>STORAGE</dt><dd>local autosave + a file on disk</dd></div>
		</dl>
		<a class="btn big" href="#top">START DRAWING</a>
		<p class="small dark">
			Figure is a four-frame walk cycle authored for this spread from the sixteen-colour starter
			palette.
		</p>
	</footer>
</div>

<style>
	.spread {
		--paper: #f7f4ec;
		--ink: #17161a;
		--pink: #ff2d8a;
		--green: #b6e021;
		--gel: #8d8fa8;
		--sub: #55535e;
		--halftone: radial-gradient(circle at 50% 50%, #17161a 1.5px, transparent 1.6px);
		min-height: 100%;
		background: var(--paper);
		color: var(--ink);
		font-family: 'Nunito Sans', system-ui, sans-serif;
		font-size: 15px;
		line-height: 1.55;
		padding: 0 clamp(0.9rem, 3.5vw, 3.5rem);
		overflow-x: hidden;
	}

	.mast {
		display: flex;
		align-items: center;
		gap: clamp(0.7rem, 2.5vw, 2rem);
		padding: 0.9rem 0;
		border-bottom: 5px solid var(--ink);
	}
	.logo {
		font-family: 'Lilita One', system-ui, sans-serif;
		font-size: clamp(1.2rem, 2.4vw, 1.8rem);
		letter-spacing: 0.01em;
	}
	.flash {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		color: var(--ink);
		background: var(--green);
		padding: 0.2rem 0.5rem;
		transform: rotate(-4deg);
	}
	.mast nav {
		display: flex;
		gap: clamp(0.6rem, 1.6vw, 1.3rem);
		margin-left: auto;
	}
	.mast nav a {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: var(--ink);
		text-decoration: none;
	}
	.mast nav a:hover {
		color: var(--pink);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 1.15rem;
		font-family: 'Lilita One', sans-serif;
		font-size: 0.875rem;
		letter-spacing: 0.04em;
		text-decoration: none;
		color: var(--paper);
		background: var(--pink);
		border: 3px solid var(--ink);
	}
	.btn:hover {
		background: #e21f77;
	}
	.btn.ghost {
		color: var(--ink);
		background: var(--green);
	}
	.btn.ghost:hover {
		background: #a3ca17;
	}
	.btn.big {
		padding: 0.9rem 1.6rem;
		font-size: 1.0625rem;
	}

	.top-spread {
		display: grid;
		grid-template-columns: minmax(280px, 1.05fr) minmax(240px, 0.95fr);
		gap: clamp(1.4rem, 3.5vw, 3rem);
		align-items: center;
		padding: clamp(1.6rem, 4vw, 3rem) 0;
	}
	h1 {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2em;
		font-family: 'Lilita One', sans-serif;
		font-size: clamp(2.3rem, 5.6vw, 4.2rem);
		line-height: 0.98;
		letter-spacing: 0.005em;
	}
	h1 span {
		display: inline-block;
	}
	h1 .hi {
		color: var(--paper);
		background: var(--pink);
		padding: 0 0.12em;
		transform: rotate(-2deg);
	}
	.stand {
		max-width: 40ch;
		margin-top: 1.2rem;
		font-size: 1.0625rem;
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.6rem;
	}
	.small {
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: var(--sub);
	}
	.small.dark {
		color: rgba(247, 244, 236, 0.72);
	}

	/* a torn-edge photo block: halftone crush behind a cut-out figure */
	.photo {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 300px;
		padding: 2rem 1rem 2.6rem;
		background: var(--green);
		border: 4px solid var(--ink);
		clip-path: polygon(
			0% 3%, 6% 0%, 20% 2%, 38% 0%, 55% 3%, 72% 0%, 88% 2%, 100% 0%,
			100% 97%, 92% 100%, 74% 97%, 56% 100%, 40% 97%, 22% 100%, 8% 98%, 0% 100%
		);
	}
	.tone {
		position: absolute;
		inset: 0;
		background-image: var(--halftone);
		background-size: 7px 7px;
		opacity: 0.4;
	}
	.cut {
		position: relative;
		padding: 10px;
		background: var(--paper);
		border: 4px solid var(--ink);
		transform: rotate(-2.5deg);
		box-shadow: 7px 7px 0 var(--ink);
	}
	.scrawl {
		position: absolute;
		right: 8%;
		bottom: 10px;
		font-family: 'Gochi Hand', cursive;
		font-size: 1.35rem;
		color: var(--ink);
		transform: rotate(-5deg);
	}
	/* the gel-pen ring the reader draws round their answer */
	.circle {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 62%;
		height: 62%;
		transform: translate(-52%, -52%) rotate(-8deg);
		border: 4px solid var(--pink);
		border-radius: 52% 48% 46% 54% / 50% 54% 46% 50%;
		opacity: 0.85;
		pointer-events: none;
	}

	.q {
		padding: clamp(1.6rem, 3.5vw, 2.6rem) 0 0;
		border-top: 3px solid var(--ink);
	}
	.qhead {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		font-family: 'Lilita One', sans-serif;
		font-size: clamp(1.25rem, 2.4vw, 1.9rem);
		line-height: 1.1;
	}
	.qno {
		flex: none;
		padding: 0.1rem 0.45rem;
		font-size: 0.8125rem;
		color: var(--paper);
		background: var(--ink);
	}

	.options {
		margin-top: 1.3rem;
	}
	.options.three {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 0.8rem;
	}
	.opt {
		display: grid;
		justify-items: center;
		gap: 0.4rem;
		padding: 0.9rem;
		background: var(--paper);
		border: 3px solid var(--ink);
		text-align: center;
	}
	.box {
		width: 17px;
		height: 17px;
		justify-self: start;
		border: 3px solid var(--ink);
	}
	.box.ticked {
		background:
			linear-gradient(45deg, transparent 42%, var(--pink) 42% 58%, transparent 58%),
			linear-gradient(-45deg, transparent 42%, var(--pink) 42% 58%, transparent 58%);
	}
	.opt .stage {
		padding: 0.6rem 1.1rem;
		background: var(--green);
		border: 3px solid var(--ink);
	}
	.opt .stage :global(canvas) {
		background: transparent;
	}
	.opt b {
		font-family: 'Lilita One', sans-serif;
		font-size: 1.125rem;
	}
	.opt span:last-child {
		font-size: 0.8125rem;
		color: var(--sub);
	}

	.options.list {
		display: grid;
		gap: 0.6rem;
	}
	.opt.row {
		grid-template-columns: auto 1fr;
		justify-items: start;
		gap: 0.9rem;
		text-align: left;
	}
	.letter {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		flex: none;
		font-family: 'Lilita One', sans-serif;
		font-size: 1rem;
		color: var(--ink);
		background: var(--green);
		border: 3px solid var(--ink);
		border-radius: 50%;
	}
	.letter.sm {
		width: 20px;
		height: 20px;
		font-size: 0.75rem;
		border-width: 2px;
	}
	.opt.row b {
		display: block;
		font-size: 1.0625rem;
	}
	.opt.row b i {
		font-family: 'Nunito Sans', sans-serif;
		font-style: normal;
		font-weight: 400;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		margin-left: 0.6em;
		color: var(--sub);
	}
	.good,
	.bad {
		display: block;
		font-size: 0.875rem;
	}
	.good {
		color: var(--sub);
	}
	.bad {
		color: #b3005c;
	}

	.ticks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.5rem 0.9rem;
		margin-top: 1.3rem;
	}
	.ticks li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-family: 'Lilita One', sans-serif;
		font-size: 0.9375rem;
	}
	.ticks i {
		font-family: 'Nunito Sans', sans-serif;
		font-style: normal;
		font-size: 0.6875rem;
		color: var(--sub);
		margin-left: auto;
	}

	.scrawls {
		display: grid;
		gap: 0.9rem;
		margin-top: 1.3rem;
	}
	.scrawls li {
		display: grid;
		grid-template-columns: 3.4rem 1fr;
		gap: 0.8rem;
		align-items: baseline;
	}
	.nid {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.75rem;
		color: var(--pink);
	}
	.scrawls p {
		font-family: 'Gochi Hand', cursive;
		font-size: 1.2rem;
		line-height: 1.35;
		max-width: 62ch;
	}

	.files {
		display: grid;
		margin-top: 1.3rem;
		border-top: 2px solid var(--ink);
	}
	.files li {
		display: grid;
		grid-template-columns: minmax(9rem, 15rem) 1fr;
		gap: 1rem;
		align-items: baseline;
		padding: 0.6rem 0;
		border-bottom: 2px solid var(--ink);
	}
	.files b {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.9375rem;
		color: var(--pink);
	}
	.files span {
		font-size: 0.875rem;
	}

	.answer {
		margin-top: 1.1rem;
		padding: 0.75rem 0.9rem;
		max-width: 78ch;
		font-size: 0.9375rem;
		background: var(--green);
		border: 3px solid var(--ink);
	}
	.answer b {
		font-family: 'Lilita One', sans-serif;
	}

	.verdict {
		display: grid;
		justify-items: start;
		gap: 1.2rem;
		margin: clamp(2rem, 4vw, 3rem) 0 clamp(1.5rem, 3vw, 2.5rem);
		padding: clamp(1.5rem, 3.5vw, 2.6rem);
		background: var(--ink);
		color: var(--paper);
	}
	.vlabel {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		color: var(--ink);
		background: var(--green);
		padding: 0.15rem 0.5rem;
	}
	.verdict h2 {
		font-family: 'Lilita One', sans-serif;
		font-size: clamp(1.5rem, 3.4vw, 2.6rem);
		line-height: 1.06;
		max-width: 20ch;
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 1rem 2rem;
		width: 100%;
	}
	.facts dt {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		color: var(--green);
	}
	.facts dd {
		margin: 0.2rem 0 0;
		font-size: 0.875rem;
	}

	@media (max-width: 780px) {
		.top-spread {
			grid-template-columns: 1fr;
		}
		.mast nav {
			display: none;
		}
	}
</style>
