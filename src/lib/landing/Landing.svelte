<script lang="ts">
	import { onMount } from 'svelte';
	import { PRODUCT_CONTENT as copy } from '$lib/content/product';
	import Sprite from '$lib/mockups/Sprite.svelte';

	let {
		ready,
		resume,
		onStart
	}: { ready: boolean; resume: boolean; onStart: () => void } = $props();

	let motionPlaying = $state(true);

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const pauseForPreference = () => media.matches && (motionPlaying = false);
		pauseForPreference();
		media.addEventListener('change', pauseForPreference);
		return () => media.removeEventListener('change', pauseForPreference);
	});
</script>

<a class="skip" href="#main-content">Skip to content</a>
<div class="landing">
	<header class="chapter">
		<a class="logo" href="#top"><span aria-hidden="true">週刊</span><b>{copy.name}</b></a>
		<p>CH. 01 — THE LOOP THAT WOULD NOT STOP</p>
		<nav aria-label="Landing page"><a href="#views">Views</a><a href="#teaching">Teaching</a><a href="#output">Output</a></nav>
	</header>

	<main id="main-content">
		<section class="hero" id="top">
			<div class="pitch">
				<h1 aria-label="Draw one frame. The loop already has it."><span aria-hidden="true">DRAW ONE FRAME.</span><span aria-hidden="true" class="inverse">THE LOOP ALREADY</span><span aria-hidden="true" class="inverse">HAS IT.</span></h1>
				<p>{copy.description}</p>
				<div class="actions"><button class="primary" disabled={!ready} onclick={onStart}>{ready ? (resume ? 'Resume autosave' : 'Start drawing') : 'Preparing editor…'}</button><a href="#output">See what exports</a></div>
				<ul aria-label="Product promises">{#each copy.localPromise as item}<li>{item}</li>{/each}</ul>
			</div>
			<figure class="stage">
				<Sprite playing={motionPlaying} continuous scale={16}/>
				<button class="motion-control" onclick={() => (motionPlaying = !motionPlaying)}>
					{motionPlaying ? 'Pause animation' : 'Play animation'}
				</button>
				<figcaption>{copy.example.note} {copy.example.frames} frames · {copy.example.fps} FPS · {copy.example.frameMs} ms each.</figcaption>
			</figure>
		</section>

		<section class="strip" id="views">
			<div class="section-head"><h2>THREE VIEWS. ONE SESSION.</h2><p>Focus, Grid, and Loop share the same document, selected frame, zoom, palette, and history. Each view says plainly what it is bad at.</p></div>
			<div class="mode-table"><div class="table-head"><span>VIEW</span><span>KEY</span><span>GREAT AT</span><span>STRAINS WHEN</span></div>{#each copy.modes as mode}<div class="mode-row"><strong>{mode.label}</strong><kbd>{mode.key}</kbd><p>{mode.great}</p><p>{mode.strains}</p></div>{/each}</div>
		</section>

		<section class="strip" id="teaching">
			<div class="section-head"><h2>TEACHING, WHEN IT HELPS.</h2><p>Twenty-six contextual tips respond to real editing actions. They never block the canvas, appear one at a time, stop repeating, and can be dismissed forever.</p></div>
			<ul class="tips">{#each copy.tips as tip}<li><blockquote>{tip.copy}</blockquote><span>{tip.id}</span></li>{/each}</ul>
		</section>

		<section class="strip" id="output">
			<div class="section-head"><h2>FILES THAT LEAVE THE TOOL.</h2><p>Sprite-sheet output is verified against stock Phaser and Godot. Project files and autosave keep the editable source local.</p></div>
			<div class="output-list">{#each copy.outputs as [name, detail]}<div><strong>{name}</strong><span>{detail}</span></div>{/each}</div>
		</section>

		<section class="toolbox"><h2>WHAT IS IN THE BOX</h2><ul>{#each copy.capabilities as item}<li>{item}</li>{/each}</ul><button class="primary inverse-button" disabled={!ready} onclick={onStart}>{resume ? 'Resume autosave' : 'Open the editor'}</button></section>
	</main>

	<footer><strong>{copy.name}</strong><p>Local-first pixel animation. Your editable project belongs in a file on your disk.</p></footer>
</div>

<style>
	.landing{--paper:#f2efe6;--paper-2:#e9e5d9;--ink:#111;--gray:#5f5b54;min-height:100vh;padding:0 clamp(.9rem,3vw,3rem) 3rem;background-color:var(--paper);background-image:radial-gradient(rgba(17,17,17,.1) .55px,transparent .7px);background-size:5px 5px;color:var(--ink);font:1rem/1.6 system-ui,sans-serif}.skip{position:fixed;z-index:20;top:.5rem;left:.5rem;padding:.6rem .8rem;background:#111;color:#fff;transform:translateY(-150%)}.skip:focus{transform:none}.chapter{display:flex;align-items:flex-end;gap:clamp(1rem,3vw,2.5rem);padding:1.4rem 0 1rem;border-bottom:4px solid var(--ink)}.logo{display:flex;align-items:center;gap:.65rem;color:inherit;text-decoration:none}.logo span{padding:.35rem .2rem;background:var(--ink);color:var(--paper);font-size:.72rem;font-weight:900;letter-spacing:.08em;writing-mode:vertical-rl}.logo b{font-size:clamp(1.4rem,3vw,2.2rem);font-weight:950;letter-spacing:-.03em;text-transform:uppercase}.chapter>p{flex:1;color:var(--gray);font-size:.6875rem;font-weight:800;letter-spacing:.16em}.chapter nav{display:flex;gap:1.2rem}.chapter nav a{min-height:44px;color:inherit;font-size:.6875rem;font-weight:800;letter-spacing:.12em;text-decoration:none;text-transform:uppercase}.chapter a:focus-visible,.landing button:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
	main{width:min(1180px,100%);margin:auto}.hero{display:grid;grid-template-columns:minmax(280px,1fr) minmax(320px,.9fr);gap:clamp(2rem,6vw,6rem);align-items:center;min-height:660px;padding:clamp(2rem,6vw,5rem) 0}.pitch h1{display:flex;flex-direction:column;align-items:flex-start;gap:3px;font-size:clamp(2.7rem,6vw,5.2rem);font-weight:950;line-height:.98;letter-spacing:-.04em;text-wrap:balance}.pitch h1 span{padding:.03em .12em .08em;margin-left:-.12em}.pitch h1 .inverse{background:var(--ink);color:var(--paper)}.pitch>p{max-width:40ch;margin-top:1.5rem;color:#34312d}.actions{display:flex;align-items:center;gap:.8rem;margin-top:1.7rem}.primary{min-height:48px;padding:.7rem 1rem;border:3px solid var(--ink);border-radius:0;background:var(--ink);color:var(--paper);font:800 .75rem/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}.primary:disabled{opacity:.55}.actions>a{color:inherit;font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.pitch ul{display:flex;flex-wrap:wrap;gap:.5rem 1rem;margin-top:1.3rem!important;color:var(--gray);font-size:.75rem;list-style:none}.pitch li{display:flex;align-items:center;gap:.55rem}.pitch li::before{width:4px;height:4px;flex:none;border-radius:50%;background:currentColor;content:''}.stage{position:relative;display:grid;place-items:center;min-height:430px;margin:0;overflow:hidden;border:3px solid var(--ink);background:var(--paper)}.stage :global(canvas){position:relative}.stage figcaption{position:absolute;right:0;bottom:0;left:0;padding:.7rem .8rem;background:var(--paper);border-top:3px solid var(--ink);font-size:.75rem;line-height:1.35}
	.motion-control{position:absolute;top:.65rem;right:.65rem;z-index:1;background:var(--paper)}
	.strip{padding:clamp(4rem,8vw,7rem) 0 0}.section-head{display:grid;grid-template-columns:minmax(260px,.6fr) 1fr;gap:clamp(2rem,8vw,7rem);align-items:start}.section-head h2{justify-self:start;padding:.3rem .65rem;background:var(--ink);color:var(--paper);font-size:clamp(1.25rem,2.5vw,1.8rem);font-weight:950;letter-spacing:-.02em}.section-head p{max-width:64ch;color:#34312d}.mode-table{margin-top:1.8rem;border:3px solid var(--ink)}.table-head,.mode-row{display:grid;grid-template-columns:7rem 4rem 1fr 1fr}.table-head{background-image:radial-gradient(var(--ink) 1.5px,transparent 1.7px);background-size:6px 6px}.table-head span{padding:.65rem .8rem;background:rgba(242,239,230,.8);font-size:.625rem;font-weight:900;letter-spacing:.12em}.mode-row>*{margin:0;padding:.9rem .8rem;border-top:2px solid var(--ink);border-right:1px solid var(--ink)}.mode-row>*:last-child{border-right:0}.mode-row strong{text-transform:uppercase}.mode-row kbd{font:900 .75rem/1 system-ui,sans-serif}.mode-row p{font-size:.875rem;line-height:1.45}.mode-row p:last-child{background:var(--paper-2)}
	.tips{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:2rem!important}.tips li{display:flex;flex-direction:column;gap:.8rem}.tips blockquote{position:relative;flex:1;margin:0;padding:1.2rem;background:var(--paper);border:3px solid var(--ink);border-radius:22px;font-size:.9375rem;line-height:1.5}.tips blockquote::after{content:'';position:absolute;bottom:-14px;left:28px;width:18px;height:15px;background:var(--paper);border-right:3px solid var(--ink);border-bottom:3px solid var(--ink);transform:skewX(-28deg)}.tips span{padding-left:3.5rem;color:var(--gray);font-size:.625rem;font-weight:900;letter-spacing:.14em}.output-list{margin-top:1.8rem;border:3px solid var(--ink)}.output-list>div{display:grid;grid-template-columns:12rem 1fr}.output-list>div+div{border-top:2px solid var(--ink)}.output-list strong,.output-list span{padding:.85rem 1rem}.output-list strong{background:var(--paper-2);border-right:2px solid var(--ink);text-transform:uppercase}.output-list span{font-size:.875rem}.toolbox{display:grid;grid-template-columns:.55fr 1.2fr auto;gap:clamp(1.5rem,5vw,4rem);align-items:center;margin-top:clamp(4rem,8vw,7rem);padding:clamp(1.5rem,4vw,3rem);background:var(--ink);color:var(--paper)}.toolbox h2{font-size:clamp(1.5rem,3vw,2.4rem);line-height:1}.toolbox ul{display:grid;gap:.55rem;font-size:.875rem}.toolbox li::before{content:'■';margin-right:.7rem}.inverse-button{background:var(--paper);color:var(--ink);border-color:var(--paper)}footer{display:flex;align-items:center;gap:2rem;margin-top:4rem;padding-top:1.5rem;border-top:4px solid var(--ink)}footer p{margin-left:auto!important;color:var(--gray);font-size:.75rem}
	@media(max-width:800px){.chapter{align-items:center}.chapter>p,.chapter nav{display:none}.hero{grid-template-columns:1fr;min-height:0}.pitch{padding-top:2rem}.stage{min-height:390px}.stage :global(canvas){transform:scale(.78)}.section-head{grid-template-columns:1fr;gap:1rem}.tips{grid-template-columns:1fr}.toolbox{grid-template-columns:1fr}.table-head{display:none}.mode-row{grid-template-columns:1fr 3rem}.mode-row p{grid-column:1/-1}.mode-row p:last-child{border-right:0}.output-list>div{grid-template-columns:1fr}.output-list strong{border-right:0;border-bottom:1px solid var(--ink)}}
	@media(max-width:480px){.landing{padding-inline:.75rem}.pitch h1{font-size:clamp(2.35rem,13vw,3.6rem)}.actions{align-items:flex-start;flex-direction:column}.pitch ul{display:grid}.stage{min-height:330px}.stage :global(canvas){transform:scale(.62)}.mode-row{grid-template-columns:1fr 2.5rem}.output-list span{overflow-wrap:anywhere}footer{align-items:flex-start;flex-direction:column;gap:.5rem}footer p{margin-left:0!important}}
	@media(prefers-reduced-motion:reduce){.stage :global(canvas){animation:none}}
	.landing{font-family:"Zen Kaku Gothic New","Noto Sans",system-ui,sans-serif}
	.primary{font-family:inherit}
</style>
