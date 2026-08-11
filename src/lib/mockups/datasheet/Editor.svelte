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
		<span class="pn">DD&#8209;16</span>
		<span class="mark">DOODLE&#8209;DO</span>
		<div class="tabs" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">DOC</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">AUTOSAVE OK &middot; 14:32:08 &middot; LOCAL</span>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="act">SAVE</button>
			<button>SHEET</button><button>GIF</button><button class="on">TIPS</button>
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
		<div class="grp"><button>FLIP&nbsp;H</button><button>FLIP&nbsp;V</button></div>
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
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<dl class="readout">
				<div><dt>FRAME</dt><dd>02 / 04</dd></div>
				<div><dt>SIZE</dt><dd>16 &times; 16</dd></div>
				<div><dt>ONION</dt><dd>0.35</dd></div>
				<div><dt>PREV</dt><dd><i class="chip prev"></i>#d04648</dd></div>
				<div><dt>NEXT</dt><dd><i class="chip next"></i>#6daa2c</dd></div>
			</dl>
		</div>

		<aside class="rail">
			<section>
				<h2>LOOP</h2>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<dl class="kv">
					<div><dt>RATE</dt><dd>8 fps</dd></div>
					<div><dt>FRAMES</dt><dd>4</dd></div>
					<div><dt>PERIOD</dt><dd>500 ms</dd></div>
				</dl>
			</section>
			<section>
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
			<section>
				<h2>PALETTE<button class="chip-btn on">LOCKED</button></h2>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="--c: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<dl class="kv">
					<div><dt>IN USE</dt><dd>16 / 64</dd></div>
					<div><dt>INDEX</dt><dd>07 &middot; #d04648</dd></div>
				</dl>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="strip-head">
			<span class="lab">FRAME TABLE</span>
			<div class="strip-ops">
				<button>NEW</button><button>DUPLICATE</button><button>DELETE</button>
				<span class="lab range">LOOP 01 &rarr; 04</span>
				<label class="ms"><span class="lab">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="frames">
			{#each { length: 10 } as _, i (i)}
				<li>
					{#if i < FRAMES}
						<button class="frame" class:sel={i === current}>
							<Sprite frame={i} scale={3} />
						</button>
					{:else}
						<span class="frame empty"></span>
					{/if}
					<span class="no">{String(i + 1).padStart(2, '0')}</span>
				</li>
			{/each}
		</ol>
	</footer>

	<div class="toast" role="status">
		<span class="tid">T02</span>
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button class="x" aria-label="Dismiss tip">&times;</button>
	</div>
</div>

<style>
	.shell {
		--paper: #eef1f3;
		--paper-2: #e2e7ea;
		--ink: #12181c;
		--ink-2: #4d5860;
		--rule: #b6c0c6;
		--cyan: #007f8d;
		--cyan-ink: #005a65;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
		font-family: Barlow, system-ui, sans-serif;
		font-size: 0.8125rem;
		position: relative;
	}
	.lab,
	.val,
	.pn,
	.tid {
		font-family: 'Martian Mono', ui-monospace, monospace;
		letter-spacing: -0.03em;
	}
	.lab {
		font-size: 0.5625rem;
		color: var(--ink-2);
		white-space: nowrap;
	}
	.val {
		font-size: 0.625rem;
		color: var(--cyan-ink);
		min-width: 2.8em;
		text-align: center;
	}

	button {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5625rem;
		letter-spacing: -0.03em;
		color: var(--ink);
		background: #fff;
		border: 1px solid var(--rule);
		padding: 0.4rem 0.55rem;
	}
	button:hover {
		background: var(--paper-2);
	}
	button.on {
		color: #fff;
		background: var(--cyan);
		border-color: var(--cyan-ink);
	}
	button.act {
		color: #fff;
		background: var(--ink);
		border-color: var(--ink);
	}
	input {
		font-family: Barlow, sans-serif;
		font-size: 0.75rem;
		color: var(--ink);
		background: #fff;
		border: 1px solid var(--rule);
		padding: 0.25rem 0.4rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--cyan);
		outline-offset: 1px;
	}
	.slider {
		width: 76px;
		padding: 0;
		border: none;
		background: none;
		accent-color: var(--cyan);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.85rem;
		background: #fff;
		border-bottom: 3px solid var(--ink);
	}
	.pn {
		font-size: 0.625rem;
		font-weight: 800;
		color: var(--paper);
		background: var(--ink);
		padding: 0.3rem 0.4rem;
	}
	.mark {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.8125rem;
		font-weight: 800;
		letter-spacing: -0.04em;
	}
	.tabs {
		display: flex;
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
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5rem;
		letter-spacing: -0.02em;
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
		padding: 0.5rem 0.85rem;
		background: #fff;
		border-bottom: 1px solid var(--rule);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.grp + .grp {
		padding-left: 1rem;
		border-left: 1px solid var(--rule);
	}
	.grp.right {
		margin-left: auto;
	}
	.grp button i {
		font-style: normal;
		font-size: 0.5rem;
		margin-left: 0.45em;
		color: var(--ink-2);
	}
	.grp button.on i {
		color: rgba(255, 255, 255, 0.75);
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
	.stage {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.3rem;
		padding: clamp(1rem, 3vw, 2.5rem);
		background:
			linear-gradient(var(--paper-2) 1px, transparent 1px) 0 0 / 100% 24px,
			linear-gradient(90deg, var(--paper-2) 1px, transparent 1px) 0 0 / 24px 100%,
			var(--paper);
	}
	.board {
		padding: 10px;
		background: #fff;
		border: 1px solid var(--rule);
		box-shadow: 0 6px 18px rgba(18, 24, 28, 0.09);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#e2e7ea 0% 25%, #f4f7f8 0% 50%) 0 0 / 16px 16px;
	}
	.readout {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.6rem;
		padding: 0.55rem 0.9rem;
		background: #fff;
		border: 1px solid var(--rule);
	}
	.readout dt,
	.kv dt {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5rem;
		letter-spacing: -0.02em;
		color: var(--ink-2);
	}
	.readout dd,
	.kv dd {
		margin: 2px 0 0;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.chip {
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-right: 5px;
	}
	.chip.prev {
		background: #d04648;
	}
	.chip.next {
		background: #6daa2c;
	}

	.rail {
		width: 234px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
		padding: 0.9rem;
		background: #fff;
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
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		color: var(--cyan-ink);
		border-bottom: 2px solid var(--ink);
	}
	.chip-btn {
		padding: 0.15rem 0.35rem;
		font-size: 0.5rem;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.85rem;
		background: repeating-conic-gradient(#e2e7ea 0% 25%, #f4f7f8 0% 50%) 0 0 / 12px 12px;
		border: 1px solid var(--rule);
	}
	.kv {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.2rem;
		margin-top: 0.7rem;
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		font-size: 0.75rem;
	}
	.layers li.active {
		background: var(--paper-2);
		box-shadow: inset 0 0 0 1px var(--cyan);
	}
	.box {
		width: 11px;
		height: 11px;
		flex: none;
		border: 1px solid var(--ink-2);
		background: #fff;
	}
	.box.ticked {
		background: var(--cyan);
		border-color: var(--cyan-ink);
	}
	.wide {
		width: 100%;
		margin-top: 0.6rem;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 2px;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		background: var(--c);
		border: 1px solid rgba(18, 24, 28, 0.25);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#dbe1e5 0% 25%, #f4f7f8 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 2px solid var(--cyan);
		outline-offset: 1px;
	}

	.strip {
		background: #fff;
		border-top: 3px solid var(--ink);
		padding: 0.65rem 0.85rem 0.85rem;
	}
	.strip-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.65rem;
	}
	.strip-ops {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.range {
		margin-left: 0.7rem;
		color: var(--cyan-ink);
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
		background: repeating-conic-gradient(#e2e7ea 0% 25%, #f4f7f8 0% 50%) 0 0 / 8px 8px;
		border: 1px solid var(--rule);
	}
	.frame :global(canvas) {
		background: transparent;
	}
	.frame.sel {
		border-color: var(--cyan);
		box-shadow: 0 0 0 1px var(--cyan);
	}
	.frame.empty {
		background: var(--paper);
		border-style: dashed;
	}
	.no {
		font-family: 'Martian Mono', ui-monospace, monospace;
		font-size: 0.5rem;
		color: var(--ink-2);
	}

	.toast {
		position: absolute;
		left: 50%;
		bottom: 32%;
		transform: translateX(-50%);
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		max-width: min(42rem, calc(100vw - 3rem));
		padding: 0.8rem 2.2rem 0.8rem 1rem;
		background: #fff;
		border: 1px solid var(--rule);
		border-top: 3px solid var(--cyan);
		box-shadow: 0 10px 26px rgba(18, 24, 28, 0.16);
	}
	.tid {
		font-size: 0.5625rem;
		color: var(--cyan-ink);
	}
	.toast p {
		font-size: 0.875rem;
		line-height: 1.45;
		color: #2a343a;
	}
	.x {
		position: absolute;
		right: 6px;
		top: 6px;
		padding: 0.05rem 0.3rem;
		font-size: 0.75rem;
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
		.frames {
			grid-template-columns: repeat(5, 1fr);
		}
	}
</style>
