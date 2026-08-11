<script lang="ts">
	import Sprite from '../Sprite.svelte';
</script>

<div class="mock stage-page">
	<header><a href="#stage">Doodle-Do</a><nav><a href="#how">How it works</a><a class="launch" href="#stage">Open editor</a></nav></header>
	<main id="stage">
		<div class="art"><span class="frame-no">FRAME 02 / 04</span><Sprite playing scale={22}/><span class="tempo">8 FPS · 500 MS LOOP</span></div>
		<div class="caption" id="how">
			<h1>Draw the frame.<br/>Feel the loop.</h1>
			<p>A browser pixel animator that keeps playback in sight while you work. Four frames in, engine-ready files out.</p>
			<div class="actions"><a class="primary" href="#stage">Start drawing</a><a href="#stage">PNG · JSON · GIF · ZIP</a><small>No account. No upload.</small></div>
		</div>
	</main>
</div>

<style>
	.stage-page{--yellow:#f2d64b;--teal:#173b45;--red:#d8423f;--ink:#151817;min-height:100%;background:var(--yellow);color:var(--ink);font:16px/1.45 Archivo,system-ui,sans-serif}a{color:inherit}header{position:absolute;z-index:2;top:0;right:0;left:0;display:flex;align-items:center;padding:1rem clamp(1rem,4vw,3rem);color:#fff}header>a{font-weight:900;text-decoration:none}nav{display:flex;align-items:center;gap:1.5rem;margin-left:auto}nav a{font-size:.8rem;text-decoration:none}.launch,.primary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.6rem 1rem;background:var(--red);color:#fff;border:2px solid #922925;border-radius:4px;font-weight:800;text-decoration:none}a:focus-visible{outline:3px solid #fff;outline-offset:3px}
	main{display:grid;grid-template-rows:minmax(520px,72vh) auto;min-height:calc(100vh - 105px)}.art{position:relative;display:grid;place-items:center;overflow:hidden;background:var(--teal)}.art::before{content:'DOODLE DO';position:absolute;color:rgba(255,255,255,.08);font-size:clamp(5rem,16vw,15rem);font-weight:950;letter-spacing:-.04em;white-space:nowrap}.art :global(canvas){position:relative;filter:drop-shadow(16px 18px 0 rgba(0,0,0,.18))}.frame-no,.tempo{position:absolute;color:#d7e6e8;font-size:.7rem;font-weight:800;letter-spacing:.08em}.frame-no{top:5rem;left:clamp(1rem,4vw,3rem)}.tempo{right:clamp(1rem,4vw,3rem);bottom:2rem}
	.caption{display:grid;grid-template-columns:1.15fr 1fr .8fr;align-items:center;gap:clamp(1.5rem,4vw,4rem);padding:clamp(1.5rem,4vw,3.5rem) clamp(1rem,5vw,5rem);background:#f7f7f2}.caption h1{font-size:clamp(2.2rem,4.5vw,4.6rem);line-height:.9;letter-spacing:-.04em;text-wrap:balance}.caption p{max-width:42ch;color:#445052;font-size:1.05rem}.actions{display:flex;flex-direction:column;align-items:flex-start;gap:.8rem}.actions>a:not(.primary){color:var(--teal);font-size:.72rem;font-weight:800;text-decoration:none}.actions small{color:#626a69}
	@media(max-width:760px){header nav>a:first-child{display:none}main{grid-template-rows:54vh auto}.art :global(canvas){transform:scale(.72)}.caption{grid-template-columns:1fr}.caption h1 br{display:none}.actions{flex-direction:row;align-items:center;flex-wrap:wrap}.actions small{width:100%}}
</style>
