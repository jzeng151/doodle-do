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
	<header class="mast">
		<span class="logo">DOODLE&#8209;DO</span>
		<div class="tabs" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">NAME</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">saved 14:32</span>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="pink">SAVE</button>
			<button>SHEET</button><button>GIF</button><button class="green">NOTES</button>
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
			<span class="val">0.35</span>
		</div>
		<div class="grp right">
			<button>&minus;</button><span class="val">18&times;</span><button>+</button><button class="on">GRID</button>
		</div>
	</div>

	<div class="middle">
		<div class="stage">
			<div class="tone" aria-hidden="true"></div>
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="cap scrawl">frame 2 of 4 — nudge the back foot!</p>
		</div>

		<aside class="rail">
			<section class="card">
				<h2>LOOP</h2>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<p class="meta">8 fps &middot; 4 frames &middot; 500 ms</p>
			</section>
			<section class="card">
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
			<section class="card">
				<h2>COLOURS<button class="chip">LOCKED</button></h2>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="background: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<p class="meta">16 of 64 &middot; locked</p>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="strip-head">
			<span class="lab">FRAMES</span>
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
						<button class="frame" class:sel={i === current}><Sprite frame={i} scale={3} /></button>
					{:else}
						<span class="frame empty"></span>
					{/if}
					<span class="no">{i + 1}</span>
				</li>
			{/each}
		</ol>
	</footer>

	<div class="note" role="status">
		<span class="nid">T02</span>
		<p class="scrawl">The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button class="x" aria-label="Dismiss note">&times;</button>
	</div>
</div>

<style>
	.shell {
		--paper: #f7f4ec;
		--paper-2: #ebe7dc;
		--ink: #17161a;
		--pink: #ff2d8a;
		--green: #b6e021;
		--sub: #55535e;
		--halftone: radial-gradient(circle at 50% 50%, #17161a 1.5px, transparent 1.6px);
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
		font-family: 'Nunito Sans', system-ui, sans-serif;
		font-size: 13px;
		line-height: 1.5;
		position: relative;
	}
	.lab,
	.val {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.625rem;
		letter-spacing: 0.08em;
		color: var(--sub);
		white-space: nowrap;
	}
	.val {
		color: var(--pink);
		min-width: 3em;
		text-align: center;
	}
	.scrawl {
		font-family: 'Gochi Hand', cursive;
	}

	button {
		padding: 0.35rem 0.6rem;
		font-family: 'Lilita One', sans-serif;
		font-size: 0.6875rem;
		letter-spacing: 0.04em;
		color: var(--ink);
		background: var(--paper);
		border: 2.5px solid var(--ink);
	}
	button:hover {
		background: var(--paper-2);
	}
	button.on {
		color: var(--paper);
		background: var(--ink);
	}
	button.pink {
		color: var(--paper);
		background: var(--pink);
	}
	button.green {
		background: var(--green);
	}
	input {
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--ink);
		background: var(--paper);
		border: 2.5px solid var(--ink);
		padding: 0.2rem 0.45rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 3px solid var(--pink);
		outline-offset: 2px;
	}
	.slider {
		width: 76px;
		padding: 0;
		border: none;
		accent-color: var(--pink);
	}

	.mast {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.85rem;
		border-bottom: 5px solid var(--ink);
	}
	.logo {
		font-family: 'Lilita One', sans-serif;
		font-size: 1rem;
	}
	.tabs,
	.ops {
		display: flex;
		gap: 4px;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.title input {
		width: 8.5em;
	}
	.status {
		flex: 1;
		font-size: 0.75rem;
		color: var(--sub);
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
		background: var(--green);
		border-bottom: 3px solid var(--ink);
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
	.tone {
		position: absolute;
		inset: 0;
		background-image: var(--halftone);
		background-size: 7px 7px;
		opacity: 0.18;
	}
	.board {
		position: relative;
		padding: 12px;
		background: var(--paper);
		border: 4px solid var(--ink);
		box-shadow: 8px 8px 0 var(--pink);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e6e2d7 0% 25%, #f7f4ec 0% 50%) 0 0 / 16px 16px;
	}
	.cap {
		position: relative;
		font-size: 1.15rem;
		color: var(--ink);
		transform: rotate(-1.5deg);
	}

	.rail {
		width: 234px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		background: var(--paper-2);
		box-shadow: inset 4px 0 0 var(--ink);
		overflow-y: auto;
	}
	.card {
		padding: 0.85rem;
		background: var(--paper);
		border: 3px solid var(--ink);
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		margin-bottom: 0.8rem;
		font-family: 'Lilita One', sans-serif;
		font-size: 0.8125rem;
		letter-spacing: 0.08em;
		border-bottom: 3px solid var(--ink);
	}
	.chip {
		padding: 0.1rem 0.4rem;
		font-size: 0.5625rem;
		background: var(--green);
		border-width: 2px;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.85rem;
		background: var(--green);
		border: 3px solid var(--ink);
	}
	.monitor :global(canvas) {
		background: transparent;
	}
	.meta {
		margin-top: 0.55rem;
		font-size: 0.75rem;
		color: var(--sub);
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.layers li.active {
		background: var(--green);
	}
	.box {
		width: 14px;
		height: 14px;
		flex: none;
		border: 2.5px solid var(--ink);
	}
	.box.ticked {
		background:
			linear-gradient(45deg, transparent 40%, var(--pink) 40% 60%, transparent 60%),
			linear-gradient(-45deg, transparent 40%, var(--pink) 40% 60%, transparent 60%);
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
		border: 2px solid var(--ink);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#dcd7ca 0% 25%, #f7f4ec 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 3px solid var(--pink);
		outline-offset: 2px;
	}

	.strip {
		padding: 0.7rem 0.85rem 0.9rem;
		background: var(--paper-2);
		border-top: 5px solid var(--ink);
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
		color: var(--pink);
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
		grid-template-columns: repeat(10, 1fr);
		gap: 6px;
	}
	.frames li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}
	.frame {
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		background: var(--paper);
		border: 3px solid var(--ink);
	}
	.frame :global(canvas) {
		background: transparent;
	}
	.frame.sel {
		background: var(--green);
		box-shadow: 4px 4px 0 var(--pink);
	}
	.frame.empty {
		background: repeating-conic-gradient(#e0dbcd 0% 25%, #ebe7dc 0% 50%) 0 0 / 9px 9px;
	}
	.no {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.625rem;
		color: var(--sub);
	}

	.note {
		position: absolute;
		left: 50%;
		bottom: 13.5rem;
		transform: translateX(-50%) rotate(-0.8deg);
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.9rem;
		align-items: baseline;
		max-width: min(40rem, calc(100vw - 3rem));
		padding: 0.85rem 2.4rem 0.85rem 1rem;
		background: var(--green);
		border: 3px solid var(--ink);
		box-shadow: 6px 6px 0 var(--ink);
	}
	.nid {
		font-family: 'Lilita One', sans-serif;
		font-size: 0.6875rem;
		color: #b3005c;
	}
	.note p {
		font-size: 1.15rem;
		line-height: 1.3;
	}
	.x {
		position: absolute;
		right: 6px;
		top: 6px;
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
			box-shadow: inset 0 4px 0 var(--ink);
		}
		.status,
		.title,
		.note {
			display: none;
		}
		.frames {
			grid-template-columns: repeat(5, 1fr);
		}
	}
</style>
