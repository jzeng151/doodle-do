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
	<header class="bar">
		<span class="kanji" aria-hidden="true">週刊</span>
		<span class="mark">DOODLE&#8209;DO</span>
		<div class="tabs" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">TITLE</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">AUTOSAVED 14:32:08</span>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="on">SAVE</button>
			<button>SHEET</button><button>GIF</button><button>TIPS</button>
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
		<div class="grp right"><button>&minus;</button><span class="lab">18&times;</span><button>+</button><button class="on">GRID</button></div>
	</div>

	<div class="middle">
		<div class="stage">
			<div class="focus-lines" aria-hidden="true"></div>
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="cap">FRAME 02 / 04 &middot; 16&times;16 &middot; ONION ON</p>
		</div>

		<aside class="rail">
			<section class="panel">
				<h2>LOOP</h2>
				<div class="monitor tone-10"><Sprite playing scale={6} /></div>
				<p class="meta">8 FPS &middot; 4 FRAMES &middot; 500 MS</p>
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
				<h2>PALETTE <button class="chip on">LOCKED</button></h2>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="--c: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<p class="meta">16 OF 64 &middot; LOCKED TO THE STARTER SET</p>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="strip-head">
			<span class="lab">PANELS</span>
			<div class="strip-ops">
				<button>NEW</button><button>DUPLICATE</button><button>DELETE</button>
				<span class="lab loop">LOOP 01 &rarr; 04</span>
				<label class="ms"><span class="lab">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="frames">
			{#each { length: 14 } as _, i (i)}
				<li>
					{#if i < FRAMES}
						<button class="frame" class:sel={i === current}>
							<Sprite frame={i} scale={3} />
							<span class="no">{String(i + 1).padStart(2, '0')}</span>
						</button>
					{:else}
						<span class="frame empty"><span class="no">{String(i + 1).padStart(2, '0')}</span></span>
					{/if}
				</li>
			{/each}
		</ol>
	</footer>

	<div class="toast" role="status">
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<span class="tail" aria-hidden="true"></span>
		<span class="cue">T02</span>
		<button class="x" aria-label="Dismiss tip">&times;</button>
	</div>
</div>

<style>
	.shell {
		--paper: #f2efe6;
		--paper-2: #e9e5d9;
		--ink: #111111;
		--gray: #6a675f;
		--dot: #111111;
		--newsprint: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f)' opacity='0.42'/%3E%3C/svg%3E");
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--paper);
		background-image: var(--newsprint);
		color: var(--ink);
		font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
		font-size: 0.8125rem;
		position: relative;
	}
	.tone-10 {
		background-image: radial-gradient(circle at 50% 50%, var(--dot) 1.1px, transparent 1.2px);
		background-size: 6px 6px;
	}
	.lab {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--gray);
		white-space: nowrap;
	}

	button {
		padding: 0.35rem 0.6rem;
		font-family: inherit;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--ink);
		background: var(--paper);
		border: 2px solid var(--ink);
	}
	button:hover {
		background: var(--paper-2);
		color: var(--ink);
	}
	button.on {
		color: var(--paper);
		background: var(--ink);
	}
	button.on:hover {
		color: var(--ink);
		background: var(--paper-2);
	}
	input {
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--ink);
		background: var(--paper);
		border: 2px solid var(--ink);
		padding: 0.2rem 0.4rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	.slider {
		width: 76px;
		padding: 0;
		border: none;
		accent-color: var(--ink);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.85rem;
		border-bottom: 4px solid var(--ink);
	}
	.kanji {
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--paper);
		background: var(--ink);
		padding: 0.25rem 0.3rem;
	}
	.mark {
		font-size: 0.9375rem;
		font-weight: 900;
		letter-spacing: -0.02em;
	}
	.tabs {
		display: flex;
	}
	.tabs button + button {
		margin-left: -2px;
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
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: var(--gray);
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
		gap: 1rem;
		padding: 0.5rem 0.85rem;
		border-bottom: 2px solid var(--ink);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.grp + .grp {
		padding-left: 1rem;
		border-left: 2px solid var(--ink);
	}
	.grp.right {
		margin-left: auto;
	}
	.grp button i {
		font-style: normal;
		font-size: 0.5rem;
		margin-left: 0.45em;
		opacity: 0.55;
	}
	.seg {
		display: flex;
	}
	.seg button + button {
		margin-left: -2px;
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
	.focus-lines {
		position: absolute;
		inset: -20%;
		background: repeating-conic-gradient(
			from 0deg at 50% 50%,
			var(--ink) 0deg 0.3deg,
			transparent 0.3deg 4deg
		);
		-webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 30%, #000 78%);
		mask-image: radial-gradient(circle at 50% 50%, transparent 30%, #000 78%);
		opacity: 0.18;
		pointer-events: none;
	}
	.board {
		position: relative;
		padding: 10px;
		background: var(--paper);
		border: 3px solid var(--ink);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e0dccf 0% 25%, #f2efe6 0% 50%) 0 0 / 16px 16px;
	}
	.cap {
		position: relative;
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--gray);
	}

	.rail {
		width: 232px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px 10px 10px 0;
		overflow-y: auto;
	}
	.panel {
		padding: 0.8rem;
		border: 2.5px solid var(--ink);
		background: var(--paper);
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.625rem;
		font-weight: 900;
		letter-spacing: 0.18em;
		border-bottom: 2px solid var(--ink);
	}
	.chip {
		padding: 0.12rem 0.35rem;
		font-size: 0.5rem;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.85rem;
		border: 2px solid var(--ink);
		background-color: var(--paper);
	}
	.monitor :global(canvas) {
		background: var(--paper);
	}
	.meta {
		margin-top: 0.55rem;
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--gray);
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.3rem;
		font-size: 0.75rem;
		font-weight: 500;
	}
	.layers li.active {
		color: var(--paper);
		background: var(--ink);
	}
	.box {
		width: 11px;
		height: 11px;
		flex: none;
		border: 2px solid currentColor;
	}
	.box.ticked {
		background: currentColor;
	}
	.wide {
		width: 100%;
		margin-top: 0.6rem;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 3px;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		background: var(--c);
		border: 1.5px solid var(--ink);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#dcd8cb 0% 25%, #f2efe6 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 3px solid var(--ink);
		outline-offset: 1px;
	}

	.strip {
		border-top: 4px solid var(--ink);
		padding: 0.7rem 0.85rem 0.9rem;
	}
	.strip-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.7rem;
	}
	.strip-ops {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.loop {
		margin-left: 0.7rem;
		color: var(--ink);
	}
	.ms {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.ms input {
		width: 4.2em;
	}
	.frames {
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: 6px;
	}
	.frame {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		background: var(--paper);
		border: 2.5px solid var(--ink);
	}
	.frame :global(canvas) {
		background: repeating-conic-gradient(#e0dccf 0% 25%, #f2efe6 0% 50%) 0 0 / 8px 8px;
	}
	.frame.sel {
		box-shadow: 0 0 0 3px var(--ink);
	}
	.frame.empty {
		background-image: radial-gradient(circle at 50% 50%, var(--dot) 1.1px, transparent 1.2px);
		background-size: 6px 6px;
	}
	.no {
		position: absolute;
		left: 3px;
		top: 2px;
		font-size: 0.5rem;
		font-weight: 700;
		color: var(--gray);
	}

	.toast {
		position: absolute;
		left: 50%;
		bottom: 15.5rem;
		transform: translateX(-50%);
		max-width: min(40rem, calc(100vw - 3rem));
		padding: 0.9rem 2.4rem 0.9rem 1.1rem;
		background: var(--paper);
		border: 2.5px solid var(--ink);
		border-radius: 22px;
	}
	.toast p {
		font-size: 0.9375rem;
		font-weight: 500;
		line-height: 1.45;
	}
	.tail {
		position: absolute;
		left: 34px;
		bottom: -14px;
		width: 20px;
		height: 15px;
		background: var(--paper);
		border-right: 2.5px solid var(--ink);
		border-bottom: 2.5px solid var(--ink);
		transform: skewX(-26deg);
	}
	.cue {
		position: absolute;
		left: 60px;
		bottom: -26px;
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--gray);
	}
	.x {
		position: absolute;
		right: 8px;
		top: 8px;
		padding: 0.05rem 0.35rem;
		border-width: 1.5px;
		font-size: 0.75rem;
	}

	@media (max-width: 860px) {
		.middle {
			flex-direction: column;
		}
		.rail {
			width: auto;
			padding: 0 10px 10px;
		}
		.status,
		.title,
		.toast {
			display: none;
		}
		.frames {
			grid-template-columns: repeat(7, 1fr);
		}
	}
</style>
