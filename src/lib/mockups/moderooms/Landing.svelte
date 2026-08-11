<script lang="ts">
	import Sprite from '../Sprite.svelte';
</script>

<div class="mock rooms-page">
	<header><a href="#rooms">Doodle-Do</a><span>Three views. One animation.</span><a href="#rooms">Start drawing</a></header>
	<main id="rooms">
		<section class="focus"><div class="copy"><b>FOCUS · 1</b><h1>Make one frame right.</h1><p>Maximum room for deliberate pixels.</p></div><div class="single"><Sprite frame={1} scale={18}/></div></section>
		<section class="grid"><div class="copy"><b>GRID · 2</b><h2>Make every pose agree.</h2><p>Compare silhouettes before polishing.</p></div><div class="matrix">{#each {length:4} as _,i}<div><Sprite frame={i} scale={7}/><span>0{i+1}</span></div>{/each}</div></section>
		<section class="loop"><div class="copy"><b>LOOP · 3</b><h2>Make motion feel alive.</h2><p>Playback exposes the awkward frame.</p></div><div class="player"><Sprite playing scale={13}/><span>▶ 8 FPS</span></div><a href="#rooms">PNG · JSON · GIF · ZIP →</a></section>
	</main>
</div>

<style>
	.rooms-page{--blue:#2345a0;--red:#ef4d40;--white:#f7f7f2;--ink:#17191d;min-height:100%;background:var(--white);color:var(--ink);font:16px/1.4 Archivo,system-ui,sans-serif}a{color:inherit}header{display:flex;align-items:center;gap:2rem;height:58px;padding:0 1.25rem;border-bottom:2px solid var(--ink)}header a:first-child{font-weight:900;text-decoration:none}header span{color:#646970;font-size:.75rem}header a:last-child{margin-left:auto;padding:.55rem .8rem;background:var(--red);color:#fff;border:2px solid #a4322b;font-weight:800;text-decoration:none}a:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
	main{display:grid;grid-template-columns:1.08fr .92fr 1fr;min-height:calc(100vh - 163px)}section{display:flex;min-width:0;flex-direction:column;padding:clamp(1.25rem,3vw,3rem);border-right:2px solid var(--ink)}section:last-child{border:0}.copy b{font-size:.66rem;letter-spacing:.08em}.copy h1,.copy h2{max-width:9ch;margin-top:.8rem!important;font-size:clamp(2rem,3.8vw,4.5rem);line-height:.93;letter-spacing:-.04em;text-wrap:balance}.copy p{max-width:24ch;margin-top:.8rem!important;color:#555c64;font-size:.85rem}.single,.matrix,.player{margin-top:auto}.single{display:grid;place-items:center;min-height:55%;background:var(--blue)}.single :global(canvas){filter:drop-shadow(10px 12px 0 rgba(0,0,0,.2))}.grid{background:var(--red);color:#fff}.grid .copy p{color:#ffe6e2}.matrix{display:grid;grid-template-columns:1fr 1fr;border:2px solid var(--ink)}.matrix>div{position:relative;display:grid;place-items:center;aspect-ratio:1;background:var(--white);border-right:1px solid var(--ink);border-bottom:1px solid var(--ink)}.matrix>div:nth-child(even){border-right:0}.matrix>div:nth-child(n+3){border-bottom:0}.matrix span{position:absolute;top:.45rem;left:.5rem;color:var(--ink);font-size:.58rem;font-weight:800}.loop{background:var(--ink);color:#fff}.loop .copy p{color:#c9ccd2}.player{display:grid;place-items:center;aspect-ratio:1;background:var(--white);border-radius:50%}.player span{margin-top:.7rem;color:var(--ink);font-size:.68rem;font-weight:800}.loop>a{margin-top:1.5rem;color:#fff;font-size:.74rem;font-weight:800}
	@media(max-width:760px){header span{display:none}main{display:flex;min-height:calc(100vh - 163px);overflow-x:auto;scroll-snap-type:x mandatory}section{flex:0 0 88vw;scroll-snap-align:start}.copy h1,.copy h2{font-size:clamp(2.7rem,13vw,4.2rem)}.single{min-height:48%}.single :global(canvas){transform:scale(.74)}.matrix{width:100%}.player{width:100%}}
</style>
