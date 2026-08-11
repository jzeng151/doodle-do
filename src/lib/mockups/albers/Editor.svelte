<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const FRAMES = 4;
	const current = 1;
	const TOOLS = [
		['pencil', 'B'],
		['eraser', 'E'],
		['fill', 'G'],
		['pick', 'I'],
		['select', 'M'],
		['lasso', 'L'],
		['wand', 'W'],
		['polygon', 'P']
	];
	const LAYERS = [
		{ n: 'highlights', on: true },
		{ n: 'character', on: true, active: true },
		{ n: 'sketch', on: false }
	];
</script>

<div class="mock shell">
	<header class="head">
		<span class="mark">doodle&#8209;do</span>
		<div class="views" role="group" aria-label="Workspace mode">
			<button class="on">focus</button><button>grid</button><button>loop</button>
		</div>
		<label class="title"><span class="lab">study</span><input value="hero-walk" aria-label="Document name" /></label>
		<span class="status">autosaved 14:32:08</span>
		<div class="ops">
			<button>new</button><button>open</button><button class="act">save</button>
			<button>sheet</button><button>gif</button><button class="on">notes</button>
		</div>
	</header>

	<div class="toolbar">
		<div class="grp" role="group" aria-label="Tools">
			{#each TOOLS as [n, k] (n)}
				<button class:on={n === 'pencil'}>{n}<i>{k}</i></button>
			{/each}
		</div>
		<div class="grp">
			<span class="lab">size</span>
			<div class="seg">{#each [1, 2, 3, 4] as s (s)}<button class:on={s === 2}>{s}</button>{/each}</div>
			<button>mirror</button>
		</div>
		<div class="grp"><button>flip h</button><button>flip v</button></div>
		<div class="grp">
			<button class="on">onion</button>
			<input class="slider" type="range" min="0" max="100" value="35" aria-label="Onion skin opacity" />
			<span class="val">0.35</span>
		</div>
		<div class="grp right">
			<button>&minus;</button><span class="val">18&times;</span><button>+</button><button class="on">grid</button>
		</div>
	</div>

	<div class="middle">
		<!-- the working field is itself a ground, so the drawing is always read
		     against a colour rather than against neutral chrome -->
		<div class="stage">
			<div class="board"><Sprite frame={current} scale={22} onion={0.35} grid /></div>
			<p class="cap">frame 02 of 04 &middot; 16 &times; 16 &middot; onion 0.35</p>
		</div>

		<aside class="rail">
			<section>
				<h2>loop</h2>
				<div class="monitor"><Sprite playing scale={6} /></div>
				<dl class="kv">
					<div><dt>rate</dt><dd>8 fps</dd></div>
					<div><dt>frames</dt><dd>4</dd></div>
					<div><dt>period</dt><dd>500 ms</dd></div>
				</dl>
			</section>
			<section>
				<h2>layers</h2>
				<ul class="layers">
					{#each LAYERS as l (l.n)}
						<li class:active={l.active}>
							<span class="dot" class:on={l.on} aria-hidden="true"></span>{l.n}
						</li>
					{/each}
				</ul>
				<button class="wide">merge down</button>
			</section>
			<section>
				<h2>the case<button class="chip on">locked</button></h2>
				<div class="chips">
					<button class="sw alpha" aria-label="Transparent"></button>
					{#each PALETTE as hex, i (hex)}
						<button class="sw" class:sel={i === 6} style="background: {hex}" aria-label={hex}></button>
					{/each}
				</div>
				<dl class="kv">
					<div><dt>in use</dt><dd>16 / 64</dd></div>
					<div><dt>index</dt><dd>07</dd></div>
				</dl>
			</section>
		</aside>
	</div>

	<footer class="strip">
		<div class="strip-head">
			<span class="lab">frames</span>
			<div class="ops">
				<button>new</button><button>duplicate</button><button>delete</button>
				<span class="lab loop">loop 01 → 04</span>
				<label class="ms"><span class="lab">ms</span><input value="125" aria-label="Frame duration" /></label>
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
					<span class="no">{String(i + 1).padStart(2, '0')}</span>
				</li>
			{/each}
		</ol>
	</footer>

	<div class="note" role="status">
		<span class="nid">T02</span>
		<p>the red ghost is your previous frame. draw where things have moved to, not where they were.</p>
		<button class="x" aria-label="Dismiss note">&times;</button>
	</div>
</div>

<style>
	.shell {
		--paper: #e8e2d4;
		--paper-2: #ddd6c6;
		--ink: #1d1b17;
		--sub: #57534a;
		--vermilion: #b83e19;
		--ultramarine: #2f5aa8;
		--ochre: #d9a02b;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
		font-family: Jost, system-ui, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		position: relative;
	}
	.lab,
	.val {
		font-size: 0.75rem;
		color: var(--sub);
		white-space: nowrap;
	}
	.val {
		min-width: 3em;
		text-align: center;
	}

	button {
		padding: 0.35rem 0.65rem;
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--ink);
		background: transparent;
		border: none;
		box-shadow: inset 0 0 0 1px rgba(29, 27, 23, 0.28);
	}
	button:hover {
		background: var(--paper-2);
	}
	button.on {
		color: var(--paper);
		background: var(--ink);
		box-shadow: none;
	}
	button.act {
		color: var(--paper);
		background: var(--vermilion);
		box-shadow: none;
	}
	input {
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--ink);
		background: transparent;
		border: none;
		box-shadow: inset 0 0 0 1px rgba(29, 27, 23, 0.28);
		padding: 0.25rem 0.45rem;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--ultramarine);
		outline-offset: 1px;
	}
	.slider {
		width: 76px;
		padding: 0;
		box-shadow: none;
		accent-color: var(--vermilion);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.6rem 0.9rem;
		background: var(--paper-2);
	}
	.mark {
		font-size: 0.9375rem;
		font-weight: 500;
	}
	.views,
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
		font-size: 0.8125rem;
		color: var(--sub);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.1rem;
		padding: 0.55rem 0.9rem;
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
		font-size: 0.625rem;
		margin-left: 0.45em;
		color: var(--sub);
	}
	.grp button.on i {
		color: rgba(232, 226, 212, 0.7);
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
		gap: 1.2rem;
		padding: clamp(1rem, 3vw, 2.5rem);
		background: var(--ultramarine);
	}
	.board {
		padding: 14px;
		background: var(--paper);
	}
	.board :global(canvas) {
		background: repeating-conic-gradient(#ddd6c6 0% 25%, #e8e2d4 0% 50%) 0 0 / 16px 16px;
	}
	.cap {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.85);
	}

	.rail {
		width: 234px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		background: var(--paper-2);
		overflow-y: auto;
	}
	h2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.4rem;
		margin-bottom: 0.8rem;
		font-size: 0.9375rem;
		font-weight: 500;
		border-bottom: 1.5px solid var(--ink);
	}
	.chip {
		padding: 0.1rem 0.4rem;
		font-size: 0.6875rem;
	}
	.monitor {
		display: flex;
		justify-content: center;
		padding: 0.85rem;
		background: var(--ochre);
	}
	.monitor :global(canvas) {
		background: transparent;
	}
	.kv {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.2rem;
		margin-top: 0.7rem;
	}
	.kv dt {
		font-size: 0.6875rem;
		color: var(--sub);
	}
	.kv dd {
		margin: 0;
		font-size: 0.8125rem;
	}
	.layers li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		font-size: 0.875rem;
	}
	.layers li.active {
		color: var(--paper);
		background: var(--ink);
	}
	.dot {
		width: 10px;
		height: 10px;
		flex: none;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1.5px currentColor;
	}
	.dot.on {
		background: currentColor;
	}
	.wide {
		width: 100%;
		margin-top: 0.6rem;
	}
	.chips {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0;
	}
	.sw {
		aspect-ratio: 1;
		padding: 0;
		box-shadow: none;
	}
	.sw.alpha {
		background: repeating-conic-gradient(#ccc4b1 0% 25%, #e8e2d4 0% 50%) 0 0 / 8px 8px;
	}
	.sw.sel {
		outline: 3px solid var(--ink);
		outline-offset: -3px;
	}

	.strip {
		padding: 0.7rem 0.9rem 0.9rem;
		background: var(--paper-2);
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
		color: var(--vermilion);
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
		gap: 5px;
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
		box-shadow: none;
	}
	.frame :global(canvas) {
		background: transparent;
	}
	.frame.sel {
		outline: 3px solid var(--vermilion);
		outline-offset: -3px;
	}
	.frame.empty {
		background: repeating-conic-gradient(#d2cab8 0% 25%, #ddd6c6 0% 50%) 0 0 / 9px 9px;
	}
	.no {
		font-size: 0.6875rem;
		color: var(--sub);
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
		padding: 0.9rem 2.4rem 0.9rem 1rem;
		background: var(--paper);
	}
	.nid {
		font-size: 0.75rem;
		color: var(--vermilion);
	}
	.note p {
		font-size: 0.9375rem;
	}
	.x {
		position: absolute;
		right: 6px;
		top: 6px;
		padding: 0 0.35rem;
		box-shadow: none;
		font-size: 0.875rem;
	}

	@media (max-width: 880px) {
		.middle {
			flex-direction: column;
		}
		.rail {
			width: auto;
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
