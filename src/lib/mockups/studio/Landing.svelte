<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const MODES = [
		['Focus', 'Draw one frame with onion context.', 'Comparing many frames.'],
		['Grid', 'Compare and edit every frame.', 'Fine work on one pose.'],
		['Loop', 'Judge timing at full speed.', 'Drawing. Switch back to edit.']
	];

	const OUTPUTS = [
		['Sprite sheet', 'PNG + TexturePacker JSON'],
		['Project', '.doodledo.json'],
		['Share', 'GIF or zipped frame PNGs']
	];
</script>

<div class="mock utility">
	<header class="nav">
		<a class="brand" href="#top">Doodle-Do</a>
		<nav aria-label="Primary"><a href="#workflow">Workflow</a><a href="#modes">Views</a><a href="#export">Export</a></nav>
		<a class="button primary" href="#top">Open editor</a>
	</header>

	<main id="top">
		<section class="hero">
			<div class="pitch">
				<h1>Pixel animation, already moving.</h1>
				<p>Draw frame by frame while the loop keeps playing. Doodle-Do teaches timing in context, then exports straight to your game engine.</p>
				<div class="actions"><a class="button primary large" href="#workflow">Start drawing</a><a class="text-link" href="#export">See export formats <span>→</span></a></div>
				<ul class="trust"><li>No account</li><li>Works offline</li><li>Nothing uploaded</li></ul>
			</div>

			<div class="product-shot" aria-label="Editor preview">
				<div class="shot-bar"><span>hero-walk</span><span>Autosaved locally</span></div>
				<div class="shot-body">
					<div class="tools" aria-hidden="true"><b></b><i></i><i></i><i></i><i></i><i></i></div>
					<div class="canvas"><Sprite playing scale={15} /></div>
					<aside><span>Loop preview</span><div class="preview"><Sprite playing scale={5} /></div><dl><div><dt>Frames</dt><dd>4</dd></div><div><dt>Rate</dt><dd>8 fps</dd></div></dl></aside>
				</div>
				<ol class="frames">{#each { length: 8 } as _, i}<li class:used={i < 4} class:current={i === 1}>{#if i < 4}<Sprite frame={i} scale={3} />{:else}<span>+</span>{/if}</li>{/each}</ol>
			</div>
		</section>

		<section class="workflow" id="workflow">
			<div class="section-copy"><h2>One sitting from blank canvas to engine.</h2><p>The editor stays out of your way, but the loop and teaching layer stay in view.</p></div>
			<ol class="steps">
				<li><b>1</b><div><h3>Draw the key poses</h3><p>Onion skin shows where the last frame was and where the next one goes.</p></div></li>
				<li><b>2</b><div><h3>Watch the loop</h3><p>Playback never stops, so timing problems appear while they are still cheap to fix.</p></div></li>
				<li><b>3</b><div><h3>Export for the engine</h3><p>Sprite sheets and atlas data are verified against stock Phaser and Godot.</p></div></li>
			</ol>
		</section>

		<section class="modes" id="modes">
			<div class="section-copy"><h2>Three views, honest tradeoffs.</h2><p>Your document, frame, zoom, palette, and history follow you between them.</p></div>
			<div class="mode-table">
				<div class="mode-head"><span>View</span><span>Great at</span><span>Strains when</span></div>
				{#each MODES as [name, great, strain], i}
					<div class="mode-row"><strong><kbd>{i + 1}</kbd>{name}</strong><span>{great}</span><span>{strain}</span></div>
				{/each}
			</div>
		</section>

		<section class="lesson">
			<div class="tip-id">Tip 09</div>
			<blockquote>Classic pixel animation often runs at 6–10 FPS. Smoothness comes from good in-betweens, not speed.</blockquote>
			<p>Tips appear after relevant actions, one at a time. Dismiss any tip forever.</p>
		</section>

		<section class="export" id="export">
			<div class="section-copy"><h2>Your files leave cleanly.</h2><p>Local autosave is convenient. A project file on disk is the copy you own.</p></div>
			<div class="output-list">{#each OUTPUTS as [name, format]}<div><strong>{name}</strong><span>{format}</span><span aria-hidden="true">↓</span></div>{/each}</div>
		</section>
	</main>

	<footer><span>Doodle-Do</span><p>16 colours to start · 64 max · 1-bit alpha · Canvas 2D</p><a class="button primary" href="#top">Open editor</a></footer>
</div>

<style>
	.utility { --bg:#f5f6f8; --surface:#fff; --ink:#20242a; --muted:#626974; --line:#d9dde4; --soft:#edf0f4; --blue:#3659d9; --blue-dark:#2946b4; min-height:100%; background:var(--bg); color:var(--ink); font:16px/1.55 Archivo,system-ui,sans-serif; }
	a { color:inherit; }
	.nav { position:sticky; top:0; z-index:2; display:flex; align-items:center; gap:2rem; min-height:64px; padding:0 clamp(1rem,5vw,5rem); background:rgba(255,255,255,.96); border-bottom:1px solid var(--line); }
	.brand { margin-right:auto; font-size:1.05rem; font-weight:800; text-decoration:none; letter-spacing:-.02em; }
	.nav nav { display:flex; gap:1.5rem; }
	.nav nav a,.text-link { color:var(--muted); font-size:.875rem; font-weight:600; text-decoration:none; }
	.nav nav a:hover,.text-link:hover { color:var(--ink); }
	.button { display:inline-flex; justify-content:center; align-items:center; min-height:38px; padding:.45rem .9rem; border-radius:7px; font-size:.875rem; font-weight:700; text-decoration:none; }
	.button.primary { color:#fff; background:var(--blue); }
	.button.primary:hover { background:var(--blue-dark); }
	.button:focus-visible,.text-link:focus-visible,.nav a:focus-visible { outline:3px solid #90a4ff; outline-offset:2px; }
	.button.large { min-height:46px; padding:.65rem 1.15rem; }
	main,footer { width:min(1180px,calc(100% - 2rem)); margin:auto; }
	.hero { display:grid; grid-template-columns:minmax(260px,.8fr) minmax(520px,1.3fr); align-items:center; gap:clamp(2rem,6vw,6rem); padding:clamp(4rem,9vw,8rem) 0; }
	h1 { max-width:12ch; font-size:clamp(2.8rem,5.8vw,5.5rem); line-height:.98; letter-spacing:-.04em; text-wrap:balance; }
	.pitch>p { max-width:41ch; margin-top:1.5rem; color:var(--muted); font-size:1.1rem; }
	.actions { display:flex; align-items:center; gap:1.2rem; margin-top:1.8rem; }
	.text-link span { margin-left:.35rem; }
	.trust { display:flex; flex-wrap:wrap; gap:.45rem 1.2rem; margin-top:1.5rem !important; color:var(--muted); font-size:.78rem; }
	.trust li::before { content:'✓'; margin-right:.35rem; color:var(--blue); font-weight:800; }
	.product-shot { overflow:hidden; background:var(--surface); border-radius:12px; box-shadow:0 8px 24px rgba(38,47,62,.14); }
	.shot-bar { display:flex; justify-content:space-between; padding:.65rem .85rem; background:var(--soft); border-bottom:1px solid var(--line); font-size:.68rem; font-weight:700; color:var(--muted); }
	.shot-body { display:grid; grid-template-columns:34px minmax(240px,1fr) 116px; min-height:330px; }
	.tools { display:flex; flex-direction:column; align-items:center; gap:9px; padding:12px 7px; border-right:1px solid var(--line); }
	.tools i,.tools b { width:18px; height:18px; border-radius:4px; background:#dfe3e9; }
	.tools b { background:var(--blue); }
	.canvas { display:grid; place-items:center; background:repeating-conic-gradient(#f0f1f3 0 25%,#fff 0 50%) 0 0/18px 18px; }
	.shot-body aside { padding:12px; border-left:1px solid var(--line); font-size:.65rem; color:var(--muted); }
	.preview { display:grid; place-items:center; aspect-ratio:1; margin:.5rem 0; background:var(--soft); }
	dl div { display:flex; justify-content:space-between; padding:.28rem 0; border-bottom:1px solid var(--line); }
	dl dt,dl dd { margin:0; }
	dl dd { color:var(--ink); font-weight:700; }
	.frames { display:grid; grid-template-columns:repeat(8,1fr); gap:7px; padding:10px; border-top:1px solid var(--line); }
	.frames li { display:grid; place-items:center; aspect-ratio:1; overflow:hidden; color:#9ba2ad; background:var(--soft); border-radius:4px; }
	.frames li.used { background:repeating-conic-gradient(#e4e6e9 0 25%,#fff 0 50%) 0 0/8px 8px; }
	.frames li.current { outline:2px solid var(--blue); outline-offset:1px; }
	section:not(.hero) { padding:clamp(3.5rem,8vw,7rem) 0; border-top:1px solid var(--line); }
	.workflow,.modes,.export { display:grid; grid-template-columns:minmax(220px,.55fr) minmax(420px,1fr); gap:clamp(2rem,8vw,7rem); }
	.section-copy h2 { max-width:14ch; font-size:clamp(2rem,3.3vw,3rem); line-height:1.05; letter-spacing:-.035em; text-wrap:balance; }
	.section-copy p { max-width:38ch; margin-top:1rem; color:var(--muted); }
	.steps { display:flex; flex-direction:column; }
	.steps li { display:grid; grid-template-columns:42px 1fr; gap:1rem; padding:1.2rem 0; border-bottom:1px solid var(--line); }
	.steps li:first-child { border-top:1px solid var(--line); }
	.steps b { display:grid; place-items:center; width:30px; height:30px; color:var(--blue); background:#e8ecff; border-radius:7px; }
	.steps h3 { font-size:1rem; }
	.steps p { max-width:54ch; margin-top:.25rem; color:var(--muted); font-size:.9rem; }
	.mode-table { border-top:1px solid var(--ink); }
	.mode-head,.mode-row { display:grid; grid-template-columns:140px 1fr 1fr; gap:1rem; padding:.9rem .5rem; border-bottom:1px solid var(--line); }
	.mode-head { color:var(--muted); font-size:.72rem; font-weight:700; }
	.mode-row { font-size:.86rem; }
	.mode-row strong { display:flex; align-items:center; gap:.65rem; }
	kbd { display:grid; place-items:center; width:24px; height:24px; border:1px solid var(--line); border-radius:5px; background:var(--surface); font:700 .7rem/1 Archivo,sans-serif; }
	.mode-row span:last-child { color:#8b5c45; }
	.lesson { display:grid; grid-template-columns:90px minmax(260px,1fr) minmax(180px,.45fr); align-items:start; gap:2rem; padding:clamp(2rem,5vw,4rem) !important; background:#20242a; border:0 !important; border-radius:12px; color:#fff; }
	.tip-id { color:#9eb0ff; font-size:.75rem; font-weight:700; }
	blockquote { margin:0; max-width:36ch; font-size:1.35rem; line-height:1.35; letter-spacing:-.02em; }
	.lesson p { color:#b9bec6; font-size:.86rem; }
	.output-list { border-top:1px solid var(--ink); }
	.output-list div { display:grid; grid-template-columns:1fr 1.2fr auto; gap:1rem; padding:1rem .5rem; border-bottom:1px solid var(--line); }
	.output-list span { color:var(--muted); font-size:.86rem; }
	footer { display:flex; align-items:center; gap:2rem; padding:2rem 0 8rem; border-top:1px solid var(--line); }
	footer>span { font-weight:800; }
	footer p { margin-right:auto !important; color:var(--muted); font-size:.75rem; }
	@media(max-width:850px){ .hero,.workflow,.modes,.export { grid-template-columns:1fr; } .hero { padding-top:3rem; } .product-shot { order:2; } .lesson { grid-template-columns:1fr; } }
	@media(max-width:620px){ .nav nav { display:none; } .shot-body { grid-template-columns:30px 1fr; } .shot-body aside { display:none; } .product-shot { margin-inline:-.5rem; } .mode-head { display:none; } .mode-row { grid-template-columns:1fr; gap:.45rem; } footer { align-items:flex-start; flex-wrap:wrap; } footer p { width:100%; } }
</style>
