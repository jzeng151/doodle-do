<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const FRAMES = 4;
	const current = 1;
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
	<header class="banner">
		<span class="mark">DOODLE&#8209;DO</span>
		<div class="tabs" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">PLATE</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">Autosaved 14:32:08</span>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="red">SAVE</button>
			<button>SHEET</button><button>GIF</button><button class="yellow">NOTES</button>
		</div>
	</header>

	<div class="toolbar">
		<div class="grp" role="group" aria-label="Tools">
			{#each TOOLS as [n, k] (n)}
				<button class:on={n === 'PENCIL'}>{n}<i>{k}</i></button>
			{/each}
		</div>
		<div class="grp">
			<span class="lab">SIZE</span>
			<div class="seg">{#each [1, 2, 3, 4] as s (s)}<button class:on={s === 2}>{s}</button>{/each}</div>
			<button>MIRROR</button>
		</div>
		<div class="grp"><button>FLIP H</button><button>FLIP V</button></div>
		<div class="grp">
			<button class="on">ONION</button>
			<input class="slider" type="range" min="0" max="100" value="35" aria-label="Onion skin opacity" />
		</div>
		<div class="grp right">
			<button>&minus;</button><span class="lab">18&times;</span><button>+</button><button class="on">GRID</button>
		</div>
	</div>

	<div class="middle">
		<div class="stage">
			<svg class="sky" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
				<rect width="600" height="400" fill="#8cc4e8" />
				<g fill="#f2f0ea" stroke="#14110f" stroke-width="3" stroke-linejoin="round">
					<path d="M70 72q-20 0-20-17t20-17q5-20 26-20t26 17q17-5 26 8t-6 26z" />
					<path d="M470 340q-18 0-18-15t18-15q4-18 23-18t23 15q15-4 23 7t-5 23z" />
				</g>
			</svg>
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="cap">FRAME 02 / 04 &middot; 16&times;16 &middot; ONION ON</p>
		</div>

		<aside class="rail">
			<section class="panel">
				<h2>LOOP</h2>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<p class="meta">8 fps &middot; 4 frames &middot; 500 ms</p>
			</section>
			<section class="panel">
				<h2>LAYERS</h2>
				<ul class="layers">
					{#each LAYERS as l (l.n)}
						<li class:active={l.active}>
							<span class="box" class:ticked={l.on} aria-hidden="true"></span>{l.n}
						</li>
					{/each}
				</ul>
				<button class="wide">MERGE DOWN</button>
			</section>
			<section class="panel">
				<h2>PALETTE<button class="chip yellow">LOCKED</button></h2>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="--c: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<p class="meta">16 of 64 &middot; locked to the starter set</p>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="strip-head">
			<span class="lab">FRAMES &middot; TIER 1</span>
			<div class="ops">
				<button>NEW</button><button>DUPLICATE</button><button>DELETE</button>
				<span class="lab loop">LOOP 01 &rarr; 04</span>
				<label class="ms"><span class="lab">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="frames">
			{#each { length: 10 } as _, i (i)}
				<li>
					{#if i < FRAMES}
						<button class="frame" class:sel={i === current}>
							<Sprite frame={i} scale={3} />
							<span class="no">{i + 1}</span>
						</button>
					{:else}
						<span class="frame empty"><span class="no">{i + 1}</span></span>
					{/if}
				</li>
			{/each}
		</ol>
	</footer>

	<div class="balloon" role="status">
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<span class="tail" aria-hidden="true"></span>
		<button class="x" aria-label="Dismiss note">&times;</button>
	</div>
</div>

<style>
	.shell {
		--sky: #8cc4e8;
		--paper: #f2f0ea;
		--yellow: #f2cf5b;
		--red: #d8352a;
		--green: #4d8f80;
		--steel: #4a6f92;
		--ink: #14110f;
		--ochre: #e0c48f;
		--line: 3px;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
		font-family: 'Nunito Sans', system-ui, sans-serif;
		font-size: 0.8125rem;
		position: relative;
	}
	.lab {
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		white-space: nowrap;
	}

	/* one line weight, flat fills, no shadow anywhere */
	button,
	input,
	.panel,
	.board,
	.frame,
	.balloon,
	.monitor,
	.sw,
	.box {
		border: var(--line) solid var(--ink);
	}
	button {
		padding: 0.35rem 0.6rem;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.625rem;
		letter-spacing: 0.06em;
		color: var(--ink);
		background: var(--paper);
		border-radius: 6px;
	}
	button:hover {
		background: var(--ochre);
	}
	button.on {
		background: var(--steel);
		color: var(--paper);
	}
	button.red {
		background: var(--red);
		color: var(--paper);
	}
	button.yellow {
		background: var(--yellow);
	}
	input {
		font-family: inherit;
		font-weight: 600;
		font-size: 0.75rem;
		color: var(--ink);
		background: var(--paper);
		border-radius: 5px;
		padding: 0.2rem 0.45rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: var(--line) solid var(--red);
		outline-offset: 2px;
	}
	.slider {
		width: 78px;
		padding: 0;
		border: none;
		accent-color: var(--red);
	}

	.banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.85rem;
		background: var(--yellow);
		border-bottom: var(--line) solid var(--ink);
	}
	.mark {
		font-family: Grandstander, sans-serif;
		font-weight: 800;
		font-size: 0.9375rem;
	}
	.tabs {
		display: flex;
		gap: 4px;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.title input {
		width: 9em;
	}
	.status {
		flex: 1;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ops {
		display: flex;
		gap: 4px;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.9rem;
		padding: 0.55rem 0.85rem;
		background: var(--paper);
		border-bottom: var(--line) solid var(--ink);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 4px;
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
		gap: 3px;
	}

	.middle {
		display: flex;
		flex: 1;
		min-height: 0;
	}
	.stage {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.1rem;
		padding: clamp(1rem, 3vw, 2.5rem);
		overflow: hidden;
	}
	.sky {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.board {
		position: relative;
		padding: 10px;
		background: var(--paper);
		border-radius: 5px;
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e2dfd6 0% 25%, #f2f0ea 0% 50%) 0 0 / 16px 16px;
	}
	.cap {
		position: relative;
		padding: 0.3rem 0.6rem;
		background: var(--yellow);
		border: var(--line) solid var(--ink);
		border-radius: 4px;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.625rem;
		letter-spacing: 0.08em;
	}

	.rail {
		width: 236px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		background: var(--sky);
		border-left: var(--line) solid var(--ink);
		overflow-y: auto;
	}
	.panel {
		padding: 0.85rem;
		background: var(--paper);
		border-radius: 5px;
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		margin-bottom: 0.8rem;
		font-family: Grandstander, sans-serif;
		font-weight: 800;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		border-bottom: var(--line) solid var(--ink);
	}
	.chip {
		padding: 0.12rem 0.4rem;
		font-size: 0.5rem;
		border-width: 2px;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.85rem;
		background: var(--sky);
		border-radius: 4px;
	}
	.monitor :global(canvas) {
		background: transparent;
	}
	.meta {
		margin-top: 0.55rem;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border-radius: 4px;
	}
	.layers li.active {
		background: var(--yellow);
	}
	.box {
		width: 13px;
		height: 13px;
		flex: none;
		border-width: 2px;
		border-radius: 3px;
		background: var(--paper);
	}
	.box.ticked {
		background: var(--green);
	}
	.wide {
		width: 100%;
		margin-top: 0.6rem;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 4px;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		border-width: 2px;
		border-radius: 3px;
		background: var(--c);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#d9d6cd 0% 25%, #f2f0ea 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: var(--line) solid var(--red);
		outline-offset: 2px;
	}

	.strip {
		background: var(--sky);
		border-top: var(--line) solid var(--ink);
		padding: 0.7rem 0.85rem 0.9rem;
	}
	.strip-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.7rem;
	}
	.strip-head .ops {
		align-items: center;
	}
	.loop {
		margin-left: 0.7rem;
		color: var(--red);
	}
	.ms {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.ms input {
		width: 4.3em;
	}
	.frames {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 7px;
	}
	.frame {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		background: var(--paper);
		border-radius: 5px;
	}
	.frame :global(canvas) {
		background: transparent;
	}
	.frame.sel {
		background: var(--yellow);
	}
	.frame.empty {
		background: repeating-conic-gradient(#e2dfd6 0% 25%, #f2f0ea 0% 50%) 0 0 / 9px 9px;
	}
	.no {
		position: absolute;
		left: 4px;
		top: 2px;
		font-family: Grandstander, sans-serif;
		font-weight: 700;
		font-size: 0.5rem;
	}

	.balloon {
		position: absolute;
		left: 50%;
		bottom: 15rem;
		transform: translateX(-50%);
		max-width: min(40rem, calc(100vw - 3rem));
		padding: 0.9rem 2.5rem 0.9rem 1.1rem;
		background: var(--paper);
		border-radius: 20px;
	}
	.balloon p {
		font-family: Grandstander, sans-serif;
		font-weight: 600;
		font-size: 0.9375rem;
		line-height: 1.4;
	}
	.tail {
		position: absolute;
		left: 36px;
		bottom: -17px;
		width: 22px;
		height: 20px;
		background: var(--paper);
		border-right: var(--line) solid var(--ink);
		border-bottom: var(--line) solid var(--ink);
		border-bottom-right-radius: 3px;
		transform: skewX(-24deg);
	}
	.x {
		position: absolute;
		right: 8px;
		top: 8px;
		padding: 0 0.35rem;
		border-width: 2px;
		font-size: 0.8125rem;
	}

	@media (max-width: 880px) {
		.middle {
			flex-direction: column;
		}
		.rail {
			width: auto;
			border-left: none;
			border-top: var(--line) solid var(--ink);
		}
		.status,
		.title,
		.balloon {
			display: none;
		}
		.frames {
			grid-template-columns: repeat(5, 1fr);
		}
	}
</style>
