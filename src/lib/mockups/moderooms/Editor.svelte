<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';
	const TIMES=[113,160,113,113,113,160,113,113];
</script>

<div class="mock rooms-editor">
	<header><strong>Doodle-Do</strong><nav><button>Focus</button><button class="active">Grid</button><button>Loop</button></nav><input value="chicken-walk" aria-label="Document name"/><span>Saved locally</span><button>Save</button><button class="export">Export</button></header>
	<main>{#each TIMES as ms,i}<button class:selected={i===1} class:empty={i>3}><span>0{i+1}</span>{#if i<4}<Sprite frame={i} scale={i===1?12:9}/>{:else}<b>+</b>{/if}<small>{i<4?`${ms} ms`:'NEW FRAME'}</small></button>{/each}</main>
	<footer>
		<div class="tools"><b>DRAW</b>{#each ['Pencil B','Erase E','Fill G','Pick I','Select M'] as tool,i}<button class:active={i===0}>{tool}</button>{/each}</div>
		<div class="layers"><b>LAYERS</b><button>Highlights</button><button class="active">Chicken</button><button>Rough</button></div>
		<div class="palette"><b>PALETTE</b><div><button class="alpha" aria-label="Transparent"></button>{#each PALETTE as hex,i}<button class:selected={i===15} style="background:{hex}" aria-label={hex}></button>{/each}</div></div>
		<div class="play"><label>FPS <select><option>8</option></select></label><label><input type="checkbox" checked/> Onion 35%</label><button>▶ Play loop</button></div>
	</footer>
</div>

<style>
	.rooms-editor{--blue:#2345a0;--red:#ef4d40;--white:#f7f7f2;--ink:#17191d;display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:100vh;background:#dfe2de;color:var(--ink);font:12px/1.35 Archivo,system-ui,sans-serif}button,input,select{min-height:36px;padding:.4rem .65rem;border:1px solid #70757d;background:var(--white);color:var(--ink);border-radius:3px}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--red);outline-offset:2px}header{display:flex;align-items:center;gap:.45rem;padding:.65rem 1rem;background:var(--ink);color:#fff}header strong{margin-right:.75rem;font-size:1rem}header nav{display:flex}header nav button{color:#d9dce2;background:transparent;border-radius:0}header nav .active{background:var(--blue);color:#fff}header input{width:150px;margin-left:.5rem}header span{margin-left:auto;color:#bdc0c6;font-size:.65rem}header>button{color:#fff;background:transparent}.export{background:var(--red)!important;border-color:#a8322a!important}
	main{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,minmax(210px,1fr));gap:8px;min-height:0;padding:8px;background:#7a7f84}main>button{position:relative;display:grid;place-items:center;min-width:0;overflow:hidden;background:repeating-conic-gradient(#e2e2dc 0 25%,#fff 0 50%) 0 0/18px 18px;border:0;border-radius:0}main>button.selected{grid-column:span 2;outline:6px solid var(--red);outline-offset:-6px}main>button span{position:absolute;top:.6rem;left:.7rem;padding:.25rem .4rem;background:var(--ink);color:#fff;font-weight:800}main>button small{position:absolute;right:.7rem;bottom:.6rem;padding:.2rem .35rem;background:var(--white)}main>button.empty{background:#cfd2cd;color:#72777b}main>button.empty b{font-size:2rem}
	footer{display:grid;grid-template-columns:1.1fr .7fr 1.1fr .8fr;gap:0;background:var(--white);border-top:2px solid var(--ink)}footer>div{padding:.75rem;border-right:1px solid #9b9f9d}footer>div:last-child{border:0}footer b{display:block;margin-bottom:.5rem;font-size:.58rem;letter-spacing:.08em}.tools,.layers{display:flex;align-items:center;flex-wrap:wrap;gap:4px}.tools b,.layers b{width:100%}.tools button,.layers button{min-height:32px;padding:.3rem .5rem}.tools .active,.layers .active{background:var(--blue);color:#fff}.palette>div{display:grid;grid-template-columns:repeat(8,1fr);gap:3px}.palette button{aspect-ratio:1;min-height:0;padding:0}.palette button.selected{outline:3px solid var(--red)}.alpha{background:repeating-conic-gradient(#aaa 0 25%,#fff 0 50%) 0 0/8px 8px}.play{display:flex;flex-direction:column;gap:.4rem}.play label{display:flex;align-items:center;gap:.4rem}.play input{min-height:0}.play>button{background:var(--red);color:#fff;border-color:#a8322a}
	@media(max-width:780px){header input,header span,header>button:not(.export){display:none}main{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(4,minmax(180px,1fr))}main>button.selected{grid-column:span 2}main :global(canvas){transform:scale(.78)}footer{grid-template-columns:1fr 1fr}.tools,.layers{display:none}.palette>div{grid-template-columns:repeat(8,1fr)}}
</style>
