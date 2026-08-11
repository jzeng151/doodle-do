<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const ROWS = 12;
	const DRAWN = 4;
	const current = 1;
	const ACTION = ['contact', 'passing, up 1px', 'contact, other foot', 'passing, down 1px'];
	const CAMERA = ['HOLD 1', '', '', 'LOOP → 01'];

	const TOOLS = [
		['Pencil', 'B'],
		['Eraser', 'E'],
		['Fill', 'G'],
		['Pick', 'I'],
		['Select', 'M'],
		['Lasso', 'L'],
		['Wand', 'W'],
		['Polygon', 'P']
	];
	const LAYERS = [
		{ n: 'Highlights', on: true },
		{ n: 'Character', on: true, active: true },
		{ n: 'Sketch', on: false }
	];
</script>

<div class="mock shell">
	<header class="bar">
		<div class="stamp">
			<strong>DOODLE&#8209;DO</strong>
			<span>EXPOSURE SHEET</span>
		</div>
		<div class="tabs" role="group" aria-label="Workspace mode">
			<button class="on">Focus</button><button>Grid</button><button>Loop</button>
		</div>
		<label class="title"><span class="lab">SCENE</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">autosaved 14:32:08</span>
		<div class="ops">
			<button>New</button><button>Open</button><button class="mark">Save</button>
			<button>Sheet</button><button>GIF</button><button class="on">Tips</button>
		</div>
	</header>

	<div class="toolbar">
		<div class="grp" role="group" aria-label="Tools">
			{#each TOOLS as [n, k] (n)}
				<button class:on={n === 'Pencil'}>{n}<i>{k}</i></button>
			{/each}
		</div>
		<div class="grp">
			<span class="lab">SIZE</span>
			<select aria-label="Brush size"><option>2 px</option></select>
			<button>Mirror</button>
		</div>
		<div class="grp"><button>Flip H</button><button>Flip V</button></div>
		<div class="grp">
			<button class="on">Onion</button>
			<input class="slider" type="range" min="0" max="100" value="35" aria-label="Onion skin opacity" />
			<span class="lab">0.35</span>
		</div>
		<div class="grp right"><button>&minus;</button><span class="lab">18&times;</span><button>+</button><button class="on">Grid</button></div>
	</div>

	<div class="middle">
		<div class="stage">
			<div class="tape" aria-hidden="true"></div>
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="hand caption">frame 02 &mdash; push the back foot 1px further, it drags</p>
		</div>

		<aside class="rail">
			<section>
				<h2 class="lab">LOOP</h2>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<p class="meta">8 fps &middot; 4 frames &middot; 500 ms</p>
			</section>
			<section>
				<h2 class="lab">LAYERS</h2>
				<ul class="layers">
					{#each LAYERS as l (l.n)}
						<li class:active={l.active}>
							<span class="box" class:ticked={l.on} aria-hidden="true"></span>{l.n}
						</li>
					{/each}
				</ul>
				<button class="wide">Merge down</button>
			</section>
			<section>
				<h2 class="lab">PALETTE <button class="chip on">Locked</button></h2>
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
		<table>
			<caption class="sr-only">Frames</caption>
			<thead>
				<tr><th>NO.</th><th>DRAWING</th><th>ACTION</th><th>MS</th><th>CAMERA</th></tr>
			</thead>
			<tbody>
				{#each { length: ROWS } as _, i (i)}
					<tr class:beat={i % 4 === 0} class:sel={i === current}>
						<td class="c-no">{String(i + 1).padStart(2, '0')}</td>
						<td class="c-draw">{#if i < DRAWN}<Sprite frame={i} scale={2} />{/if}</td>
						<td class="hand">{ACTION[i] ?? ''}</td>
						<td class="c-ms">{i < DRAWN ? '125' : ''}</td>
						<td class="c-cam">{CAMERA[i] ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="strip-ops">
			<button>New</button><button>Duplicate</button><button>Delete</button>
			<span class="lab">LOOP 01 &rarr; 04</span>
		</div>
	</footer>

	<div class="toast" role="status">
		<span class="ref">T02</span>
		<p class="hand">The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button aria-label="Dismiss tip">&times;</button>
	</div>
</div>

<style>
	.shell {
		--paper: #e9e1cf;
		--paper-2: #f1ebdc;
		--ink: #2b2721;
		--ink-2: #5c574e;
		--rule: #9aa9ad;
		--rule-soft: #c3c8bd;
		--red: #c8352b;
		--fibre: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E");
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--paper);
		background-image: var(--fibre);
		color: var(--ink);
		font-family: 'Courier Prime', ui-monospace, monospace;
		font-size: 0.8125rem;
		position: relative;
	}
	.hand {
		font-family: Caveat, cursive;
		font-size: 1.2em;
		color: var(--ink-2);
	}
	.lab {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--ink-2);
		white-space: nowrap;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	button {
		padding: 0.35rem 0.6rem;
		font-family: inherit;
		font-size: 0.6875rem;
		color: var(--ink);
		background: var(--paper-2);
		border: 1px solid var(--rule);
		border-radius: 2px;
	}
	button:hover {
		background: #ded5c1;
	}
	button.on {
		color: var(--paper-2);
		background: var(--red);
		border-color: var(--red);
	}
	button.mark {
		font-weight: 700;
		border-color: var(--ink);
	}
	input,
	select {
		font-family: inherit;
		font-size: 0.75rem;
		color: var(--ink);
		background: var(--paper-2);
		border: 1px solid var(--rule);
		border-radius: 2px;
		padding: 0.25rem 0.4rem;
	}
	button:focus-visible,
	input:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--red);
		outline-offset: 1px;
	}
	.slider {
		width: 76px;
		padding: 0;
		accent-color: var(--red);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.5rem 0.9rem;
		background: #ded5c1;
		border-bottom: 2px solid var(--ink);
	}
	.stamp {
		display: flex;
		flex-direction: column;
		padding: 0.25rem 0.5rem;
		border: 1.5px solid var(--red);
		color: var(--red);
		transform: rotate(-1deg);
	}
	.stamp strong {
		font-size: 0.8125rem;
		letter-spacing: 0.05em;
	}
	.stamp span {
		font-size: 0.5rem;
		letter-spacing: 0.14em;
	}
	.tabs {
		display: flex;
	}
	.tabs button {
		border-radius: 0;
	}
	.tabs button + button {
		margin-left: -1px;
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
		font-size: 0.6875rem;
		color: var(--ink-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ops {
		display: flex;
		gap: 3px;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0.9rem;
		border-bottom: 1px solid var(--rule);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.grp + .grp {
		padding-left: 1rem;
		border-left: 1px solid var(--rule-soft);
	}
	.grp.right {
		margin-left: auto;
	}
	.grp button i {
		font-style: normal;
		font-size: 0.5625rem;
		color: var(--ink-2);
		margin-left: 0.4em;
	}
	.grp button.on i {
		color: rgba(255, 255, 255, 0.7);
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
		gap: 1.2rem;
		padding: clamp(1rem, 3vw, 2.5rem);
		background: repeating-linear-gradient(
			180deg,
			transparent 0 27px,
			var(--rule-soft) 27px 28px
		);
	}
	.tape {
		position: absolute;
		top: 22px;
		left: 50%;
		width: 84px;
		height: 22px;
		transform: translateX(-50%) rotate(-2deg);
		background: rgba(226, 214, 180, 0.75);
		box-shadow: 0 1px 2px rgba(60, 50, 30, 0.2);
	}
	.board {
		padding: 12px;
		background: var(--paper-2);
		border: 1px solid var(--rule);
		box-shadow: 0 2px 0 rgba(0, 0, 0, 0.05), 0 16px 34px rgba(60, 50, 30, 0.18);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e2dac6 0% 25%, #efe9da 0% 50%) 0 0 / 16px 16px;
	}
	.caption {
		transform: rotate(-0.8deg);
	}

	.rail {
		width: 226px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		background: var(--paper-2);
		border-left: 1px solid var(--rule);
		overflow-y: auto;
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.45rem;
		margin-bottom: 0.8rem;
		border-bottom: 1.5px solid var(--ink);
	}
	.chip {
		padding: 0.15rem 0.4rem;
		font-size: 0.5rem;
		letter-spacing: 0.1em;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.8rem;
		background: repeating-conic-gradient(#e2dac6 0% 25%, #efe9da 0% 50%) 0 0 / 12px 12px;
		border: 1px solid var(--rule);
	}
	.meta {
		margin-top: 0.55rem;
		font-size: 0.6875rem;
		color: var(--ink-2);
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.3rem;
		font-size: 0.75rem;
	}
	.layers li.active {
		background: #e3d9c4;
		box-shadow: inset 0 0 0 1px var(--rule);
	}
	.box {
		width: 11px;
		height: 11px;
		flex: none;
		border: 1px solid var(--ink-2);
		background: var(--paper-2);
	}
	.box.ticked {
		background:
			linear-gradient(45deg, transparent 44%, var(--ink) 44% 56%, transparent 56%),
			linear-gradient(-45deg, transparent 44%, var(--ink) 44% 56%, transparent 56%);
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
		border: 1px solid rgba(0, 0, 0, 0.35);
		border-radius: 0;
	}
	.sw.alpha {
		background: repeating-conic-gradient(#d5ccb7 0% 25%, #e9e1cf 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 2px solid var(--red);
		outline-offset: 1px;
	}

	.strip {
		border-top: 2px solid var(--ink);
		background: var(--paper-2);
	}
	.strip table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	.strip th {
		padding: 0.35rem 0.6rem;
		font-size: 0.5rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-align: left;
		color: var(--ink-2);
		background: #ded5c1;
		border-bottom: 1px solid var(--ink);
	}
	.strip td {
		padding: 0.2rem 0.6rem;
		font-size: 0.6875rem;
		border-bottom: 1px solid var(--rule-soft);
		border-right: 1px solid var(--rule-soft);
	}
	.strip tr.beat td {
		border-top: 1px solid var(--rule);
	}
	.strip tr.sel td {
		background: #f7ecd2;
		box-shadow: inset 0 0 0 1px var(--red);
	}
	.c-no {
		width: 4ch;
		color: var(--ink-2);
	}
	.c-draw {
		width: 40px;
	}
	.c-draw :global(canvas) {
		background: repeating-conic-gradient(#e2dac6 0% 25%, #efe9da 0% 50%) 0 0 / 8px 8px;
		outline: 1px solid var(--rule-soft);
	}
	.c-ms {
		width: 5ch;
		text-align: right;
		color: var(--ink-2);
	}
	.c-cam {
		width: 12ch;
		color: var(--red);
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		border-left: 1px solid var(--red);
		border-right: none;
	}
	.strip-ops {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 0.55rem 0.9rem;
		border-top: 1px solid var(--rule);
	}
	.strip-ops .lab {
		margin-left: 0.8rem;
		color: var(--red);
	}

	.toast {
		position: absolute;
		left: 50%;
		bottom: 40%;
		transform: translateX(-50%) rotate(-0.5deg);
		display: flex;
		align-items: center;
		gap: 0.9rem;
		max-width: min(42rem, calc(100vw - 3rem));
		padding: 0.7rem 0.9rem;
		background: #fdf6e3;
		border: 1px solid var(--rule);
		box-shadow: 0 10px 24px rgba(60, 50, 30, 0.25);
	}
	.ref {
		font-size: 0.5625rem;
		letter-spacing: 0.14em;
		color: var(--red);
	}
	.toast p {
		font-size: 1rem;
		line-height: 1.4;
		color: var(--ink);
	}

	@media (max-width: 860px) {
		.middle {
			flex-direction: column;
		}
		.rail {
			width: auto;
			border-left: none;
			border-top: 1px solid var(--rule);
		}
		.status,
		.title,
		.toast {
			display: none;
		}
	}
</style>
