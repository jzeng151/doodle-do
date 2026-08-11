<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const FRAMES = 4;
	const current = 1;
	const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
	const TOOLS = [
		['PENCIL', 'B'],
		['ERASER', 'E'],
		['FILL', 'G'],
		['PICK', 'I'],
		['SELECT', 'M'],
		['LASSO', 'L'],
		['WAND', 'W'],
		['POLY', 'P']
	];
	const LAYERS = [
		{ n: 'Highlights', on: true },
		{ n: 'Character', on: true, active: true },
		{ n: 'Sketch', on: false }
	];
</script>

<div class="mock shell">
	<header class="rail">
		<span class="mark">DOODLE&#8209;DO</span>
		<div class="stones" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">FORME</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">Autosaved 14:32:08</span>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="ink">SAVE</button>
			<button>SHEET</button><button>GIF</button><button class="on">NOTES</button>
		</div>
	</header>

	<div class="toolbar">
		<div class="grp" role="group" aria-label="Tools">
			{#each TOOLS as [n, k] (n)}
				<button class:on={n === 'PENCIL'}>{n}<i>{k}</i></button>
			{/each}
		</div>
		<div class="grp">
			<span class="lab">BODY</span>
			<div class="seg">{#each [1, 2, 3, 4] as s (s)}<button class:on={s === 2}>{s}</button>{/each}</div>
			<button>MIRROR</button>
		</div>
		<div class="grp"><button>FLIP H</button><button>FLIP V</button></div>
		<div class="grp">
			<button class="on">ONION</button>
			<input class="slider" type="range" min="0" max="100" value="35" aria-label="Onion skin opacity" />
			<span class="val">0.35</span>
		</div>
		<div class="grp right">
			<button>&minus;</button><span class="val">18×</span><button>+</button><button class="on">GRID</button>
		</div>
	</div>

	<div class="middle">
		<div class="stone">
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="cap">FRAME II OF IV &middot; 16 × 16 &middot; ONION ON</p>
		</div>

		<aside class="side">
			<section class="panel">
				<h2>IMPRESSION</h2>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<p class="meta">8 per second &middot; four frames &middot; 500 ms</p>
			</section>
			<section class="panel">
				<h2>LAYERS</h2>
				<ul class="layers">
					{#each LAYERS as l (l.n)}
						<li class:active={l.active}>
							<span class="tick" class:on={l.on} aria-hidden="true"></span>{l.n}
						</li>
					{/each}
				</ul>
				<button class="wide">MERGE DOWN</button>
			</section>
			<section class="panel">
				<h2>THE CASE<button class="chip on">LOCKED</button></h2>
				<div class="typecase">
					<button class="box empty" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="box" class:sel={i === 6} style="--c: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<p class="meta">Sixteen of sixty-four &middot; locked to the starter case</p>
			</section>
		</aside>
	</div>

	<footer class="galley">
		<div class="galley-head">
			<span class="lab">THE GALLEY</span>
			<div class="ops">
				<button>NEW</button><button>DUPLICATE</button><button>DELETE</button>
				<span class="lab loop">LOOP I → IV</span>
				<label class="ms"><span class="lab">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="sorts">
			{#each { length: 10 } as _, i (i)}
				<li>
					{#if i < FRAMES}
						<button class="sort" class:sel={i === current}><Sprite frame={i} scale={3} /></button>
					{:else}
						<span class="sort blank"></span>
					{/if}
					<span class="nick">{ROMAN[i]}</span>
				</li>
			{/each}
		</ol>
	</footer>

	<div class="note-slip" role="status">
		<span class="ref">T02</span>
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button class="x" aria-label="Dismiss note">×</button>
	</div>
</div>

<style>
	.shell {
		--wood: #a8783f;
		--wood-dk: #74522a;
		--lead: #7b7f83;
		--lead-dk: #565b60;
		--paper: #ece5d6;
		--paper-lt: #f6f1e6;
		--ink: #17140f;
		--spot: #b8351f;
		--grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='320'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8 0.014' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='70' height='320' filter='url(%23g)' opacity='0.5'/%3E%3C/svg%3E");
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
		font-family: Petrona, Georgia, serif;
		font-size: 14px;
		position: relative;
	}
	.lab,
	.val {
		font-size: 0.625rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #6d6455;
		white-space: nowrap;
	}
	.val {
		color: var(--spot);
		min-width: 3em;
		text-align: center;
	}

	button {
		padding: 0.35rem 0.6rem;
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 0.5625rem;
		letter-spacing: 0.1em;
		color: var(--ink);
		background: var(--paper-lt);
		border: 2px solid var(--ink);
		box-shadow: 1px 1px 0 rgba(23, 20, 15, 0.3);
	}
	button:hover {
		background: #fffaf0;
	}
	button.on {
		color: var(--paper-lt);
		background: var(--ink);
	}
	button.ink {
		color: var(--paper-lt);
		background: var(--spot);
		border-color: #7d2214;
	}
	input {
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--ink);
		background: var(--paper-lt);
		border: 2px solid var(--ink);
		padding: 0.2rem 0.45rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--spot);
		outline-offset: 2px;
	}
	.slider {
		width: 74px;
		padding: 0;
		border: none;
		accent-color: var(--spot);
	}

	.rail {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.5rem 0.85rem;
		background-color: var(--wood-dk);
		background-image: var(--grain);
		border-bottom: 4px solid var(--ink);
		color: var(--paper-lt);
	}
	.mark {
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 0.9375rem;
		text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
	}
	.stones,
	.ops {
		display: flex;
		gap: 3px;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.title .lab {
		color: #efe3cd;
	}
	.title input {
		width: 9em;
	}
	.status {
		flex: 1;
		font-size: 0.75rem;
		color: #efe3cd;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		padding: 0.55rem 0.85rem;
		background: var(--paper-lt);
		border-bottom: 3px double var(--ink);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.grp + .grp {
		padding-left: 1rem;
		border-left: 1px solid #cfc6b1;
	}
	.grp.right {
		margin-left: auto;
	}
	.grp button i {
		font-style: normal;
		font-size: 0.5rem;
		margin-left: 0.4em;
		opacity: 0.6;
	}
	.seg {
		display: flex;
		gap: 2px;
	}

	.middle {
		display: flex;
		flex: 1;
		min-height: 0;
	}
	.stone {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.1rem;
		padding: clamp(1rem, 3vw, 2.4rem);
		background-color: var(--lead-dk);
		background-image: var(--grain);
	}
	.board {
		padding: 12px;
		background: var(--paper-lt);
		border: 4px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.35);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e2dac6 0% 25%, #f2ecdd 0% 50%) 0 0 / 16px 16px;
	}
	.cap {
		padding: 0.3rem 0.7rem;
		background: var(--paper-lt);
		border: 2px solid var(--ink);
		font-size: 0.625rem;
		letter-spacing: 0.16em;
	}

	.side {
		width: 232px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		background-color: var(--wood);
		background-image: var(--grain);
		overflow-y: auto;
	}
	.panel {
		padding: 0.85rem;
		background: var(--paper-lt);
		border: 3px solid var(--ink);
		box-shadow: 3px 3px 0 rgba(23, 20, 15, 0.3);
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		margin-bottom: 0.8rem;
		font-family: 'Alfa Slab One', Georgia, serif;
		font-size: 0.6875rem;
		letter-spacing: 0.14em;
		border-bottom: 3px double var(--ink);
	}
	.chip {
		padding: 0.1rem 0.35rem;
		font-size: 0.5rem;
		border-width: 1px;
		box-shadow: none;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.8rem;
		background: repeating-conic-gradient(#e2dac6 0% 25%, #f2ecdd 0% 50%) 0 0 / 12px 12px;
		border: 2px solid var(--ink);
	}
	.meta {
		margin-top: 0.55rem;
		font-size: 0.75rem;
		color: #6d6455;
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		font-size: 0.875rem;
	}
	.layers li.active {
		background: #e3d9c4;
		box-shadow: inset 0 0 0 2px var(--ink);
	}
	.tick {
		width: 12px;
		height: 12px;
		flex: none;
		border: 2px solid var(--ink);
		background: var(--paper-lt);
	}
	.tick.on {
		background: var(--spot);
	}
	.wide {
		width: 100%;
		margin-top: 0.6rem;
	}

	/* the case: compartments routed into wood, one sort to a box */
	.typecase {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 3px;
		padding: 5px;
		background-color: var(--wood);
		background-image: var(--grain);
		border: 3px solid var(--wood-dk);
	}
	.box {
		aspect-ratio: 5 / 4;
		padding: 0;
		background: var(--c);
		border: 1px solid var(--wood-dk);
		box-shadow: inset 2px 2px 3px rgba(0, 0, 0, 0.45);
	}
	.box.empty {
		background: repeating-linear-gradient(45deg, #b98c56 0 5px, #a8783f 5px 10px);
	}
	.box.sel {
		outline: 2px solid var(--spot);
		outline-offset: 1px;
	}

	.galley {
		background: var(--lead-dk);
		background-image: var(--grain);
		border-top: 4px solid var(--ink);
		padding: 0.7rem 0.85rem 0.9rem;
	}
	.galley-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.7rem;
	}
	.galley .lab {
		color: #e2e5e7;
	}
	.galley-head .ops {
		align-items: center;
	}
	.loop {
		margin-left: 0.7rem;
		color: #ffd9cf;
	}
	.ms {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.ms input {
		width: 4.3em;
	}
	.sorts {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 5px;
	}
	.sorts li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}
	/* every slot is a cast sort; an unset one is simply blank metal */
	.sort {
		width: 100%;
		aspect-ratio: 4 / 5;
		display: grid;
		place-items: center;
		padding: 0;
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
	.sort.sel {
		background: linear-gradient(180deg, #b3a08a, #8f7a62);
		box-shadow:
			inset 1px 1px 0 rgba(255, 255, 255, 0.3),
			0 0 0 2px var(--spot);
	}
	.nick {
		font-size: 0.5625rem;
		letter-spacing: 0.1em;
		color: #e2e5e7;
	}

	.note-slip {
		position: absolute;
		left: 50%;
		bottom: 13rem;
		transform: translateX(-50%) rotate(-0.4deg);
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.9rem;
		align-items: baseline;
		max-width: min(40rem, calc(100vw - 3rem));
		padding: 0.85rem 2.3rem 0.85rem 1rem;
		background: var(--paper-lt);
		border: 2px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(23, 20, 15, 0.35);
	}
	.ref {
		font-size: 0.625rem;
		letter-spacing: 0.16em;
		color: var(--spot);
	}
	.note-slip p {
		font-size: 0.9375rem;
		line-height: 1.45;
	}
	.x {
		position: absolute;
		right: 6px;
		top: 6px;
		padding: 0 0.3rem;
		border-width: 1px;
		box-shadow: none;
		font-size: 0.75rem;
	}

	@media (max-width: 880px) {
		.middle {
			flex-direction: column;
		}
		.side {
			width: auto;
		}
		.status,
		.title,
		.note-slip {
			display: none;
		}
		.sorts {
			grid-template-columns: repeat(5, 1fr);
		}
	}
</style>
