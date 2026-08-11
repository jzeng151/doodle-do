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
		{ n: 'Highlights', on: true, px: '38' },
		{ n: 'Character', on: true, active: true, px: '164' },
		{ n: 'Sketch', on: false, px: '92' }
	];
	const HIST = ['Stroke ×12', 'Fill', 'Flip H', 'Duplicate frame', 'Stroke ×4', 'Nudge selection'];
</script>

<div class="mock shell">
	<div class="util-rail">
		<span>LOCAL-FIRST</span><span>NO ACCOUNT</span><span>OFFLINE</span>
		<span class="ver">AUTOSAVE OK / 14:32:08</span>
	</div>

	<header class="head">
		<span class="mark">DOODLE<span>-DO</span></span>
		<div class="tabs" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">DOC</span><input value="hero-walk" aria-label="Document name" /></label>
		<div class="badges">
			<span class="badge red">16×16</span><span class="badge">1-BIT</span><span class="badge">8 FPS</span>
		</div>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="red">SAVE</button>
			<button>SHEET</button><button>GIF</button><button>ZIP</button><button class="on">NOTES</button>
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
		<div class="grp"><button>FLIP H</button><button>FLIP V</button><button>MERGE</button></div>
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
		<aside class="rail left">
			<section class="mod">
				<div class="tab">LAYERS / 3</div>
				<table class="mini">
					<tbody>
						{#each LAYERS as l (l.n)}
							<tr class:on={l.active}>
								<td><span class="box" class:ticked={l.on} aria-hidden="true"></span></td>
								<td>{l.n}</td><td class="v">{l.px}px</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
			<section class="mod">
				<div class="tab">HISTORY / 6</div>
				<ul class="hist">
					{#each HIST as h, i (h)}<li class:cur={i === 4}>{h}</li>{/each}
				</ul>
			</section>
		</aside>

		<div class="stage">
			<div class="board"><Sprite frame={current} scale={21} onion={0.35} grid /></div>
			<table class="readout">
				<tbody>
					<tr>
						<td>FRAME</td><td class="v">02 / 04</td>
						<td>SIZE</td><td class="v">16 × 16</td>
						<td>ONION</td><td class="v red">0.35</td>
						<td>PREV</td><td class="v"><i class="chip prev"></i>#d04648</td>
						<td>NEXT</td><td class="v"><i class="chip next"></i>#6daa2c</td>
					</tr>
				</tbody>
			</table>
		</div>

		<aside class="rail right">
			<section class="mod">
				<div class="tab red">LOOP / LIVE</div>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<table class="mini">
					<tbody>
						<tr><td>RATE</td><td class="v red">8 fps</td></tr>
						<tr><td>FRAMES</td><td class="v">04</td></tr>
						<tr><td>PERIOD</td><td class="v">500 ms</td></tr>
						<tr><td>RANGE</td><td class="v">01 → 04</td></tr>
					</tbody>
				</table>
			</section>
			<section class="mod">
				<div class="tab">PALETTE / 16 OF 64</div>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="--c: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<table class="mini">
					<tbody>
						<tr><td>INDEX</td><td class="v">07</td></tr>
						<tr><td>HEX</td><td class="v red">#d04648</td></tr>
						<tr><td>LOCK</td><td class="v">ON</td></tr>
					</tbody>
				</table>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="strip-head">
			<span class="tab">FRAMES / 4</span>
			<div class="ops">
				<button>NEW</button><button>DUPLICATE</button><button>DELETE</button>
				<button>←</button><button>→</button>
				<span class="lab">LOOP 01 → 04</span>
				<label class="ms"><span class="lab">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="frames">
			{#each { length: 16 } as _, i (i)}
				<li>
					{#if i < FRAMES}
						<button class="frame" class:sel={i === current}><Sprite frame={i} scale={3} /></button>
					{:else}
						<span class="frame empty"></span>
					{/if}
					<span class="no">{String(i + 1).padStart(2, '0')}</span>
				</li>
			{/each}
		</ol>
	</footer>

	<div class="toast" role="status">
		<span class="tid">T02</span><span class="cat">ONION</span>
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button class="x" aria-label="Dismiss note">×</button>
	</div>
</div>

<style>
	.shell {
		--white: #ffffff;
		--ink: #111111;
		--red: #e60012;
		--line: #dadada;
		--surface: #f2f2f2;
		--sub: #666666;
		--muted: #6f6f6f;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--white);
		color: var(--ink);
		font-family: 'Noto Sans JP', system-ui, sans-serif;
		font-size: 11px;
		line-height: 1.5;
		position: relative;
	}
	.lab,
	.val {
		font-size: 9px;
		letter-spacing: 0.06em;
		color: var(--sub);
		white-space: nowrap;
	}
	.val {
		color: var(--red);
		font-weight: 700;
		min-width: 2.6em;
		text-align: center;
	}

	button {
		padding: 4px 7px;
		font-family: inherit;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--ink);
		background: var(--white);
		border: 1px solid var(--line);
	}
	button:hover {
		background: var(--surface);
	}
	button.on {
		color: var(--white);
		background: var(--ink);
		border-color: var(--ink);
	}
	button.red {
		color: var(--white);
		background: var(--red);
		border-color: var(--red);
	}
	input {
		font-family: inherit;
		font-size: 11px;
		color: var(--ink);
		background: var(--white);
		border: 1px solid var(--line);
		padding: 2px 5px;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--red);
		outline-offset: 1px;
	}
	.slider {
		width: 70px;
		padding: 0;
		border: none;
		accent-color: var(--red);
	}

	.util-rail {
		display: flex;
		gap: 0 12px;
		padding: 3px 9px;
		font-size: 8.5px;
		letter-spacing: 0.06em;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
	}
	.ver {
		margin-left: auto;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 9px;
		border-bottom: 2px solid var(--ink);
	}
	.mark {
		font-weight: 900;
		font-size: 14px;
		letter-spacing: -0.02em;
	}
	.mark span {
		color: var(--red);
	}
	.tabs,
	.ops,
	.badges {
		display: flex;
		gap: 3px;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.title input {
		width: 8em;
	}
	.badges {
		margin-right: auto;
	}
	.badge {
		padding: 2px 5px;
		font-size: 8.5px;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--sub);
		border: 1px solid var(--line);
	}
	.badge.red {
		color: var(--white);
		background: var(--red);
		border-color: var(--red);
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px 12px;
		padding: 5px 9px;
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.grp + .grp {
		padding-left: 12px;
		border-left: 1px solid var(--line);
	}
	.grp.right {
		margin-left: auto;
	}
	.grp button i {
		font-style: normal;
		font-size: 8px;
		margin-left: 4px;
		color: var(--muted);
	}
	.grp button.on i {
		color: rgba(255, 255, 255, 0.7);
	}
	.seg {
		display: flex;
	}
	.seg button + button {
		margin-left: -1px;
	}

	.middle {
		display: flex;
		flex: 1;
		min-height: 0;
	}
	.rail {
		width: 190px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 6px;
		overflow-y: auto;
	}
	.rail.left {
		border-right: 1px solid var(--line);
	}
	.rail.right {
		width: 210px;
		border-left: 1px solid var(--line);
	}
	.mod {
		position: relative;
		padding: 22px 8px 8px;
		border: 1px solid var(--line);
	}
	.tab {
		position: absolute;
		top: 0;
		left: 0;
		padding: 2px 7px;
		font-size: 8.5px;
		font-weight: 700;
		letter-spacing: 0.07em;
		color: var(--white);
		background: var(--ink);
	}
	.tab.red {
		background: var(--red);
	}

	.mini {
		width: 100%;
		border-collapse: collapse;
	}
	.mini td {
		padding: 3px 5px;
		font-size: 10px;
		border-bottom: 1px solid var(--line);
	}
	.mini tr.on td {
		background: var(--surface);
		font-weight: 700;
	}
	.mini .v {
		text-align: right;
		font-weight: 700;
		white-space: nowrap;
	}
	.mini .v.red {
		color: var(--red);
	}
	.box {
		display: inline-block;
		width: 10px;
		height: 10px;
		border: 1px solid var(--sub);
		background: var(--white);
	}
	.box.ticked {
		background: var(--red);
		border-color: var(--red);
	}
	.hist {
		display: grid;
		gap: 1px;
		background: var(--line);
		border: 1px solid var(--line);
	}
	.hist li {
		padding: 3px 6px;
		background: var(--white);
		font-size: 10px;
		color: var(--sub);
	}
	.hist li.cur {
		color: var(--ink);
		font-weight: 700;
		background: var(--surface);
	}

	.stage {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: clamp(0.8rem, 2.5vw, 2rem);
		background: var(--surface);
	}
	.board {
		padding: 8px;
		background: var(--white);
		border: 1px solid var(--line);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e6e6e6 0% 25%, #f7f7f7 0% 50%) 0 0 / 16px 16px;
	}
	.readout {
		border-collapse: collapse;
		background: var(--white);
		border: 1px solid var(--line);
	}
	.readout td {
		padding: 4px 8px;
		font-size: 9.5px;
		color: var(--sub);
		letter-spacing: 0.05em;
		border-right: 1px solid var(--line);
	}
	.readout .v {
		color: var(--ink);
		font-weight: 700;
		letter-spacing: 0;
	}
	.readout .v.red {
		color: var(--red);
	}
	.chip {
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-right: 4px;
	}
	.chip.prev {
		background: #d04648;
	}
	.chip.next {
		background: #6daa2c;
	}

	.monitor {
		display: flex;
		justify-content: center;
		padding: 10px 0;
		background: var(--surface);
		border: 1px solid var(--line);
		margin-bottom: 6px;
	}
	.monitor :global(canvas) {
		background: repeating-conic-gradient(#e6e6e6 0% 25%, #f7f7f7 0% 50%) 0 0 / 10px 10px;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		gap: 2px;
		margin-bottom: 6px;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		background: var(--c);
		border: 1px solid rgba(0, 0, 0, 0.2);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#e0e0e0 0% 25%, #f7f7f7 0% 50%) 0 0 / 7px 7px;
	}
	.sw.sel {
		outline: 2px solid var(--red);
		outline-offset: 1px;
	}

	.strip {
		border-top: 2px solid var(--ink);
		padding: 6px 9px 8px;
	}
	.strip-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 6px;
	}
	.strip-head .tab {
		position: static;
	}
	.strip-head .ops {
		align-items: center;
		gap: 3px;
	}
	.ms {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: 8px;
	}
	.ms input {
		width: 4em;
	}
	.frames {
		display: grid;
		grid-template-columns: repeat(16, 1fr);
		gap: 4px;
	}
	.frames li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}
	.frame {
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		background: repeating-conic-gradient(#e6e6e6 0% 25%, #f7f7f7 0% 50%) 0 0 / 8px 8px;
		border: 1px solid var(--line);
	}
	.frame :global(canvas) {
		background: transparent;
	}
	.frame.sel {
		border-color: var(--red);
		box-shadow: 0 0 0 1px var(--red);
	}
	.frame.empty {
		background: var(--white);
		border-style: dashed;
	}
	.no {
		font-size: 8px;
		color: var(--muted);
	}

	.toast {
		position: absolute;
		left: 50%;
		bottom: 15rem;
		transform: translateX(-50%);
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 8px;
		align-items: baseline;
		max-width: min(42rem, calc(100vw - 3rem));
		padding: 8px 26px 8px 10px;
		background: var(--white);
		border: 1px solid var(--line);
		border-top: 2px solid var(--red);
	}
	.tid {
		font-size: 9px;
		font-weight: 700;
		color: var(--red);
	}
	.cat {
		font-size: 9px;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.toast p {
		font-size: 11.5px;
		line-height: 1.5;
	}
	.x {
		position: absolute;
		right: 5px;
		top: 5px;
		padding: 0 4px;
		font-size: 11px;
	}

	@media (max-width: 1000px) {
		.middle {
			flex-direction: column;
		}
		.rail,
		.rail.right {
			width: auto;
			flex-direction: row;
			flex-wrap: wrap;
			border: none;
			border-top: 1px solid var(--line);
		}
		.rail .mod {
			flex: 1 1 220px;
		}
		.badges,
		.title,
		.toast {
			display: none;
		}
		.frames {
			grid-template-columns: repeat(8, 1fr);
		}
	}
</style>
