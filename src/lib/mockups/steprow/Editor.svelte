<script lang="ts">
	import { onMount } from 'svelte';
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';
	import SevenSeg from './SevenSeg.svelte';

	const FRAMES = 4;
	const STEPS = 16;
	let step = $state(0);
	let running = $state(true);
	const current = 1; // the frame being drawn

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) running = false;
		const timer = setInterval(() => {
			if (running) step = (step + 1) % FRAMES;
		}, 125);
		return () => clearInterval(timer);
	});

	const QUARTER = ['red', 'orange', 'yellow', 'white'] as const;
	const quarterOf = (i: number) => QUARTER[Math.floor(i / 4)];

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
	const MODES = ['FOCUS', 'GRID', 'LOOP'];
	const LAYERS = [
		{ n: 'Highlights', on: true },
		{ n: 'Character', on: true, active: true },
		{ n: 'Sketch', on: false }
	];
</script>

<div class="mock shell">
	<header class="bar">
		<span class="screw" aria-hidden="true"></span>
		<span class="mark">DOODLE&#8209;DO</span>
		<div class="bank" role="group" aria-label="Workspace mode">
			{#each MODES as m, i (m)}
				<button class:on={i === 0}>{m}</button>
			{/each}
		</div>
		<label class="docname">
			<span class="silk">PATTERN</span>
			<input value="hero-walk" aria-label="Document name" />
		</label>
		<span class="status">AUTOSAVED 14:32:08</span>
		<div class="ops">
			<button>NEW</button>
			<button>OPEN</button>
			<button class="hot">SAVE</button>
			<button>SHEET</button>
			<button>GIF</button>
			<button class="lit-btn">TIPS</button>
		</div>
		<span class="screw" aria-hidden="true"></span>
	</header>

	<div class="toolbar">
		<div class="group" role="group" aria-label="Tools">
			{#each TOOLS as [name, key] (name)}
				<button class="tool" class:on={name === 'PENCIL'}>
					{name}<i>{key}</i>
				</button>
			{/each}
		</div>
		<div class="group">
			<span class="silk">SIZE</span>
			<div class="seg">
				{#each [1, 2, 3, 4] as s (s)}
					<button class:on={s === 2}>{s}</button>
				{/each}
			</div>
		</div>
		<div class="group">
			<button class="tool">MIRROR</button>
			<button class="tool">FLIP H</button>
			<button class="tool">FLIP V</button>
		</div>
		<div class="group">
			<span class="silk">ONION</span>
			<span class="knob" style="--deg: 44deg" aria-hidden="true"></span>
			<span class="knob-val">0.35</span>
			<button class="tool on">ON</button>
		</div>
		<div class="group zoom">
			<button class="tool">&minus;</button>
			<span class="zoomval">18&times;</span>
			<button class="tool">+</button>
			<button class="tool on">GRID</button>
		</div>
	</div>

	<div class="middle">
		<div class="stage">
			<div class="board">
				<Sprite frame={current} scale={22} onion={0.35} grid />
			</div>
			<div class="stage-foot">
				<span class="silk">FRAME 02 OF 04 &middot; 16 &times; 16 &middot; ONION ON</span>
				<span class="silk">PREV <i class="chip prev"></i> NEXT <i class="chip next"></i></span>
			</div>
		</div>

		<aside class="rail">
			<section>
				<div class="rail-head">
					<span class="silk">OUTPUT</span>
					<button class="mini" class:on={running} onclick={() => (running = !running)}>
						{running ? 'STOP' : 'RUN'}
					</button>
				</div>
				<div class="monitor">
					<Sprite frame={step} scale={6} />
				</div>
				<div class="rate">
					<SevenSeg value="08.0" height={28} />
					<span class="silk">FPS</span>
				</div>
			</section>

			<section>
				<div class="rail-head">
					<span class="silk">LAYERS</span>
					<button class="mini">MERGE</button>
				</div>
				<ul class="layers">
					{#each LAYERS as l (l.n)}
						<li class:active={l.active}>
							<span class="led" class:lit={l.on}></span>
							{l.n}
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<div class="rail-head">
					<span class="silk">PALETTE</span>
					<button class="mini on">LOCKED</button>
				</div>
				<div class="swatches">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button
							class="sw"
							class:sel={i === 6}
							style="--c: {hex}"
							aria-label={hex}
						></button>
					{/each}
				</div>
				<p class="hint">16 of 64 &middot; locked to the starter set</p>
			</section>
		</aside>
	</div>

	<footer class="row-block">
		<div class="row-top">
			<span class="silk">STEP ROW &middot; FRAMES</span>
			<div class="row-ops">
				<button class="tool">NEW</button>
				<button class="tool">DUPLICATE</button>
				<button class="tool">DELETE</button>
				<span class="silk range">LOOP 01 &rarr; 04</span>
				<label class="ms"><span class="silk">MS</span><input value="125" aria-label="Frame duration" /></label>
			</div>
		</div>
		<ol class="numbers" aria-hidden="true">
			{#each { length: STEPS } as _, i (i)}
				<li>{String(i + 1).padStart(2, '0')}</li>
			{/each}
		</ol>
		<ol class="steps">
			{#each { length: STEPS } as _, i (i)}
				<li>
					<span
						class="led"
						class:armed={i < FRAMES}
						class:lit={i === step && running}
						data-q={quarterOf(i)}
					></span>
					{#if i < FRAMES}
						<button class="framekey" class:sel={i === current} data-q={quarterOf(i)}>
							<Sprite frame={i} scale={3} />
						</button>
					{:else}
						<span class="framekey empty" data-q={quarterOf(i)}></span>
					{/if}
				</li>
			{/each}
		</ol>
	</footer>

	<div class="toast" role="status">
		<span class="lamp" aria-hidden="true"></span>
		<span class="legend-id">T02</span>
		<p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p>
		<button class="mini" aria-label="Dismiss tip">&times;</button>
	</div>
</div>

<style>
	.shell {
		--panel: #171717;
		--rule: #2e2e2e;
		--silk: #e9e6df;
		--silk-dim: #a29e95;
		--red: #ff3b30;
		--yellow: #ffd600;
		--grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E");
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--panel);
		background-image: var(--grain);
		color: var(--silk);
		font-family: Archivo, system-ui, sans-serif;
		font-size: 0.8125rem;
		position: relative;
	}

	.silk {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: var(--silk-dim);
		text-transform: uppercase;
		white-space: nowrap;
	}

	button {
		background: linear-gradient(180deg, #2a2a2a, #1c1c1c);
		border: 1px solid #383838;
		border-radius: 3px;
		color: var(--silk);
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		padding: 0.42rem 0.7rem;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			0 1px 2px rgba(0, 0, 0, 0.6);
	}
	button:hover {
		background: linear-gradient(180deg, #353535, #222);
	}
	button:active {
		transform: translateY(1px);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.7);
	}
	button.on,
	button.lit-btn {
		color: #150604;
		background: linear-gradient(180deg, #ff5647, #e02c22);
		border-color: #8f1a13;
	}
	button.hot {
		color: #1a1200;
		background: linear-gradient(180deg, #ffb845, #e08a00);
		border-color: #8a5400;
	}
	input {
		background: #0e0e0e;
		border: 1px solid #333;
		border-radius: 3px;
		color: var(--yellow);
		font: inherit;
		font-variant-numeric: tabular-nums;
		padding: 0.32rem 0.5rem;
	}
	input:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--yellow);
		outline-offset: 1px;
	}

	/* ---------- header ---------- */
	.bar {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.55rem 0.85rem;
		background: linear-gradient(180deg, #202020, #141414);
		border-bottom: 1px solid var(--rule);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
	}
	.screw {
		width: 10px;
		height: 10px;
		flex: none;
		border-radius: 50%;
		background:
			linear-gradient(90deg, transparent 43%, #0c0c0c 43% 57%, transparent 57%),
			radial-gradient(circle at 35% 30%, #6d6d6d, #2b2b2b 70%, #171717);
	}
	.mark {
		font-family: 'Chakra Petch', Archivo, sans-serif;
		font-weight: 700;
		font-size: 0.9375rem;
		letter-spacing: 0.02em;
	}
	.bank {
		display: flex;
		border: 1px solid #383838;
		border-radius: 3px;
		overflow: hidden;
	}
	.bank button {
		border: none;
		border-radius: 0;
		box-shadow: none;
	}
	.bank button + button {
		border-left: 1px solid #383838;
	}
	.docname {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.docname input {
		width: 9em;
		color: var(--silk);
	}
	.status {
		flex: 1;
		font-size: 0.625rem;
		letter-spacing: 0.14em;
		color: #7c7970;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ops {
		display: flex;
		gap: 3px;
	}

	/* ---------- toolbar ---------- */
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem 0.85rem;
		padding: 0.55rem 0.85rem;
		border-bottom: 1px solid var(--rule);
		background: linear-gradient(180deg, #1c1c1c, #171717);
	}
	.group {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.group + .group {
		padding-left: 0.85rem;
		border-left: 1px solid var(--rule);
	}
	.tool {
		position: relative;
		padding-right: 1.35rem;
	}
	.tool i {
		position: absolute;
		right: 5px;
		top: 3px;
		font-style: normal;
		font-size: 0.5rem;
		letter-spacing: 0;
		color: #8a877f;
	}
	.tool.on i {
		color: rgba(21, 6, 4, 0.65);
	}
	.seg {
		display: flex;
		border: 1px solid #383838;
		border-radius: 3px;
		overflow: hidden;
	}
	.seg button {
		border: none;
		border-radius: 0;
		box-shadow: none;
		padding: 0.42rem 0.55rem;
	}
	.seg button + button {
		border-left: 1px solid #383838;
	}
	.knob {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background:
			linear-gradient(var(--deg), transparent 46%, var(--yellow) 46% 54%, transparent 54%) center /
				100% 52% no-repeat,
			radial-gradient(circle at 40% 32%, #4a4a4a, #232323 65%, #141414);
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.12),
			0 2px 3px rgba(0, 0, 0, 0.7);
	}
	.knob-val {
		font-size: 0.6875rem;
		color: var(--yellow);
		font-variant-numeric: tabular-nums;
	}
	.zoom {
		margin-left: auto;
	}
	@media (max-width: 1180px) {
		.zoom {
			margin-left: 0;
		}
	}
	.zoomval {
		min-width: 3em;
		text-align: center;
		font-variant-numeric: tabular-nums;
		color: var(--silk-dim);
	}

	/* ---------- middle ---------- */
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
		padding: clamp(1rem, 3vw, 2.4rem);
		background:
			radial-gradient(ellipse at 50% 35%, rgba(255, 255, 255, 0.035), transparent 62%),
			#131313;
	}
	.board {
		padding: 10px;
		background: repeating-conic-gradient(#242424 0% 25%, #1c1c1c 0% 50%) 0 0 / 16px 16px;
		border: 1px solid #3a3a3a;
		border-radius: 3px;
		box-shadow:
			inset 0 0 0 1px rgba(0, 0, 0, 0.6),
			0 16px 40px rgba(0, 0, 0, 0.6);
	}
	.stage-foot {
		display: flex;
		gap: 1.6rem;
		align-items: center;
	}
	.chip {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 2px;
		vertical-align: -1px;
	}
	.chip.prev {
		background: #d04648;
	}
	.chip.next {
		background: #6daa2c;
	}

	.rail {
		width: 232px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		border-left: 1px solid var(--rule);
		background: linear-gradient(180deg, #1b1b1b, #151515);
		overflow-y: auto;
	}
	.rail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.6rem;
		margin-bottom: 0.75rem;
		border-bottom: 1px solid var(--rule);
	}
	.mini {
		padding: 0.28rem 0.5rem;
		font-size: 0.5625rem;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.85rem;
		background: repeating-conic-gradient(#242424 0% 25%, #1c1c1c 0% 50%) 0 0 / 12px 12px;
		border: 1px solid #333;
		border-radius: 3px;
	}
	.rate {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-top: 0.7rem;
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.42rem 0.5rem;
		border-radius: 3px;
		color: #b6b3ab;
	}
	.layers li.active {
		background: #232323;
		color: var(--silk);
		box-shadow: inset 0 0 0 1px #383838;
	}
	.led {
		width: 6px;
		height: 6px;
		flex: none;
		border-radius: 50%;
		background: #2a1614;
	}
	.led.armed {
		background: #ff3b30;
		box-shadow: 0 0 6px 1px rgba(255, 59, 48, 0.55);
	}
	.led.lit {
		background: #fff2ef;
		box-shadow: 0 0 11px 4px rgba(255, 90, 74, 0.95);
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 4px;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		border-radius: 2px;
		background: var(--c);
		border: 1px solid rgba(0, 0, 0, 0.6);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
	}
	.sw.alpha {
		background: repeating-conic-gradient(#3a3a3a 0% 25%, #262626 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 2px solid var(--yellow);
		outline-offset: 1px;
	}
	.hint {
		margin-top: 0.6rem;
		font-size: 0.6875rem;
		color: #7c7970;
	}

	/* ---------- step row ---------- */
	.row-block {
		padding: 0.75rem 0.85rem 1rem;
		border-top: 1px solid var(--rule);
		background: linear-gradient(180deg, #1d1d1d, #151515);
	}
	.row-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.8rem;
	}
	.row-ops {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.range {
		margin-left: 0.8rem;
		color: var(--yellow);
	}
	.ms {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.ms input {
		width: 4.2em;
	}
	.numbers,
	.steps {
		display: grid;
		grid-template-columns: repeat(16, 1fr);
		gap: 5px;
	}
	.numbers li {
		font-size: 0.5625rem;
		text-align: center;
		color: #6f6c65;
		font-variant-numeric: tabular-nums;
	}
	.steps {
		margin-top: 4px;
	}
	.steps li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}
	.framekey {
		width: 100%;
		padding: 4px;
		display: grid;
		place-items: center;
		border-radius: 3px;
		background: linear-gradient(180deg, #2a2a2a, #1d1d1d);
		border: 1px solid #383838;
	}
	.framekey :global(canvas) {
		background: repeating-conic-gradient(#3a3a3a 0% 25%, #2e2e2e 0% 50%) 0 0 / 8px 8px;
	}
	/* Full-Chroma Key Rule: an empty slot is a key with nothing drawn on it,
	   not a dimmed key. Emptiness is carried by the missing thumbnail and the
	   unlit lamp above it, never by desaturating the world's key colours. */
	.framekey.empty {
		aspect-ratio: 3 / 4;
		border: none;
	}
	.framekey.empty[data-q='red'] {
		background: linear-gradient(180deg, #ff5647, #d92c22);
	}
	.framekey.empty[data-q='orange'] {
		background: linear-gradient(180deg, #ffab2e, #e07f00);
	}
	.framekey.empty[data-q='yellow'] {
		background: linear-gradient(180deg, #ffe14d, #e5b800);
	}
	.framekey.empty[data-q='white'] {
		background: linear-gradient(180deg, #ffffff, #d6d6d6);
	}
	.framekey[data-q='red'] {
		border-color: #6a2620;
	}
	.framekey.sel {
		border-color: var(--red);
		box-shadow: 0 0 0 1px var(--red);
	}

	/* ---------- toast ---------- */
	.toast {
		position: absolute;
		left: 50%;
		bottom: 12.5rem;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.8rem;
		max-width: min(46rem, calc(100vw - 3rem));
		padding: 0.75rem 0.9rem;
		background: linear-gradient(180deg, #232323, #191919);
		border: 1px solid #3d3d3d;
		border-radius: 4px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
	}
	.lamp {
		width: 7px;
		height: 7px;
		flex: none;
		border-radius: 50%;
		background: var(--yellow);
		box-shadow: 0 0 7px 1px rgba(255, 214, 0, 0.55);
	}
	.legend-id {
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		color: #7c7970;
	}
	.toast p {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: #d3d0c8;
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
		.docname {
			display: none;
		}
		.toast {
			display: none;
		}
	}
</style>
