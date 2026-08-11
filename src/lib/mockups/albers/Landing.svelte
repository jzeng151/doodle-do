<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	// Plate i is a real Albers exercise and a real product fact at the same
	// time: one unchanged drawing, four grounds, four apparent colours.
	const GROUNDS = [
		{ hex: '#b83e19', name: 'vermilion' },
		{ hex: '#2f5aa8', name: 'ultramarine' },
		{ hex: '#d9a02b', name: 'ochre' },
		{ hex: '#636f2e', name: 'olive' }
	];

	const MODES = [
		{ n: 'focus', k: '1', f: '#b83e19', ink: 'paper', great: 'drawing one frame with onion-skin context', bad: 'comparing many frames at once' },
		{ n: 'grid', k: '2', f: '#2f5aa8', ink: 'paper', great: 'seeing and editing every frame side by side', bad: 'detail work on a single frame' },
		{ n: 'loop', k: '3', f: '#636f2e', ink: 'paper', great: 'judging the motion at full speed', bad: 'you need to draw; switch back to edit' }
	];

	const NOTES = [
		['T06', 'great pixel art usually uses surprisingly few colors. limits make choices easier.'],
		['T08', 'every pixel using that color just updated. recolor whole characters this way.'],
		['T02', 'the red ghost is your previous frame. draw where things have moved to, not where they were.'],
		['T15', 'a project file on disk is the only copy you truly own.']
	];

	const OUT = [
		['i', 'name.png', 'sprite sheet on a uniform grid'],
		['ii', 'name.json', 'texturepacker atlas. loads in stock phaser'],
		['iii', 'name.doodledo.json', 'frameSize, fps, per-frame rects'],
		['iv', 'name.gif', 'animated, per-frame delays'],
		['v', 'name-frames.zip', 'one png per frame']
	];

	const FACTS = [
		['palette', '16 to start, 64 ceiling'],
		['alpha', '1-bit. no soft edges'],
		['stroke → loop', '0.1 ms p95 / 16 ms budget'],
		['storage', 'local autosave + a file on disk']
	];

	const RATES = [
		[4, '#b83e19', 'choppy. every pose readable.'],
		[8, '#d9a02b', 'the classic rate. four drawings.'],
		[16, '#636f2e', 'smoother, and twice the drawing.']
	] as const;
</script>

<div class="mock study">
	<header class="head">
		<span class="mark">doodle&#8209;do</span>
		<nav>
			<a href="#i">i</a><a href="#ii">ii</a><a href="#iii">iii</a><a href="#iv">iv</a><a href="#v">v</a>
		</nav>
		<a class="act" href="#i">start drawing</a>
	</header>

	<section class="opening">
		<h1>colour is relative.<br />so is every frame.</h1>
		<p class="lede">
			Frame-by-frame pixel animation in the browser. The loop plays while you draw, the palette
			stays locked to a handful of colours, and the tool explains what it is teaching you.
		</p>
		<div class="acts">
			<a class="act" href="#i">start drawing</a>
			<a class="act ghost" href="#iv">see the output</a>
		</div>
		<p class="fine">no account &middot; nothing uploaded &middot; no ai &middot; runs offline</p>
	</section>

	<section class="plate" id="i">
		<div class="fields four">
			{#each GROUNDS as g (g.hex)}
				<div class="field" style="background: {g.hex}">
					<Sprite playing scale={9} />
				</div>
			{/each}
		</div>
		<div class="legend">
			<span class="no">plate i</span>
			<p>
				one drawing, unchanged, on four grounds. it is the same sixteen palette indices in every
				panel; only the field behind them moved. this is why a locked palette is not a restriction
				but the thing that makes a sprite hold together.
			</p>
		</div>
	</section>

	<section class="plate" id="ii">
		<div class="chips">
			{#each PALETTE as hex, i (hex)}
				<div class="chip">
					<span class="patch" style="background: {hex}"></span>
					<span class="idx">{String(i + 1).padStart(2, '0')}</span>
				</div>
			{/each}
		</div>
		<div class="legend">
			<span class="no">plate ii</span>
			<p>
				the starter case: sixteen colours, sixty-four at the ceiling. swap any one of them and
				every pixel using it updates at once, so a whole character can be recoloured in a single
				move.
			</p>
		</div>
	</section>

	<section class="plate" id="iii">
		<div class="fields three">
			{#each RATES as [fps, hex, note] (fps)}
				<div class="field tall" class:dark-ink={hex === '#d9a02b'} style="background: {hex}">
					<Sprite playing {fps} scale={7} />
					<span class="rate">{fps}<i>fps</i></span>
					<span class="rate-note">{note}</span>
				</div>
			{/each}
		</div>
		<div class="legend">
			<span class="no">plate iii</span>
			<p>
				the same four drawings, clocked three ways. nothing was redrawn between these fields; only
				the rate changed. smoothness comes from the in-betweens, not the tempo.
			</p>
		</div>
	</section>

	<section class="plate" id="iv">
		<div class="fields three">
			{#each MODES as m (m.n)}
				<article class="field mode" style="background: {m.f}">
					<span class="key">{m.k}</span>
					<h2>{m.n}</h2>
					<dl>
						<dt>great at</dt><dd>{m.great}</dd>
						<dt>strains when</dt><dd>{m.bad}</dd>
					</dl>
				</article>
			{/each}
		</div>
		<div class="legend">
			<span class="no">plate iv</span>
			<p>
				three views over one session. switching preserves the document, frame, zoom, and palette.
				each field carries what it is bad at, because a study that only records successes teaches
				nothing.
			</p>
		</div>
	</section>

	<section class="plate" id="v">
		<ul class="notes">
			{#each NOTES as [id, copy] (id)}
				<li><span class="nid">{id}</span><p>{copy}</p></li>
			{/each}
		</ul>
		<div class="legend">
			<span class="no">plate v</span>
			<p>
				twenty-six notes, wired to what you just did. one at a time, never a dialog, each capped so
				it stops on its own, and every one dismissible for good.
			</p>
		</div>
	</section>

	<section class="plate" id="vi">
		<table class="out">
			<tbody>
				{#each OUT as [n, file, what] (n)}
					<tr><td class="rn">{n}</td><td class="fn">{file}</td><td>{what}</td></tr>
				{/each}
			</tbody>
		</table>
		<div class="legend">
			<span class="no">plate vi</span>
			<p>
				five files come out. sheet export is checked against the engines rather than asserted: one
				test loads a real export in stock phaser, another imports it into stock godot.
			</p>
		</div>
	</section>

	<footer class="close">
		<dl class="facts">
			{#each FACTS as [k, v] (k)}
				<div><dt>{k}</dt><dd>{v}</dd></div>
			{/each}
		</dl>
		<a class="act big" href="#i">start drawing</a>
		<p class="colophon">
			the figure is a four-frame walk cycle authored for these plates from the sixteen-colour
			starter palette.
		</p>
	</footer>
</div>

<style>
	.study {
		--paper: #e8e2d4;
		--ink: #1d1b17;
		--sub: #57534a;
		--vermilion: #b83e19;
		--ultramarine: #2f5aa8;
		--ochre: #d9a02b;
		--olive: #636f2e;
		min-height: 100%;
		background: var(--paper);
		color: var(--ink);
		font-family: Jost, system-ui, sans-serif;
		font-size: 16px;
		line-height: 1.55;
		font-weight: 400;
		padding: 0 clamp(1rem, 5vw, 5rem);
	}
	/* no chrome anywhere: no border, no shadow, no texture. only fields. */

	.head {
		display: flex;
		align-items: baseline;
		gap: clamp(1rem, 3vw, 2.5rem);
		padding: 1.4rem 0 1.1rem;
	}
	.mark {
		font-size: 1.0625rem;
		font-weight: 500;
		letter-spacing: 0.02em;
	}
	.head nav {
		display: flex;
		gap: 1rem;
		margin-right: auto;
	}
	.head nav a {
		font-size: 0.875rem;
		color: var(--sub);
		text-decoration: none;
	}
	.head nav a:hover {
		color: var(--ink);
	}

	.act {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 1.15rem;
		font-size: 0.9375rem;
		font-weight: 500;
		text-decoration: none;
		color: var(--paper);
		background: var(--vermilion);
	}
	.act:hover {
		background: #94300f;
	}
	.act.ghost {
		color: var(--ink);
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--ink);
	}
	.act.ghost:hover {
		color: var(--paper);
		background: var(--ink);
	}
	.act.big {
		padding: 0.95rem 1.7rem;
		font-size: 1.0625rem;
	}

	.opening {
		padding: clamp(2rem, 6vw, 5rem) 0 clamp(2rem, 4vw, 3rem);
		max-width: 46ch;
	}
	h1 {
		font-size: clamp(2rem, 4.4vw, 3.4rem);
		font-weight: 400;
		line-height: 1.06;
		letter-spacing: -0.015em;
	}
	.lede {
		margin-top: 1.4rem;
		font-size: 1.0625rem;
		color: var(--sub);
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.9rem;
	}
	.fine {
		margin-top: 1.1rem;
		font-size: 0.875rem;
		color: var(--sub);
	}

	/* a plate is a band of flat fields with its legend set beneath */
	.plate {
		padding-bottom: clamp(2.5rem, 5vw, 4rem);
	}
	.fields {
		display: grid;
		gap: 0;
	}
	.fields.four {
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	}
	.fields.three {
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
	}
	.field {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
	}
	.field.tall {
		align-content: center;
		gap: 0.7rem;
		aspect-ratio: 4 / 5;
		padding: 1.2rem;
		text-align: center;
	}
	.rate {
		font-size: 2.4rem;
		font-weight: 300;
		line-height: 1;
		color: #f3efe6;
	}
	.rate i {
		font-style: normal;
		font-size: 0.875rem;
		margin-left: 0.3em;
	}
	.rate-note {
		font-size: 0.875rem;
		color: #f3efe6;
		max-width: 22ch;
	}
	/* a light field takes dark ink; the rule is contrast, not a house colour */
	.field.dark-ink .rate,
	.field.dark-ink .rate-note {
		color: #141210;
	}

	.legend {
		display: grid;
		grid-template-columns: 6rem 1fr;
		gap: 1.2rem;
		padding-top: 0.9rem;
	}
	.no {
		font-size: 0.8125rem;
		color: var(--sub);
	}
	.legend p {
		max-width: 68ch;
		font-size: 0.9375rem;
		color: var(--sub);
	}

	.chips {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
	}
	.chip {
		display: grid;
	}
	.patch {
		aspect-ratio: 1;
	}
	.idx {
		padding: 4px 0 0 2px;
		font-size: 0.6875rem;
		color: var(--sub);
	}

	.mode {
		align-content: start;
		justify-items: start;
		gap: 0.5rem;
		aspect-ratio: auto;
		min-height: 260px;
		padding: 1.3rem;
		color: #f3efe6;
		text-align: left;
	}
	.key {
		font-size: 0.8125rem;
		color: #f3efe6;
	}
	.mode h2 {
		font-size: 1.5rem;
		font-weight: 400;
		line-height: 1;
	}
	.mode dl {
		margin-top: 0.6rem;
	}
	.mode dt {
		margin-top: 0.8rem;
		font-size: 0.8125rem;
		color: #f3efe6;
		opacity: 0.92;
	}
	.mode dd {
		margin: 0.15rem 0 0;
		font-size: 0.9375rem;
	}

	.notes {
		display: grid;
		gap: 0;
	}
	.notes li {
		display: grid;
		grid-template-columns: 6rem 1fr;
		gap: 1.2rem;
		padding: 1rem 0;
		border-top: 1px solid rgba(29, 27, 23, 0.16);
	}
	.notes li:last-child {
		border-bottom: 1px solid rgba(29, 27, 23, 0.16);
	}
	.nid {
		font-size: 0.8125rem;
		color: var(--vermilion);
	}
	.notes p {
		max-width: 70ch;
		font-size: 1rem;
	}

	.out {
		width: 100%;
		border-collapse: collapse;
	}
	.out td {
		padding: 0.7rem 0;
		font-size: 0.9375rem;
		border-top: 1px solid rgba(29, 27, 23, 0.16);
		vertical-align: baseline;
	}
	.out tr:last-child td {
		border-bottom: 1px solid rgba(29, 27, 23, 0.16);
	}
	.rn {
		width: 6rem;
		color: var(--sub);
	}
	.fn {
		width: 16rem;
		color: var(--ultramarine);
	}

	.close {
		display: grid;
		justify-items: start;
		gap: 1.6rem;
		padding: clamp(1.5rem, 3vw, 2.5rem) 0 clamp(2rem, 4vw, 3rem);
		border-top: 1.5px solid var(--ink);
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 1rem 2rem;
		width: 100%;
	}
	.facts dt {
		font-size: 0.8125rem;
		color: var(--sub);
	}
	.facts dd {
		margin: 0.15rem 0 0;
		font-size: 0.9375rem;
	}
	.colophon {
		font-size: 0.8125rem;
		color: var(--sub);
		max-width: 70ch;
	}

	@media (max-width: 700px) {
		.legend,
		.notes li {
			grid-template-columns: 1fr;
			gap: 0.4rem;
		}
		.head nav {
			display: none;
		}
	}
</style>
