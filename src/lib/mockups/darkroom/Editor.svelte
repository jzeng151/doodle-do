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
	<div class="safelight" aria-hidden="true"></div>

	<header class="head">
		<span class="mark">DOODLE&#8209;DO</span>
		<div class="bays" role="group" aria-label="Workspace mode">
			<button class="on">FOCUS</button><button>GRID</button><button>LOOP</button>
		</div>
		<label class="title"><span class="lab">NEGATIVE</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">Autosaved 14:32:08</span>
		<div class="ops">
			<button>NEW</button><button>OPEN</button><button class="amber">SAVE</button>
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
		<!-- the easel under the enlarger: the only brightly lit surface -->
		<div class="stage">
			<div class="easel"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="cap">FRAME 02 OF 04 &middot; 16 &times; 16 &middot; ONION 0.35</p>
		</div>

		<aside class="rail">
			<section class="tray">
				<h2>DEVELOPER</h2>
				<div class="bath"><Sprite playing scale={6} /></div>
				<dl class="kv">
					<div><dt>RATE</dt><dd>8/sec</dd></div>
					<div><dt>SHEETS</dt><dd>4</dd></div>
					<div><dt>CYCLE</dt><dd>500 ms</dd></div>
				</dl>
			</section>
			<section class="tray">
				<h2>LAYERS</h2>
				<ul class="layers">
					{#each LAYERS as l (l.n)}
						<li class:active={l.active}>
							<span class="dot" class:on={l.on} aria-hidden="true"></span>{l.n}
						</li>
					{/each}
				</ul>
				<button class="wide">MERGE DOWN</button>
			</section>
			<section class="tray">
				<h2>FILTERS<button class="chip on">LOCKED</button></h2>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="background: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<p class="meta">16 of 64 &middot; locked to the starter set</p>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="wire" aria-hidden="true"></div>
		<div class="strip-head">
			<span class="lab">THE DRYING LINE</span>
			<div class="ops">
				<button>NEW</button><button>DUPLICATE</button><button>DELETE</button>
				<span class="lab loop">LOOP 01 &rarr; 04</span>
				<label class="ms"><span class="lab">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="prints">
			{#each { length: 10 } as _, i (i)}
				<li>
					{#if i < FRAMES}
						<button class="print" class:sel={i === current}>
							<span class="peg" aria-hidden="true"></span>
							<Sprite frame={i} scale={3} />
						</button>
					{:else}
						<span class="print blank"><span class="peg" aria-hidden="true"></span></span>
					{/if}
					<span class="no">{String(i + 1).padStart(2, '0')}</span>
				</li>
			{/each}
		</ol>
	</footer>

	<div class="note" role="status">
		<span class="nid">T02</span>
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button class="x" aria-label="Dismiss note">&times;</button>
	</div>
</div>

<style>
	.shell {
		--dark: #14100e;
		--dark-2: #1e1815;
		--amber: #e08a2c;
		--print: #d8d4cc;
		--print-dim: #9a958c;
		--enamel: #e8e4dc;
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--dark);
		color: var(--print);
		font-family: Karla, system-ui, sans-serif;
		font-size: 13px;
		line-height: 1.5;
		overflow-x: hidden;
	}
	.safelight {
		position: absolute;
		inset: 0;
		z-index: 0;
		background: radial-gradient(
			110% 70% at 82% 0%,
			rgba(224, 138, 44, 0.26),
			rgba(224, 138, 44, 0.06) 44%,
			transparent 74%
		);
		pointer-events: none;
	}
	.shell > *:not(.safelight) {
		position: relative;
		z-index: 1;
	}
	.lab,
	.val {
		font-size: 0.625rem;
		letter-spacing: 0.16em;
		color: var(--print-dim);
		white-space: nowrap;
	}
	.val {
		color: var(--amber);
		min-width: 3em;
		text-align: center;
	}

	button {
		padding: 0.35rem 0.6rem;
		font-family: Anton, sans-serif;
		font-size: 0.625rem;
		letter-spacing: 0.1em;
		color: var(--print);
		background: transparent;
		border: 1px solid rgba(216, 212, 204, 0.24);
	}
	button:hover {
		background: rgba(216, 212, 204, 0.1);
	}
	button.on {
		color: var(--dark);
		background: var(--amber);
		border-color: var(--amber);
	}
	button.amber {
		color: var(--dark);
		background: var(--amber);
		border-color: var(--amber);
	}
	input {
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--print);
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(216, 212, 204, 0.24);
		padding: 0.22rem 0.45rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--amber);
		outline-offset: 1px;
	}
	.slider {
		width: 76px;
		padding: 0;
		border: none;
		background: none;
		accent-color: var(--amber);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.55rem 0.9rem;
		border-bottom: 1px solid rgba(216, 212, 204, 0.18);
	}
	.mark {
		font-family: Anton, sans-serif;
		font-size: 0.9375rem;
		letter-spacing: 0.04em;
		color: var(--enamel);
	}
	.bays,
	.ops {
		display: flex;
		gap: 3px;
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
		color: var(--print-dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		padding: 0.55rem 0.9rem;
		border-bottom: 1px solid rgba(216, 212, 204, 0.12);
	}
	.grp {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.grp.right {
		margin-left: auto;
	}
	.grp button i {
		font-style: normal;
		font-size: 0.5rem;
		margin-left: 0.45em;
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
	.stage {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.1rem;
		padding: clamp(1rem, 3vw, 2.5rem);
		background: radial-gradient(60% 55% at 50% 42%, rgba(232, 228, 220, 0.14), transparent 70%);
	}
	.easel {
		padding: 14px;
		background: var(--enamel);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
	}
	.easel :global(canvas) {
		background: repeating-conic-gradient(#dcd7cd 0% 25%, #ece8df 0% 50%) 0 0 / 16px 16px;
	}
	.cap {
		font-size: 0.625rem;
		letter-spacing: 0.16em;
		color: var(--print-dim);
	}

	.rail {
		width: 236px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		border-left: 1px solid rgba(216, 212, 204, 0.14);
		overflow-y: auto;
	}
	.tray {
		padding: 0.85rem;
		background: var(--enamel);
		color: #241d19;
		border-radius: 9px;
		box-shadow: inset 0 0 0 3px #cfcabf;
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.45rem;
		margin-bottom: 0.75rem;
		font-family: Anton, sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		border-bottom: 1px solid #cfcabf;
	}
	.chip {
		padding: 0.1rem 0.4rem;
		font-size: 0.5rem;
		color: #241d19;
		border-color: #a49c90;
	}
	.chip.on {
		color: var(--dark);
	}
	.bath {
		display: flex;
		justify-content: center;
		padding: 0.8rem 0;
		background: #e0dbd0;
		border-radius: 5px;
	}
	.bath :global(canvas) {
		background: transparent;
	}
	.kv {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.1rem;
		margin-top: 0.7rem;
	}
	.kv dt {
		font-size: 0.5625rem;
		letter-spacing: 0.12em;
		color: #6b6259;
	}
	.kv dd {
		margin: 0;
		font-size: 0.8125rem;
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.32rem 0.35rem;
		font-size: 0.8125rem;
	}
	.layers li.active {
		background: #d8d2c6;
	}
	.dot {
		width: 10px;
		height: 10px;
		flex: none;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1.5px #6b6259;
	}
	.dot.on {
		background: #241d19;
		box-shadow: none;
	}
	.wide {
		width: 100%;
		margin-top: 0.6rem;
		color: #241d19;
		border-color: #a49c90;
	}
	.wide:hover {
		background: #d8d2c6;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 3px;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		border: 1px solid rgba(0, 0, 0, 0.3);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#d0cabd 0% 25%, #e8e4dc 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 2px solid #241d19;
		outline-offset: 1px;
	}
	.meta {
		margin-top: 0.55rem;
		font-size: 0.6875rem;
		color: #6b6259;
	}

	.strip {
		position: relative;
		padding: 1.6rem 0.9rem 0.9rem;
		border-top: 1px solid rgba(216, 212, 204, 0.18);
	}
	.wire {
		position: absolute;
		top: 2.9rem;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(180deg, #6b6259, #332d28);
	}
	.strip-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.1rem;
	}
	.strip-head .ops {
		align-items: center;
	}
	.loop {
		margin-left: 0.7rem;
		color: var(--amber);
	}
	.ms {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.ms input {
		width: 4.2em;
	}
	.prints {
		position: relative;
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 6px;
	}
	.prints li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}
	.print {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 5;
		display: grid;
		place-items: center;
		padding: 0;
		background: var(--print);
		border: none;
		box-shadow: 0 5px 12px rgba(0, 0, 0, 0.5);
	}
	.print :global(canvas) {
		background: #eceae4;
	}
	.print.sel {
		background: #efece5;
		box-shadow:
			0 6px 14px rgba(0, 0, 0, 0.55),
			0 0 0 2px var(--amber);
	}
	.print.blank {
		background: rgba(216, 212, 204, 0.14);
		box-shadow: none;
	}
	.peg {
		position: absolute;
		top: -9px;
		width: 6px;
		height: 14px;
		background: #b8ad9d;
	}
	.no {
		font-size: 0.5625rem;
		letter-spacing: 0.1em;
		color: var(--print-dim);
	}

	.note {
		position: absolute;
		left: 50%;
		bottom: 13rem;
		transform: translateX(-50%);
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.9rem;
		align-items: baseline;
		max-width: min(40rem, calc(100vw - 3rem));
		padding: 0.85rem 2.3rem 0.85rem 1rem;
		background: var(--enamel);
		color: #241d19;
		border-radius: 8px;
		box-shadow: 0 14px 32px rgba(0, 0, 0, 0.6);
	}
	.nid {
		font-size: 0.625rem;
		letter-spacing: 0.14em;
		color: #a4441f;
	}
	.note p {
		font-size: 0.9375rem;
	}
	.x {
		position: absolute;
		right: 6px;
		top: 6px;
		padding: 0 0.3rem;
		font-size: 0.8125rem;
		color: #241d19;
		border-color: #a49c90;
	}

	@media (max-width: 880px) {
		.middle {
			flex-direction: column;
		}
		.rail {
			width: auto;
			border-left: none;
			border-top: 1px solid rgba(216, 212, 204, 0.14);
		}
		.status,
		.title,
		.note {
			display: none;
		}
		.prints {
			grid-template-columns: repeat(5, 1fr);
		}
	}
</style>
