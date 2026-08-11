<script lang="ts">
	import { PALETTE } from '../sprites';
	import Sprite from '../Sprite.svelte';

	const TOOLS = [['Pencil','B'],['Eraser','E'],['Fill','G'],['Pick','I'],['Select','M'],['Lasso','L'],['Wand','W'],['Polygon','P']];
	const LAYERS = ['highlights','character','sketch'];
</script>

<div class="mock studio-shell">
	<header>
		<strong>Doodle-Do</strong>
		<div class="modes" role="group" aria-label="Workspace mode"><button class="on">Focus</button><button>Grid</button><button>Loop</button></div>
		<input class="doc" value="hero-walk" aria-label="Document name" />
		<span class="saved">Saved locally</span>
		<div class="files"><button>New</button><button>Open</button><button class="save">Save</button><button>Export</button></div>
	</header>

	<div class="toolbar">
		<div class="toolset" role="group" aria-label="Tools">{#each TOOLS as [name,key]}<button class:on={name==='Pencil'}>{name}<kbd>{key}</kbd></button>{/each}</div>
		<div class="controls"><label>Size <select aria-label="Brush size"><option>2 px</option></select></label><button>Mirror</button><button>Flip H</button><button>Flip V</button><button class="on">Onion</button><label>Opacity <input type="range" value="35" aria-label="Onion opacity" /></label><span>35%</span></div>
	</div>

	<div class="work">
		<aside class="left" aria-label="Tool shortcuts">{#each TOOLS as [name,key]}<button class:on={name==='Pencil'} aria-label={name}><span>{key}</span><small>{name}</small></button>{/each}</aside>
		<main>
			<div class="canvas"><Sprite frame={1} scale={24} onion={0.35} grid /></div>
			<div class="canvas-status"><span>Frame 02 of 04</span><span>16 × 16</span><span><i class="prev"></i> Previous</span><span><i class="next"></i> Next</span><span class="zoom">− <b>1800%</b> +</span></div>
		</main>
		<aside class="right">
			<section><div class="section-head"><h2>Loop preview</h2><button>Pause</button></div><div class="preview"><Sprite playing scale={7} /></div><div class="facts"><span>8 fps</span><span>4 frames</span><span>500 ms</span></div></section>
			<section><div class="section-head"><h2>Layers</h2><button>+</button></div><ul>{#each LAYERS as layer,i}<li class:active={i===1}><button class="eye" aria-label="Toggle {layer}">{i===2?'○':'●'}</button><span>{layer}</span><button aria-label="Layer menu">•••</button></li>{/each}</ul><button class="wide">Merge down</button></section>
			<section><div class="section-head"><h2>Palette <span>16 / 64</span></h2><button class="lock">Locked</button></div><div class="palette"><button class="sw alpha" aria-label="Transparent"></button>{#each PALETTE as hex,i}<button class="sw" class:sel={i===6} style="background:{hex}" aria-label={hex}></button>{/each}</div></section>
		</aside>
	</div>

	<footer>
		<div class="frame-head"><strong>Frames</strong><button>+</button><button>Duplicate</button><button>Delete</button><span>Loop 01 → 04</span><label>Duration <input value="125" aria-label="Frame duration" /> ms</label></div>
		<ol>{#each {length:10} as _,i}<li><button class="frame" class:current={i===1}>{#if i<4}<Sprite frame={i} scale={4}/>{:else}<span>+</span>{/if}</button><span>{String(i+1).padStart(2,'0')}</span></li>{/each}</ol>
	</footer>

	<div class="tip" role="status"><b>Tip</b><p>The red ghost is your previous frame. Draw where things have moved to, not where they were.</p><button aria-label="Dismiss tip">×</button></div>
</div>

<style>
	.studio-shell { --bg:#f3f4f6; --surface:#fff; --surface2:#e9ecf0; --ink:#20242a; --muted:#68707c; --line:#d7dbe2; --blue:#3659d9; display:flex; flex-direction:column; min-height:100vh; background:var(--bg); color:var(--ink); font:13px/1.4 Archivo,system-ui,sans-serif; }
	button,input,select { border:1px solid var(--line); border-radius:6px; background:var(--surface); color:var(--ink); }
	button { min-height:30px; padding:.3rem .65rem; }
	button:hover { background:#f0f2f5; }
	button.on,.save { color:#fff; background:var(--blue); border-color:var(--blue); }
	button:focus-visible,input:focus-visible,select:focus-visible { outline:3px solid #96a8ff; outline-offset:1px; }
	header { display:flex; align-items:center; gap:.75rem; min-height:54px; padding:.55rem .8rem; background:var(--surface); border-bottom:1px solid var(--line); }
	header strong { font-size:.95rem; }
	.modes { display:flex; }
	.modes button { border-radius:0; margin-left:-1px; }
	.modes button:first-child { border-radius:6px 0 0 6px; }
	.modes button:last-child { border-radius:0 6px 6px 0; }
	.doc { width:180px; padding:.42rem .55rem; }
	.saved { margin-left:auto; color:var(--muted); font-size:.72rem; }
	.files { display:flex; gap:.35rem; }
	.toolbar { display:flex; align-items:center; gap:1rem; padding:.45rem .8rem; background:#f9fafb; border-bottom:1px solid var(--line); overflow-x:auto; }
	.toolset { display:none; }
	.controls { display:flex; align-items:center; gap:.4rem; white-space:nowrap; }
	.controls label { display:flex; align-items:center; gap:.35rem; color:var(--muted); }
	.controls select { padding:.34rem .45rem; }
	.controls input[type=range] { width:88px; accent-color:var(--blue); }
	.work { display:grid; grid-template-columns:64px minmax(380px,1fr) 250px; flex:1; min-height:460px; }
	.left { display:flex; flex-direction:column; align-items:center; gap:.45rem; padding:.65rem .45rem; background:var(--surface); border-right:1px solid var(--line); }
	.left button { display:grid; place-items:center; width:48px; height:44px; padding:3px; }
	.left button span { font-weight:800; }
	.left button small { color:var(--muted); font-size:.57rem; }
	.left button.on small { color:#e8ecff; }
	.work main { display:flex; flex-direction:column; min-width:0; }
	.canvas { display:grid; place-items:center; flex:1; min-height:390px; overflow:hidden; background:repeating-conic-gradient(#dfe2e6 0 25%,#f7f8f9 0 50%) 0 0/20px 20px; }
	.canvas-status { display:flex; gap:1rem; padding:.45rem .7rem; color:var(--muted); background:var(--surface); border-top:1px solid var(--line); font-size:.7rem; }
	.canvas-status i { display:inline-block; width:8px; height:8px; margin-right:.25rem; border-radius:2px; }
	.prev { background:#d04648; }.next { background:#6daa2c; }.zoom { margin-left:auto; }.zoom b { margin:0 .5rem; color:var(--ink); }
	.right { background:var(--surface); border-left:1px solid var(--line); }
	.right section { padding:.75rem; border-bottom:1px solid var(--line); }
	.section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.6rem; }
	.section-head h2 { font-size:.78rem; }.section-head h2 span { margin-left:.4rem; color:var(--muted); font-weight:400; }
	.section-head button { min-height:25px; padding:.15rem .45rem; font-size:.68rem; }
	.preview { display:grid; place-items:center; aspect-ratio:1.55; background:var(--surface2); }
	.facts { display:flex; justify-content:space-between; margin-top:.45rem; color:var(--muted); font-size:.67rem; }
	.right ul { border-top:1px solid var(--line); }
	.right li { display:grid; grid-template-columns:auto 1fr auto; align-items:center; padding:.35rem .25rem; border-bottom:1px solid var(--line); }
	.right li.active { background:#eef1ff; }
	.right li button { min-height:24px; padding:.1rem .35rem; border:0; background:transparent; }
	.eye { color:var(--blue); }.wide { width:100%; margin-top:.5rem; }.lock { color:var(--blue) !important; }
	.palette { display:grid; grid-template-columns:repeat(6,1fr); gap:5px; }
	.sw { aspect-ratio:1; min-height:0; padding:0; border-radius:3px; }
	.alpha { background:repeating-conic-gradient(#bbb 0 25%,#fff 0 50%) 0 0/8px 8px; }
	.sw.sel { outline:2px solid var(--blue); outline-offset:1px; }
	footer { background:var(--surface); border-top:1px solid var(--line); }
	.frame-head { display:flex; align-items:center; gap:.45rem; padding:.45rem .7rem; border-bottom:1px solid var(--line); }
	.frame-head span { margin-left:auto; color:var(--muted); }.frame-head label { color:var(--muted); }.frame-head input { width:48px; padding:.28rem; text-align:right; }
	footer ol { display:flex; gap:.45rem; padding:.55rem .7rem !important; overflow-x:auto; }
	footer li { flex:0 0 58px; color:var(--muted); text-align:center; font-size:.62rem; }
	.frame { display:grid; place-items:center; width:58px; aspect-ratio:1; padding:0; overflow:hidden; background:repeating-conic-gradient(#e1e3e6 0 25%,#fff 0 50%) 0 0/8px 8px; }
	.frame.current { outline:2px solid var(--blue); outline-offset:1px; }.frame span { color:#9ca3ad; }
	.tip { position:fixed; right:270px; bottom:158px; display:grid; grid-template-columns:auto minmax(220px,420px) auto; align-items:center; gap:.7rem; padding:.7rem .85rem; color:#fff; background:#252a31; border-radius:8px; box-shadow:0 6px 14px rgba(20,25,34,.24); }
	.tip b { color:#aab7ff; font-size:.7rem; }.tip p { font-size:.76rem; }.tip button { border:0; color:#fff; background:transparent; }
	kbd { margin-left:.4rem; color:var(--muted); font-size:.6rem; }
	@media(max-width:900px){ .work { grid-template-columns:54px 1fr; }.right { grid-column:1/-1; display:grid; grid-template-columns:repeat(3,1fr); border-left:0; border-top:1px solid var(--line); }.tip { display:none; } }
	@media(max-width:680px){ header { flex-wrap:wrap; }.saved,.doc { display:none; }.files { margin-left:auto; }.files button:not(.save) { display:none; }.left { display:none; }.work { grid-template-columns:1fr; }.toolset { display:flex; }.controls { display:none; }.right { grid-template-columns:1fr; }.canvas { min-height:55vh; }.canvas-status span:nth-child(n+3):not(.zoom) { display:none; }.frame-head button:nth-of-type(n+2),.frame-head span { display:none; } }
</style>
