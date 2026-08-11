<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const MODES = [
		['1', 'Focus', 'Draw one frame with onion context.', 'Comparing the whole loop.'],
		['2', 'Grid', 'Edit every frame side by side.', 'Fine work on one pose.'],
		['3', 'Loop', 'Judge timing at full speed.', 'Drawing new pixels.']
	];
	const OUTPUTS = [['PNG', 'sprite sheet'], ['JSON', 'engine atlas'], ['GIF', 'moving preview'], ['ZIP', 'frame files']];
</script>

<div class="mock carton-page">
	<header>
		<a class="brand" href="#top"><span class="stamp">DD</span>Doodle-Do</a>
		<nav><a href="#frames">Frames</a><a href="#views">Views</a><a href="#pack">Export</a></nav>
		<a class="key" href="#top">Open the carton</a>
	</header>

	<main id="top">
		<section class="hero">
			<div class="pitch">
				<p class="batch">Batch 04 · browser animation tool</p>
				<h1>Pack a lively loop into four small frames.</h1>
				<p>Draw pixel animation while it plays. Learn timing from the changes you just made, then carry a clean sprite sheet into Phaser or Godot.</p>
				<div class="actions"><a class="key big" href="#frames">Start drawing</a><a href="#pack">Inspect the output →</a></div>
				<ul><li>No account</li><li>No upload</li><li>Works offline</li></ul>
			</div>

			<div class="tray" aria-label="Four animation frames in a twelve-cell carton">
				<div class="tray-label"><b>DOODLE-DO</b><span>FRAME-FRESH PIXEL LOOPS</span><i>4 / 12</i></div>
				<div class="cells">
					{#each { length: 12 } as _, i}<div class="cell" class:filled={i < 4} class:current={i === 1}>{#if i < 4}<Sprite frame={i} scale={5} />{:else}<span>{String(i + 1).padStart(2, '0')}</span>{/if}</div>{/each}
				</div>
				<div class="tray-foot"><span>8 FPS</span><span>1-BIT ALPHA</span><span>LOCAL FIRST</span></div>
			</div>
		</section>

		<section class="sequence" id="frames">
			<div class="section-copy"><p>Four cells, one motion</p><h2>The loop shows the weak pose before export does.</h2><span>Playback never stops while you edit, so a timing mistake cannot hide in a still thumbnail.</span></div>
			<div class="run">
				{#each { length: 4 } as _, i}<figure><div><Sprite frame={i} scale={8} /></div><figcaption><b>0{i + 1}</b><span>{i === 1 ? '160' : '113'} ms</span></figcaption></figure>{/each}
				<div class="rate"><b>8</b><span>FPS</span><small>500 ms loop</small></div>
			</div>
		</section>

		<section class="views" id="views">
			<div class="section-copy"><p>One batch, three views</p><h2>Choose the cell arrangement that fits the job.</h2><span>Your frame, palette, zoom, and history stay put. Each view admits where it strains.</span></div>
			<div class="mode-list">
				<div class="mode-head"><span>Key</span><span>View</span><span>Great at</span><span>Strains when</span></div>
				{#each MODES as [key, name, great, strain]}<div><kbd>{key}</kbd><strong>{name}</strong><span>{great}</span><em>{strain}</em></div>{/each}
			</div>
		</section>

		<section class="tip">
			<div class="seal">T10</div><blockquote>Longer isn’t always better. A tight four-frame loop often reads better than a loose eight.</blockquote><p>Tips arrive after relevant actions, one at a time, and each can be dismissed forever.</p>
		</section>

		<section class="pack" id="pack">
			<div class="section-copy"><p>Pack for the engine</p><h2>Your work leaves in ordinary files.</h2><span>Sprite-sheet output is tested in stock Phaser and Godot. A project file on disk remains the copy you own.</span></div>
			<div class="outputs">{#each OUTPUTS as [ext, name]}<div><b>{ext}</b><span>{name}</span><i>↓</i></div>{/each}</div>
		</section>
	</main>

	<footer><span class="stamp">DD</span><strong>Doodle-Do</strong><p>16 colours to start · 64 maximum · Canvas 2D</p><a class="key" href="#top">Start drawing</a></footer>
</div>

<style>
	.carton-page{--pulp:#c8c4b7;--pulp-dark:#aaa697;--shell:#f4f1e8;--ink:#292923;--muted:#66665d;--red:#a93229;--yellow:#e2b43b;min-height:100%;background:var(--pulp);color:var(--ink);font:16px/1.55 Barlow,Archivo,system-ui,sans-serif}
	a{color:inherit}header{display:flex;align-items:center;gap:2rem;padding:1rem clamp(1rem,5vw,5rem);background:var(--shell);border-bottom:2px solid var(--ink)}.brand{display:flex;align-items:center;gap:.65rem;margin-right:auto;font-weight:700;text-decoration:none}.stamp{display:grid;place-items:center;width:34px;height:34px;color:var(--shell);background:var(--red);border-radius:50%;font-size:.7rem;font-weight:800;letter-spacing:.06em}header nav{display:flex;gap:1.5rem}header nav a{color:var(--muted);font-size:.82rem;font-weight:600;text-decoration:none}.key{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:.45rem 1rem;color:var(--shell);background:var(--red);border-radius:5px;font-weight:700;text-decoration:none}.key:hover{background:#86251f}.key:focus-visible,a:focus-visible{outline:3px solid var(--yellow);outline-offset:2px}
	main,footer{width:min(1160px,calc(100% - 2rem));margin:auto}.hero{display:grid;grid-template-columns:minmax(280px,.75fr) minmax(520px,1.25fr);align-items:center;gap:clamp(3rem,7vw,7rem);min-height:720px;padding:4rem 0}.batch,.section-copy>p{text-transform:uppercase;letter-spacing:.12em;font-size:.7rem;font-weight:700;color:var(--red)}h1{max-width:11ch;margin-top:1rem!important;font-size:clamp(3rem,5.3vw,5.2rem);line-height:.96;letter-spacing:-.04em;text-wrap:balance}.pitch>p:not(.batch){max-width:42ch;margin-top:1.5rem;color:#505048;font-size:1.08rem}.actions{display:flex;align-items:center;gap:1.3rem;margin-top:1.8rem}.actions>a:last-child{color:var(--red);font-size:.88rem;font-weight:700;text-decoration:none}.big{min-height:48px;padding:.65rem 1.2rem}.pitch ul{display:flex;gap:1.2rem;margin-top:1.4rem!important;color:#56564f;font-size:.75rem}.pitch li::before{content:'•';margin-right:.35rem;color:var(--red)}
	.tray{padding:1.1rem;background:#b4b0a3;border:2px solid #999587;border-radius:14px;box-shadow:inset 0 2px 0 rgba(255,255,255,.24),0 7px 12px rgba(67,64,54,.22)}.tray-label{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:1rem;margin:.2rem .35rem 1rem;padding:.7rem .9rem;background:var(--shell);border:2px solid var(--ink);transform:rotate(-1deg)}.tray-label b{font-size:1rem}.tray-label span,.tray-label i{font-size:.62rem;font-weight:700;letter-spacing:.1em}.tray-label i{color:var(--red);font-style:normal}.cells{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.cell{display:grid;place-items:center;aspect-ratio:.86;color:#777469;background:#9f9b8f;border-radius:50%;box-shadow:inset 0 5px 8px rgba(71,68,59,.26),0 1px 0 rgba(255,255,255,.35);font-size:.6rem}.cell.filled{background:var(--shell)}.cell.current{outline:4px solid var(--red);outline-offset:2px}.tray-foot{display:flex;justify-content:space-between;margin-top:1rem;padding:.5rem .7rem 0;border-top:1px solid rgba(41,41,35,.35);font-size:.6rem;font-weight:700;letter-spacing:.1em}
	section:not(.hero){display:grid;grid-template-columns:minmax(230px,.55fr) minmax(470px,1fr);gap:clamp(2rem,8vw,7rem);padding:clamp(4rem,9vw,8rem) 0;border-top:2px solid rgba(41,41,35,.42)}.section-copy h2{max-width:14ch;margin-top:.8rem!important;font-size:clamp(2rem,3.5vw,3rem);line-height:1.05;letter-spacing:-.035em;text-wrap:balance}.section-copy>span{display:block;max-width:40ch;margin-top:1rem;color:#55554e}
	.run{display:grid;grid-template-columns:repeat(4,1fr) 95px;gap:9px;align-items:end}.run figure>div{display:grid;place-items:center;aspect-ratio:1;background:var(--shell);border-radius:50%;box-shadow:inset 0 3px 6px rgba(80,77,67,.18)}.run figcaption{display:flex;justify-content:space-between;padding:.45rem .35rem;font-size:.68rem}.run figcaption b{color:var(--red)}.rate{display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:.75;color:var(--shell);background:var(--red);border-radius:48% 48% 44% 44%}.rate b{font-size:2.1rem;line-height:1}.rate span{font-size:.7rem;font-weight:800}.rate small{margin-top:.5rem;font-size:.56rem}
	.mode-list{border-top:2px solid var(--ink)}.mode-head,.mode-list>div{display:grid;grid-template-columns:45px 90px 1fr 1fr;gap:1rem;align-items:center;padding:.85rem .4rem;border-bottom:1px solid rgba(41,41,35,.35)}.mode-head{color:var(--muted);font-size:.65rem;font-weight:700}.mode-list kbd{display:grid;place-items:center;width:28px;height:28px;color:var(--shell);background:var(--red);border-radius:50%;font:700 .7rem/1 Barlow,sans-serif}.mode-list span,.mode-list em{font-size:.84rem}.mode-list em{color:#7c3d36;font-style:normal}
	.tip{grid-template-columns:70px minmax(300px,1fr) minmax(180px,.45fr)!important;align-items:center;padding:3rem!important;background:var(--shell);border:2px solid var(--ink)!important;transform:rotate(-.5deg)}.seal{display:grid;place-items:center;width:54px;height:54px;color:var(--shell);background:var(--red);border-radius:50%;font-weight:800}.tip blockquote{margin:0;max-width:34ch;font-size:1.4rem;line-height:1.35;font-weight:600}.tip p{color:var(--muted);font-size:.82rem}
	.outputs{display:grid;grid-template-columns:repeat(2,1fr);border-top:2px solid var(--ink);border-left:2px solid var(--ink)}.outputs div{display:grid;grid-template-columns:70px 1fr auto;align-items:center;gap:1rem;min-height:96px;padding:1rem;border-right:2px solid var(--ink);border-bottom:2px solid var(--ink);background:var(--shell)}.outputs b{color:var(--red);font-size:1.2rem}.outputs span{font-size:.88rem}.outputs i{font-style:normal}
	footer{display:flex;align-items:center;gap:1rem;padding:3rem 0 9rem;border-top:2px solid rgba(41,41,35,.42)}footer p{margin-right:auto!important;color:#5b5b52;font-size:.72rem}
	@media(max-width:850px){.hero,section:not(.hero){grid-template-columns:1fr}.hero{min-height:0}.tray{margin-top:1rem}.tip{grid-template-columns:60px 1fr!important}.tip p{grid-column:2}.run{grid-template-columns:repeat(4,1fr)}.rate{grid-column:1/-1;aspect-ratio:auto;min-height:80px}}
	@media(max-width:620px){header nav{display:none}.hero>*{min-width:0}.tray{width:100%}.cells{grid-template-columns:repeat(4,minmax(0,1fr))}.tray-label{grid-template-columns:1fr auto;max-width:100%}.tray-label span{display:none}.pitch ul{flex-wrap:wrap}.mode-head{display:none}.mode-list>div{grid-template-columns:38px 1fr}.mode-list span,.mode-list em{grid-column:2}.outputs{grid-template-columns:1fr}.tip{padding:1.5rem!important}footer{flex-wrap:wrap}footer p{width:100%}}
</style>
