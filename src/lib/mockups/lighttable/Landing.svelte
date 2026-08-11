<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const FRAMES = [0, 1, 2, 3];
	const LESSONS = [
		['T02', 'Draw where things moved to, not where they were.'],
		['T09', 'Smoothness comes from good in-betweens, not speed.'],
		['T10', 'A tight four-frame loop often reads better than a loose eight.']
	];
</script>

<div class="mock table">
	<header>
		<a class="mark" href="#top"><span class="peg-mini" aria-hidden="true"><i></i><i></i><i></i></span>Doodle-Do</a>
		<nav><a href="#loop">The loop</a><a href="#views">Views</a><a href="#out">Export</a></nav>
		<a class="start" href="#top">Start drawing</a>
	</header>

	<main id="top">
		<section class="hero">
			<div class="copy">
				<h1>Draw the next pose.<br /><em>See the motion now.</em></h1>
				<p>Frame-by-frame pixel animation on a light table that never stops playing. Onion skin keeps the arc visible; practical tips arrive while you work.</p>
				<div class="actions"><a class="start big" href="#loop">Start drawing</a><a href="#out">See what comes out →</a></div>
				<p class="fine">Local-first · no account · no upload · works offline</p>
			</div>

			<div class="cel-stack" aria-label="Four-frame animation on a light table">
				<div class="cel back b3"></div><div class="cel back b2"></div><div class="cel back b1"></div>
				<div class="cel active">
					<div class="pegbar"><span></span><span></span><span></span></div>
					<div class="field"><Sprite frame={1} scale={20} onion={0.42} grid /></div>
					<div class="cel-note"><span>SCENE 01</span><span>FRAME 02 / 04</span><span>8 FPS</span></div>
				</div>
				<p class="margin-note">previous in cleanup red<br />next in non-photo blue</p>
			</div>
		</section>

		<section class="loop" id="loop">
			<div class="section-title"><span class="blue-rule"></span><h2>The loop is the teacher.</h2><p>The same four drawings stay visible while timing changes underneath them.</p></div>
			<div class="exposure">
				{#each FRAMES as frame,i}<figure><div class="frame"><Sprite {frame} scale={9} /></div><figcaption><b>{String(i+1).padStart(2,'0')}</b><span>{i===1?'160':'113'} ms</span></figcaption></figure>{/each}
				<div class="play"><span>▶</span><strong>8 FPS</strong><small>500 ms loop</small></div>
			</div>
			<p class="caption">Hold the contact pose a little longer. The change is visible in the rhythm before it becomes a rule you have to remember.</p>
		</section>

		<section class="teaching">
			<div class="section-title"><span class="red-rule"></span><h2>Notes in the margin, never over the drawing.</h2><p>Twenty-six tips respond to real editing events. One at a time, individually dismissible forever.</p></div>
			<ol>{#each LESSONS as [id,copy]}<li><span>{id}</span><p>{copy}</p><button aria-label="Dismiss {id}">×</button></li>{/each}</ol>
		</section>

		<section class="views" id="views">
			<div class="section-title"><span class="blue-rule"></span><h2>Move the table, not the drawing.</h2><p>Focus, Grid, and Loop are views over the same session. Each says what it is bad at.</p></div>
			<div class="view-list">
				<article><kbd>1</kbd><h3>Focus</h3><p>Great for drawing one frame with onion context.</p><small>Strains when comparing many frames.</small></article>
				<article><kbd>2</kbd><h3>Grid</h3><p>Great for editing every frame side by side.</p><small>Strains during detail work.</small></article>
				<article><kbd>3</kbd><h3>Loop</h3><p>Great for judging motion at full speed.</p><small>Strains when you need to draw.</small></article>
			</div>
		</section>

		<section class="out" id="out">
			<div class="section-title"><span class="red-rule"></span><h2>Pin the finished work to your engine.</h2><p>Exports are verified against stock Phaser and Godot, not described as compatible and left at that.</p></div>
			<div class="sheets"><div><b>PNG</b><span>Sprite sheet</span></div><div><b>JSON</b><span>TexturePacker atlas</span></div><div><b>GIF</b><span>Animation preview</span></div><div><b>ZIP</b><span>Individual frames</span></div></div>
		</section>
	</main>

	<footer><div class="pegbar"><span></span><span></span><span></span></div><strong>Doodle-Do</strong><p>16 colours to start · 64 max · 1-bit alpha</p><a class="start" href="#top">Start drawing</a></footer>
</div>

<style>
	.table { --paper:#fbfcff; --ink:#18212b; --pencil:#2f6fb0; --pencil-soft:#dbeaf7; --cleanup:#dc4f4f; --cleanup-ink:#a93636; --line:#cfd8e2; --desk:#b8d4e8; min-height:100%; overflow:hidden; background:var(--paper); color:var(--ink); font:16px/1.55 Archivo,system-ui,sans-serif; }
	a { color:inherit; }
	header { display:flex; align-items:center; gap:2.2rem; padding:1rem clamp(1rem,5vw,5rem); border-bottom:1px solid var(--line); }
	.mark { display:flex; align-items:center; gap:.7rem; margin-right:auto; color:var(--ink); font-weight:800; text-decoration:none; }
	.peg-mini { display:flex; gap:3px; padding:4px 6px; border-radius:2px; background:var(--pencil); }.peg-mini i { width:6px;height:6px;border-radius:50%;background:#fff; }
	header nav { display:flex; gap:1.5rem; }header nav a { color:#536271; font-size:.86rem; font-weight:600; text-decoration:none; }
	.start { display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:.45rem 1rem; color:#fff; background:var(--pencil); border-radius:4px; font-weight:700; text-decoration:none; }
	.start:hover { background:#245b91; }.start:focus-visible,a:focus-visible,button:focus-visible { outline:3px solid #ef8a8a; outline-offset:2px; }
	main,footer { width:min(1160px,calc(100% - 2rem)); margin:auto; }
	.hero { display:grid; grid-template-columns:minmax(280px,.8fr) minmax(480px,1.2fr); align-items:center; gap:clamp(3rem,8vw,8rem); min-height:720px; padding:5rem 0; }
	h1 { max-width:12ch; font-size:clamp(2.7rem,5vw,4.9rem); line-height:1.02; letter-spacing:-.04em; text-wrap:balance; }h1 em { color:var(--pencil); font-style:normal; }
	.copy>p { max-width:42ch; margin-top:1.4rem; color:#536271; font-size:1.08rem; }.actions { display:flex; align-items:center; gap:1.3rem; margin-top:1.8rem; }.actions a:last-child { color:var(--pencil); font-size:.9rem; font-weight:700; text-decoration:none; }.big { min-height:48px; padding:.65rem 1.2rem; }.copy .fine { font-size:.76rem; }
	.cel-stack { position:relative; height:520px; }.cel { position:absolute; width:min(100%,520px); aspect-ratio:1; background:rgba(255,255,255,.94); border:1px solid #b9c8d5; box-shadow:0 6px 12px rgba(46,83,111,.12); }.back { left:50%; top:50%; }.b3 { transform:translate(-47%,-44%) rotate(5deg); }.b2 { transform:translate(-53%,-48%) rotate(-3deg); }.b1 { transform:translate(-49%,-51%) rotate(1deg); }.active { left:50%; top:50%; transform:translate(-50%,-50%); }
	.pegbar { display:flex; justify-content:center; gap:22px; height:38px; padding-top:10px; background:#e9f2f9; border-bottom:1px solid #c3d2df; }.pegbar span { width:22px;height:10px;border-radius:8px;background:var(--desk);box-shadow:inset 0 1px 2px rgba(38,76,105,.28); }.field { display:grid;place-items:center;height:calc(100% - 76px);background:repeating-conic-gradient(#edf4f9 0 25%,#fff 0 50%) 0 0/20px 20px; }.cel-note { display:flex;justify-content:space-between;padding:10px 14px;color:var(--pencil);border-top:1px solid var(--pencil-soft);font:700 .65rem/1 'Courier Prime',monospace;letter-spacing:.08em; }.margin-note { position:absolute; right:0; bottom:-1.2rem; color:var(--cleanup-ink); font:700 1rem/1.3 Caveat,cursive; transform:rotate(-4deg); }
	section:not(.hero) { display:grid;grid-template-columns:minmax(230px,.58fr) minmax(450px,1fr);gap:clamp(2rem,8vw,7rem);padding:clamp(4rem,9vw,8rem) 0;border-top:1px solid var(--line); }.section-title span { display:block;width:58px;height:4px;margin-bottom:1.2rem; }.blue-rule { background:var(--pencil); }.red-rule { background:var(--cleanup); }.section-title h2 { max-width:14ch;font-size:clamp(2rem,3.5vw,3.1rem);line-height:1.05;letter-spacing:-.035em;text-wrap:balance; }.section-title p { max-width:40ch;margin-top:1rem;color:#596a7a; }
	.exposure { display:grid;grid-template-columns:repeat(4,1fr) 90px;gap:8px;align-items:end; }.frame { display:grid;place-items:center;aspect-ratio:1;background:repeating-conic-gradient(#e9f1f7 0 25%,#fff 0 50%) 0 0/12px 12px;border:1px solid #b9c8d5; }.exposure figcaption { display:flex;justify-content:space-between;padding:.5rem;color:#5b6b79;font:.68rem/1 'Courier Prime',monospace;border:1px solid #b9c8d5;border-top:0; }.exposure figcaption b { color:var(--pencil); }.play { display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:.72;color:#fff;background:var(--pencil); }.play span { font-size:1.4rem; }.play strong { margin-top:.5rem;font-size:.9rem; }.play small { font-size:.6rem; }.caption { grid-column:2;margin-top:-3rem !important;color:#5b6b79;font-size:.82rem; }
	.teaching ol { border-top:1px solid var(--line); }.teaching li { display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:1rem;padding:1rem .5rem;border-bottom:1px solid var(--line); }.teaching li span { color:var(--cleanup-ink);font:700 .72rem/1 'Courier Prime',monospace; }.teaching li p { font-size:.9rem; }.teaching li button { border:0;background:transparent;color:#8b98a5;font-size:1.1rem; }
	.view-list article { display:grid;grid-template-columns:42px 105px 1fr 1fr;align-items:center;gap:1rem;padding:1rem .5rem;border-bottom:1px solid var(--line); }.view-list article:first-child { border-top:1px solid var(--line); }.view-list kbd { display:grid;place-items:center;width:30px;height:30px;color:#fff;background:var(--pencil);border-radius:3px;font:700 .75rem/1 Archivo,sans-serif; }.view-list h3 { font-size:1rem; }.view-list p,.view-list small { font-size:.82rem; }.view-list small { color:#9d5555; }
	.sheets { display:flex;flex-wrap:wrap;border-top:1px solid var(--line); }.sheets div { display:flex;flex-direction:column;justify-content:space-between;width:50%;min-height:150px;padding:1rem;border-right:1px solid var(--line);border-bottom:1px solid var(--line); }.sheets b { color:var(--pencil);font:700 1.2rem/1 'Courier Prime',monospace; }.sheets span { color:#596a7a;font-size:.86rem; }
	footer { display:flex;align-items:center;gap:1.5rem;padding:3rem 0 9rem;border-top:1px solid var(--line); }.table footer .pegbar { width:108px;height:28px;gap:10px;padding-top:8px;border:0; }.table footer .pegbar span { width:16px;height:8px; }.table footer p { margin-right:auto!important;color:#647484;font-size:.75rem; }
	@media(max-width:850px){ .hero,section:not(.hero){grid-template-columns:1fr}.hero{min-height:0}.cel-stack{margin-top:1rem}.caption{grid-column:1;margin-top:1rem!important} }
	@media(max-width:620px){ header nav{display:none}.hero{padding-top:3rem}.cel-stack{height:390px}.margin-note{right:0}.exposure{grid-template-columns:repeat(4,1fr)}.play{grid-column:1/-1;aspect-ratio:auto;min-height:74px}.view-list article{grid-template-columns:38px 1fr}.view-list p,.view-list small{grid-column:2}footer{align-items:flex-start;flex-wrap:wrap}.table footer p{width:100%} }
</style>
