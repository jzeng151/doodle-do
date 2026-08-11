<script lang="ts">
	import Sprite from '../Sprite.svelte';
	const NOTES=['Plant the foot','Pass the weight','Lift the heel','Close the loop'];
</script>

<div class="mock board-page">
	<header><a href="#board">Doodle-Do</a><span>Frame-by-frame pixel animation</span><a class="start" href="#board">Start drawing</a></header>
	<main id="board">
		<div class="intro"><h1>Motion is a story told four squares at a time.</h1><p>Draw the sequence, watch it move, and send clean sprite sheets straight to your game.</p></div>
		<div class="sequence">
			{#each NOTES as note,i}<figure><div><Sprite frame={i} scale={12}/><span>{String(i+1).padStart(2,'0')}</span></div><figcaption><b>{note}</b><small>{i===1?'160':'113'} ms</small></figcaption></figure>{/each}
			<div class="export"><span>THE END?</span><strong>Ship the loop.</strong><p>PNG · JSON · GIF · ZIP</p><a href="#board">Export-ready →</a></div>
		</div>
		<div class="notes"><p><b>Focus</b> fixes one drawing.</p><p><b>Grid</b> compares every pose.</p><p><b>Loop</b> judges the movement.</p><blockquote>“A short loop with clear poses beats a long loop full of almosts.”</blockquote></div>
	</main>
	<footer><b>White chicken / walk / 4 frames / 8 fps</b><span>No account · no upload · works offline</span></footer>
</div>

<style>
	.board-page{--paper:#f4f0e8;--ink:#24201d;--red:#df5a47;--blue:#315c69;min-height:100%;background:var(--paper);color:var(--ink);font:16px/1.45 'IBM Plex Mono',ui-monospace,monospace}a{color:inherit}header{display:flex;align-items:center;gap:2rem;padding:1rem clamp(1rem,4vw,4rem);border-bottom:2px solid var(--ink)}header>a:first-child{font-weight:900;text-decoration:none}header span{color:#6d6761;font-size:.72rem}header .start{margin-left:auto;padding:.65rem 1rem;background:var(--red);color:#fff;border:2px solid #9c3429;font-weight:800;text-decoration:none}a:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
	main{padding:clamp(2.5rem,6vw,6rem) 0}.intro{display:grid;grid-template-columns:1.4fr .6fr;align-items:end;gap:3rem;width:min(1320px,calc(100% - 2rem));margin:0 auto clamp(2rem,5vw,4rem)}.intro h1{max-width:16ch;font-family:Archivo,system-ui,sans-serif;font-size:clamp(3rem,6.4vw,6rem);line-height:.92;letter-spacing:-.04em;text-wrap:balance}.intro p{max-width:32ch;color:#5e5953}
	.sequence{display:flex;align-items:stretch;gap:0;padding-left:max(1rem,calc((100vw - 1320px)/2));overflow-x:auto;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink)}figure{flex:1 0 260px;margin:0;border-right:2px solid var(--ink)}figure>div{position:relative;display:grid;place-items:center;min-height:310px;background:#fff}figure>div>span{position:absolute;top:.75rem;left:.75rem;font-weight:800}figcaption{display:flex;justify-content:space-between;padding:1rem;background:var(--paper);border-top:2px solid var(--ink)}figcaption small{color:#776f68}.export{display:flex;flex:1 0 250px;flex-direction:column;justify-content:center;padding:2rem;background:var(--red);color:#fff}.export>span{font-size:.65rem}.export strong{margin-top:1rem;font-family:Archivo,system-ui,sans-serif;font-size:2.4rem;line-height:1}.export p{margin-top:1rem}.export a{margin-top:2rem;font-weight:800}
	.notes{display:grid;grid-template-columns:repeat(3,1fr) 2fr;gap:0;width:min(1320px,calc(100% - 2rem));margin:clamp(2rem,5vw,4rem) auto 0;border:2px solid var(--ink)}.notes>*{margin:0;padding:1rem;border-right:2px solid var(--ink)}.notes>*:last-child{border:0}.notes p{font-size:.72rem}.notes blockquote{color:#fff;background:var(--blue);font-size:.9rem}footer{display:flex;justify-content:space-between;gap:1rem;padding:1.2rem clamp(1rem,4vw,4rem);color:#fff;background:var(--ink);font-size:.66rem}
	@media(max-width:760px){header span{display:none}.intro{grid-template-columns:1fr}.intro h1{font-size:clamp(2.8rem,14vw,4.5rem)}.sequence{padding-left:1rem}figure{flex-basis:78vw}.notes{grid-template-columns:1fr}.notes>*{border-right:0;border-bottom:2px solid var(--ink)}footer{flex-direction:column}}
</style>
