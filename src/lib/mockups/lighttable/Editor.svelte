<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const TOOLS = [['Pencil','B'],['Eraser','E'],['Fill','G'],['Pick','I'],['Select','M'],['Lasso','L'],['Wand','W'],['Polygon','P']];
	const LAYERS = ['cleanup','character','rough'];
</script>

<div class="mock light-shell">
	<header>
		<span class="pegbar" aria-hidden="true"><i></i><i></i><i></i></span><strong>Doodle-Do</strong>
		<div class="modes"><button class="on">Focus <kbd>1</kbd></button><button>Grid <kbd>2</kbd></button><button>Loop <kbd>3</kbd></button></div>
		<label>Scene <input value="hero-walk" aria-label="Document name" /></label><span class="saved">Autosaved locally</span>
		<div class="files"><button>New</button><button>Open</button><button class="save">Save</button><button>Export</button></div>
	</header>

	<div class="toolrow">
		<div class="tools">{#each TOOLS as [name,key]}<button class:on={name==='Pencil'}>{name}<kbd>{key}</kbd></button>{/each}</div>
		<label>Brush <select><option>2 px</option></select></label><button>Mirror</button><button>Flip H</button><button>Flip V</button><button class="onion">Onion</button><input type="range" value="35" aria-label="Onion opacity" /><span>35%</span>
	</div>

	<div class="middle">
		<main>
			<div class="registration"><div class="pegbar"><i></i><i></i><i></i></div><div class="canvas"><Sprite frame={1} scale={24} onion={0.4} grid /></div><div class="notes"><span>SC 01</span><span>FR 02 / 04</span><span>16 × 16</span></div></div>
			<div class="stage-foot"><span><i class="red"></i>Previous</span><span><i class="blue"></i>Next</span><span>Onion 40%</span><span class="zoom">− <b>1800%</b> +</span></div>
		</main>

		<aside>
			<section><div class="section-title"><h2>Loop</h2><span>8 fps</span></div><div class="preview"><Sprite playing scale={7} /></div><div class="range"><label>From <input value="1" /></label><span>→</span><label>To <input value="4" /></label><button>Pause</button></div></section>
			<section><div class="section-title"><h2>Cel stack</h2><button>+</button></div><ul>{#each LAYERS as layer,i}<li class:active={i===1}><button class="eye">{i===2?'○':'●'}</button><span>{layer}</span><small>{i===0?'cleanup red':i===2?'non-photo blue':'ink'}</small><button>•••</button></li>{/each}</ul><button class="wide">Merge down</button></section>
			<section><div class="section-title"><h2>Paint box</h2><button class="locked">Locked</button></div><div class="palette"><button class="sw alpha" aria-label="Transparent"></button>{#each PALETTE as hex,i}<button class="sw" class:sel={i===6} style="background:{hex}" aria-label={hex}></button>{/each}</div><p class="count">16 colours in use · 64 maximum</p></section>
		</aside>
	</div>

	<footer>
		<div class="frame-bar"><strong>Exposure</strong><button>New frame</button><button>Duplicate</button><button>Delete</button><span>Loop 01 → 04</span><label>Hold <input value="125" /> ms</label></div>
		<ol>{#each {length:10} as _,i}<li><span class="num">{String(i+1).padStart(2,'0')}</span><button class:current={i===1}>{#if i<4}<Sprite frame={i} scale={4}/>{:else}<span>+</span>{/if}</button><span class="ms">{i===1?'160':'113'}</span></li>{/each}</ol>
	</footer>

	<div class="tip" role="status"><span>T02</span><p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p><button aria-label="Dismiss tip">×</button></div>
</div>

<style>
	.light-shell { --paper:#f8fbfe;--paper2:#eaf3fa;--ink:#1c2833;--muted:#657789;--line:#c9d7e3;--blue:#2f6fb0;--red:#b83f3f;display:flex;flex-direction:column;min-height:100vh;background:var(--paper);color:var(--ink);font:13px/1.4 Archivo,system-ui,sans-serif; }
	button,input,select{min-height:29px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--ink)}button{padding:.25rem .55rem}button:hover{background:var(--paper2)}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #e98a8a;outline-offset:1px}
	header{display:flex;align-items:center;gap:.7rem;min-height:54px;padding:.55rem .8rem;background:#fff;border-bottom:1px solid var(--line)}header>.pegbar{display:flex;gap:4px;width:auto;height:auto;padding:5px 7px;background:var(--blue);border:0}.pegbar i{width:7px;height:7px;border-radius:50%;background:#fff}header strong{font-size:.95rem}.modes{display:flex}.modes button{border-radius:0;margin-left:-1px}.modes button:first-child{border-radius:3px 0 0 3px}.modes button:last-child{border-radius:0 3px 3px 0}.modes button.on,.save{color:#fff;background:var(--blue);border-color:var(--blue)}kbd{margin-left:.3rem;color:inherit;font-size:.58rem}header label{display:flex;align-items:center;gap:.4rem;color:var(--muted)}header input{width:160px;padding:.35rem}.saved{margin-left:auto;color:var(--muted);font-size:.68rem}.files{display:flex;gap:.3rem}
	.toolrow{display:flex;align-items:center;gap:.4rem;padding:.45rem .8rem;background:var(--paper2);border-bottom:1px solid var(--line);overflow-x:auto;white-space:nowrap}.tools{display:flex;margin-right:.5rem}.tools button{border-radius:0;margin-left:-1px}.tools button:first-child{border-radius:3px 0 0 3px}.tools button:last-child{border-radius:0 3px 3px 0}.tools button.on{color:#fff;background:var(--red);border-color:var(--red)}.toolrow label{display:flex;align-items:center;gap:.3rem;color:var(--muted)}.toolrow select{padding:.25rem}.toolrow input[type=range]{width:82px;accent-color:var(--blue)}.onion{color:#fff!important;background:var(--blue)!important;border-color:var(--blue)!important}
	.middle{display:grid;grid-template-columns:minmax(420px,1fr) 260px;flex:1;min-height:470px}.middle main{display:flex;flex-direction:column;min-width:0;padding:1.1rem;background:#dcecf6}.registration{display:flex;flex-direction:column;width:min(72vh,620px);max-width:calc(100% - 2rem);aspect-ratio:1;margin:auto;background:rgba(255,255,255,.94);border:1px solid #b8cad8;box-shadow:0 5px 10px rgba(50,88,116,.12)}.registration>.pegbar{display:flex;justify-content:center;gap:24px;height:36px;padding-top:10px;background:var(--paper2);border-bottom:1px solid var(--line)}.registration>.pegbar i{width:22px;height:10px;border-radius:8px;background:#b7d3e6;box-shadow:inset 0 1px 2px rgba(47,91,123,.25)}.canvas{display:grid;place-items:center;flex:1;overflow:hidden;background:repeating-conic-gradient(#edf4f9 0 25%,#fff 0 50%) 0 0/20px 20px}.notes{display:flex;justify-content:space-between;padding:.55rem .75rem;color:var(--blue);border-top:1px solid var(--line);font:700 .62rem/1 'Courier Prime',monospace;letter-spacing:.08em}.stage-foot{display:flex;gap:1rem;padding:.5rem .25rem 0;color:#53687a;font-size:.68rem}.stage-foot i{display:inline-block;width:9px;height:9px;margin-right:.3rem;border-radius:2px}.stage-foot .red{background:#d04648}.stage-foot .blue{background:#6daa2c}.zoom{margin-left:auto}.zoom b{margin:0 .5rem;color:var(--ink)}
	aside{background:#fff;border-left:1px solid var(--line)}aside section{padding:.75rem;border-bottom:1px solid var(--line)}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:.55rem}.section-title h2{font-size:.78rem}.section-title>span,.count{color:var(--muted);font-size:.66rem}.section-title button{min-height:24px;padding:.1rem .4rem;font-size:.65rem}.preview{display:grid;place-items:center;aspect-ratio:1.65;background:repeating-conic-gradient(#edf4f9 0 25%,#fff 0 50%) 0 0/12px 12px;border:1px solid var(--line)}.range{display:flex;align-items:center;gap:.35rem;margin-top:.5rem}.range label{display:flex;align-items:center;gap:.25rem;color:var(--muted);font-size:.65rem}.range input{width:30px;padding:.2rem;text-align:center}.range button{margin-left:auto}aside ul{border-top:1px solid var(--line)}aside li{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:.3rem;padding:.3rem 0;border-bottom:1px solid var(--line)}aside li.active{background:#edf5fb}aside li button{min-height:23px;padding:.1rem .35rem;border:0;background:transparent}.eye{color:var(--blue)}aside li small{color:var(--muted);font-size:.58rem}.wide{width:100%;margin-top:.5rem}.locked{color:var(--blue)!important}.palette{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.sw{aspect-ratio:1;min-height:0;padding:0;border-radius:2px}.alpha{background:repeating-conic-gradient(#c4cbd1 0 25%,#fff 0 50%) 0 0/8px 8px}.sw.sel{outline:2px solid var(--red);outline-offset:1px}.count{margin-top:.5rem!important}
	footer{background:#fff;border-top:1px solid var(--line)}.frame-bar{display:flex;align-items:center;gap:.4rem;padding:.4rem .7rem;border-bottom:1px solid var(--line)}.frame-bar span{margin-left:auto;color:var(--muted)}.frame-bar label{color:var(--muted)}.frame-bar input{width:44px;padding:.2rem;text-align:right}footer ol{display:flex;gap:.4rem;padding:.45rem .7rem!important;overflow-x:auto}footer li{display:grid;grid-template-rows:auto 54px auto;flex:0 0 58px;text-align:center}.num,.ms{color:var(--blue);font:700 .57rem/1.4 'Courier Prime',monospace}.ms{color:var(--muted)}footer li button{display:grid;place-items:center;width:58px;padding:0;overflow:hidden;background:repeating-conic-gradient(#edf4f9 0 25%,#fff 0 50%) 0 0/8px 8px}footer li button.current{outline:2px solid var(--red);outline-offset:1px}footer li button>span{color:#9aabb9}
	.tip{position:fixed;right:280px;bottom:154px;display:grid;grid-template-columns:auto minmax(220px,420px) auto;align-items:center;gap:.7rem;padding:.7rem .85rem;background:#fff;border:1px solid var(--line);border-radius:4px;box-shadow:0 5px 10px rgba(50,88,116,.13)}.tip span{color:var(--red);font:700 .65rem/1 'Courier Prime',monospace}.tip p{font-size:.75rem}.tip button{border:0;background:transparent}
	@media(max-width:900px){.middle{grid-template-columns:1fr}aside{display:grid;grid-template-columns:repeat(3,1fr);border-left:0;border-top:1px solid var(--line)}.tip{display:none}}
	@media(max-width:680px){header{flex-wrap:wrap}.saved,header label{display:none}.files{margin-left:auto}.files button:not(.save){display:none}.tools button:nth-child(n+5),.toolrow>button,.toolrow>label,.toolrow>input,.toolrow>span{display:none}.middle{min-height:70vh}.middle main{padding:.6rem}.registration{max-width:100%}aside{grid-template-columns:1fr}.frame-bar button:nth-of-type(n+2),.frame-bar span{display:none}.stage-foot span:nth-child(3){display:none}}
</style>
