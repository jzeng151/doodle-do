<script lang="ts">
	import Sprite from '../Sprite.svelte';

	const NOTES=[['T02','The red ghost is your previous frame. Draw where things moved to, not where they were.'],['T06','Great pixel art usually uses surprisingly few colours. Limits make choices easier.'],['T15','A project file on disk is the only copy you truly own.']];
	const MODES=[['Focus','one specimen in onion context','comparing the whole sequence'],['Grid','every pose side by side','detail work on one drawing'],['Loop','motion at full speed','making a new mark']];
</script>

<div class="mock guide-page">
	<header><a class="mark" href="#top"><b>Doodle-Do</b><span>Field guide to moving pixels</span></a><nav><a href="#observe">Observe</a><a href="#views">Views</a><a href="#export">Export</a></nav><a class="start" href="#top">Open editor</a></header>
	<main id="top">
		<section class="hero">
			<div class="title"><p>Plate 01 · Gallus pixelus</p><h1>Learn animation by watching what changes.</h1><span>Frame-by-frame pixel animation in the browser, with a live loop and practical notes that appear while you work.</span><div class="actions"><a class="start big" href="#observe">Start drawing</a><a href="#export">View export notes →</a></div><small>No account · local autosave · works offline</small></div>
			<figure class="specimen"><div class="number">01</div><div class="bird"><Sprite playing scale={18}/></div><div class="callout comb"><i></i><span>comb red<br/>palette index 07</span></div><div class="callout frame"><i></i><span>four drawings<br/>eight per second</span></div><figcaption><b>WHITE CHICKEN, WALKING</b><span>16 × 16 pixels · 1-bit alpha</span></figcaption></figure>
		</section>

		<section class="observe" id="observe">
			<div class="section-title"><span>Observation 01</span><h2>A loop reveals more than a still.</h2><p>Four poses can feel alive when their spacing and holds agree. Change one frame and see the result before your hand leaves the tool.</p></div>
			<div class="motion-plate">{#each {length:4} as _,i}<figure><span>{String(i+1).padStart(2,'0')}</span><div><Sprite frame={i} scale={8}/></div><figcaption>{i===1?'160':'113'} ms</figcaption></figure>{/each}<div class="cycle"><b>8</b><span>frames / sec</span><small>500 ms cycle</small></div></div>
		</section>

		<section class="notes">
			<div class="section-title"><span>Observation 02</span><h2>Teaching belongs beside the evidence.</h2><p>Twenty-six contextual notes respond to real editing actions, one at a time. Every note can be silenced forever.</p></div>
			<ol>{#each NOTES as [id,copy]}<li><b>{id}</b><p>{copy}</p><button aria-label="Dismiss {id}">×</button></li>{/each}</ol>
		</section>

		<section class="views" id="views">
			<div class="section-title"><span>Observation 03</span><h2>Three views of the same subject.</h2><p>Document, frame, palette, zoom, and history follow you. The field notes include what each view is poor at.</p></div>
			<div class="view-table"><div class="head"><span>View</span><span>Best observation</span><span>Blind spot</span></div>{#each MODES as [name,great,bad],i}<div><strong><kbd>{i+1}</kbd>{name}</strong><span>{great}</span><em>{bad}</em></div>{/each}</div>
		</section>

		<section class="export" id="export">
			<div class="section-title"><span>Observation 04</span><h2>Record the specimen in useful formats.</h2><p>The output enters real work: PNG sprite sheet, TexturePacker JSON, Doodle-Do project, GIF, or zipped frame PNGs.</p></div>
			<div class="ledger"><div><b>01</b><span>sprite-sheet.png</span><small>uniform grid</small></div><div><b>02</b><span>sprite-sheet.json</span><small>Phaser / Godot atlas</small></div><div><b>03</b><span>chicken-walk.doodledo.json</span><small>owned project file</small></div><div><b>04</b><span>chicken-walk.gif</span><small>moving preview</small></div></div>
		</section>
	</main>
	<footer><strong>Doodle-Do</strong><p>Starter palette: 16 colours · ceiling: 64 · render: Canvas 2D</p><a class="start" href="#top">Open editor</a></footer>
</div>

<style>
	.guide-page{--paper:#f4f5ef;--ink:#1c2925;--forest:#183a30;--moss:#5d755f;--red:#a93630;--rule:#bdc8bd;--wash:#e5ebe2;min-height:100%;background:var(--paper);color:var(--ink);font:16px/1.58 Archivo,system-ui,sans-serif}a{color:inherit}header{display:flex;align-items:center;gap:2rem;padding:1rem clamp(1rem,5vw,5rem);color:#f7f8f3;background:var(--forest)}.mark{display:flex;align-items:baseline;gap:.7rem;margin-right:auto;text-decoration:none}.mark b{font-family:Petrona,serif;font-size:1.1rem}.mark span{color:#bccbc2;font-size:.7rem}header nav{display:flex;gap:1.5rem}header nav a{color:#cfddd4;font-size:.8rem;text-decoration:none}.start{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:.45rem 1rem;color:#fff;background:var(--red);border-radius:3px;font-weight:700;text-decoration:none}.start:hover{background:#862a26}.start:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid #d5c85d;outline-offset:2px}
	main,footer{width:min(1140px,calc(100% - 2rem));margin:auto}.hero{display:grid;grid-template-columns:minmax(280px,.8fr) minmax(500px,1.2fr);align-items:center;gap:clamp(3rem,8vw,8rem);min-height:720px;padding:5rem 0}.title>p,.section-title>span{text-transform:uppercase;letter-spacing:.14em;color:var(--red);font-size:.68rem;font-weight:700}.title h1{max-width:11ch;margin-top:1rem!important;font-family:Petrona,serif;font-size:clamp(3rem,5.2vw,5rem);font-weight:600;line-height:1;letter-spacing:-.035em;text-wrap:balance}.title>span{display:block;max-width:40ch;margin-top:1.5rem;color:#52635c;font-size:1.05rem}.actions{display:flex;align-items:center;gap:1.2rem;margin-top:1.8rem}.actions>a:last-child{color:var(--forest);font-size:.85rem;font-weight:700;text-decoration:none}.big{min-height:48px;padding:.65rem 1.2rem}.title small{display:block;margin-top:1.3rem;color:#66766f}
	.specimen{position:relative;min-height:510px;background:#fff;border:1px solid var(--rule)}.number{position:absolute;top:1rem;left:1.2rem;color:#c8d1c8;font-family:Petrona,serif;font-size:4rem;line-height:1}.bird{display:grid;place-items:center;min-height:440px;background:repeating-linear-gradient(0deg,transparent 0 39px,rgba(24,58,48,.055) 39px 40px)}.callout{position:absolute;display:flex;align-items:center;gap:.5rem;color:var(--forest);font-size:.68rem;line-height:1.25}.callout i{display:block;width:72px;height:1px;background:var(--red)}.comb{top:26%;right:1rem}.frame{left:1.2rem;bottom:23%}.frame i{order:2}.specimen figcaption{display:flex;justify-content:space-between;padding:1rem 1.2rem;color:var(--forest);border-top:1px solid var(--rule);font-size:.68rem;letter-spacing:.08em}
	section:not(.hero){display:grid;grid-template-columns:minmax(230px,.55fr) minmax(470px,1fr);gap:clamp(2rem,8vw,7rem);padding:clamp(4rem,9vw,8rem) 0;border-top:1px solid var(--forest)}.section-title h2{max-width:14ch;margin-top:.8rem!important;font-family:Petrona,serif;font-size:clamp(2.1rem,3.5vw,3.1rem);font-weight:600;line-height:1.08;letter-spacing:-.03em;text-wrap:balance}.section-title p{max-width:39ch;margin-top:1rem;color:#53645d}
	.motion-plate{display:grid;grid-template-columns:repeat(4,1fr) 90px;align-items:end;border-top:1px solid var(--forest);border-left:1px solid var(--forest)}.motion-plate figure{border-right:1px solid var(--forest);border-bottom:1px solid var(--forest)}.motion-plate figure>span{display:block;padding:.35rem;color:var(--red);font-size:.62rem;font-weight:700}.motion-plate figure>div{display:grid;place-items:center;aspect-ratio:1;background:#fff}.motion-plate figcaption{padding:.35rem;text-align:right;color:#617068;font-size:.62rem}.cycle{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:190px;color:#fff;background:var(--forest)}.cycle b{font-family:Petrona,serif;font-size:2.4rem;line-height:1}.cycle span,.cycle small{font-size:.62rem}.cycle small{margin-top:.6rem;color:#b9cbc1}
	.notes ol{border-top:1px solid var(--forest)}.notes li{display:grid;grid-template-columns:50px 1fr auto;align-items:center;gap:1rem;padding:1rem .4rem;border-bottom:1px solid var(--rule)}.notes li b{color:var(--red);font-size:.7rem}.notes li p{max-width:62ch;font-size:.88rem}.notes li button{border:0;background:transparent;color:#74827b;font-size:1.1rem}
	.view-table{border-top:1px solid var(--forest)}.view-table>.head,.view-table>div{display:grid;grid-template-columns:135px 1fr 1fr;gap:1rem;align-items:center;padding:.9rem .4rem;border-bottom:1px solid var(--rule)}.view-table>.head{color:#67776f;font-size:.65rem;font-weight:700}.view-table strong{display:flex;align-items:center;gap:.7rem}.view-table kbd{display:grid;place-items:center;width:28px;height:28px;color:#fff;background:var(--forest);border-radius:50%;font:700 .68rem/1 Archivo,sans-serif}.view-table span,.view-table em{font-size:.84rem}.view-table em{color:#8b4c47;font-style:normal}
	.ledger{border-top:1px solid var(--forest)}.ledger div{display:grid;grid-template-columns:46px 1fr 1fr;gap:1rem;padding:1rem .4rem;border-bottom:1px solid var(--rule)}.ledger b{color:var(--red)}.ledger span{font-family:'Courier Prime',monospace;font-size:.82rem}.ledger small{color:#5c6d64}
	footer{display:flex;align-items:center;gap:1.5rem;padding:3rem 0 9rem;border-top:1px solid var(--forest)}footer strong{font-family:Petrona,serif;font-size:1.1rem}footer p{margin-right:auto!important;color:#5c6d64;font-size:.72rem}
	@media(max-width:850px){.hero,section:not(.hero){grid-template-columns:1fr}.hero{min-height:0}.specimen{margin-top:1rem}}
	@media(max-width:620px){header nav,.mark span{display:none}.specimen{min-height:400px}.bird{min-height:330px}.callout{display:none}.motion-plate{grid-template-columns:repeat(4,1fr)}.cycle{grid-column:1/-1;min-height:78px}.view-table>.head{display:none}.view-table>div{grid-template-columns:1fr}.ledger div{grid-template-columns:38px 1fr}.ledger small{grid-column:2}footer{flex-wrap:wrap}footer p{width:100%}}
</style>
