<script lang="ts">
	// Design decision harness. Each theme is a complete, self-contained visual
	// world rendered over two surfaces: the marketing page (Persuade) and the
	// Focus-mode editor shell (Operate). Nothing here is wired to the real
	// EditorSession — these are mockups, and the artwork in them is synthetic.
	import { onMount, type Component } from 'svelte';

	import StepRowLanding from '$lib/mockups/steprow/Landing.svelte';
	import StepRowEditor from '$lib/mockups/steprow/Editor.svelte';
	import XSheetLanding from '$lib/mockups/xsheet/Landing.svelte';
	import XSheetEditor from '$lib/mockups/xsheet/Editor.svelte';
	import ToneLanding from '$lib/mockups/tone/Landing.svelte';
	import ToneEditor from '$lib/mockups/tone/Editor.svelte';
	import SheetLanding from '$lib/mockups/datasheet/Landing.svelte';
	import SheetEditor from '$lib/mockups/datasheet/Editor.svelte';
	import LigneLanding from '$lib/mockups/ligne/Landing.svelte';
	import LigneEditor from '$lib/mockups/ligne/Editor.svelte';
	import DensityLanding from '$lib/mockups/density/Landing.svelte';
	import DensityEditor from '$lib/mockups/density/Editor.svelte';
	import TypeCaseLanding from '$lib/mockups/typecase/Landing.svelte';
	import TypeCaseEditor from '$lib/mockups/typecase/Editor.svelte';
	import AlbersLanding from '$lib/mockups/albers/Landing.svelte';
	import AlbersEditor from '$lib/mockups/albers/Editor.svelte';
	import DarkroomLanding from '$lib/mockups/darkroom/Landing.svelte';
	import DarkroomEditor from '$lib/mockups/darkroom/Editor.svelte';
	import QuizLanding from '$lib/mockups/quiz/Landing.svelte';
	import QuizEditor from '$lib/mockups/quiz/Editor.svelte';
	import StudioLanding from '$lib/mockups/studio/Landing.svelte';
	import StudioEditor from '$lib/mockups/studio/Editor.svelte';
	import LightTableLanding from '$lib/mockups/lighttable/Landing.svelte';
	import LightTableEditor from '$lib/mockups/lighttable/Editor.svelte';
	import CartonLanding from '$lib/mockups/carton/Landing.svelte';
	import CartonEditor from '$lib/mockups/carton/Editor.svelte';
	import FieldGuideLanding from '$lib/mockups/fieldguide/Landing.svelte';
	import FieldGuideEditor from '$lib/mockups/fieldguide/Editor.svelte';
	import EnamelLanding from '$lib/mockups/enamel/Landing.svelte';
	import EnamelEditor from '$lib/mockups/enamel/Editor.svelte';
	import CoopPlanLanding from '$lib/mockups/coopplan/Landing.svelte';
	import CoopPlanEditor from '$lib/mockups/coopplan/Editor.svelte';
	import CartridgeLanding from '$lib/mockups/cartridge/Landing.svelte';
	import CartridgeEditor from '$lib/mockups/cartridge/Editor.svelte';
	import StitchLanding from '$lib/mockups/stitch/Landing.svelte';
	import StitchEditor from '$lib/mockups/stitch/Editor.svelte';
	import StageLanding from '$lib/mockups/stage/Landing.svelte';
	import StageEditor from '$lib/mockups/stage/Editor.svelte';
	import StoryboardLanding from '$lib/mockups/storyboard/Landing.svelte';
	import StoryboardEditor from '$lib/mockups/storyboard/Editor.svelte';
	import ModeRoomsLanding from '$lib/mockups/moderooms/Landing.svelte';
	import ModeRoomsEditor from '$lib/mockups/moderooms/Editor.svelte';
	import RisoLanding from '$lib/mockups/riso/Landing.svelte';
	import RisoEditor from '$lib/mockups/riso/Editor.svelte';
	import XeroxLanding from '$lib/mockups/xerox/Landing.svelte';
	import XeroxEditor from '$lib/mockups/xerox/Editor.svelte';

	type Theme = {
		id: string;
		name: string;
		world: string;
		chips: string[];
		landing: Component;
		editor: Component;
	};

	const THEMES: Theme[] = [
		{
			id: 'steprow',
			name: 'Step Row',
			world: 'Early-80s rhythm machine. Frames are steps, FPS is tempo, the chase light is the playhead.',
			chips: ['#171717', '#ff3b30', '#ffd600'],
			landing: StepRowLanding,
			editor: StepRowEditor
		},
		{
			id: 'xsheet',
			name: 'Exposure Sheet',
			world: "The animator's X-sheet. Ruled production paper, graphite, red camera marks.",
			chips: ['#e8e0cd', '#2b2721', '#c8352b'],
			landing: XSheetLanding,
			editor: XSheetEditor
		},
		{
			id: 'tone',
			name: 'Screentone',
			world: 'A weekly manga page. Black ink on newsprint, halftone as the only material.',
			chips: ['#f2efe6', '#8a8780', '#111111'],
			landing: ToneLanding,
			editor: ToneEditor
		},
		{
			id: 'datasheet',
			name: 'Datasheet',
			world: 'A component service manual. Cold gray, cyan rules, everything given a part number.',
			chips: ['#dfe3e6', '#12181c', '#00a3b4'],
			landing: SheetLanding,
			editor: SheetEditor
		},
		{
			id: 'ligne',
			name: 'Ligne Claire',
			world: 'A clear-line adventure album. Flat unshadowed fills held by one unvarying black line.',
			chips: ['#8cc4e8', '#f2cf5b', '#d8352a'],
			landing: LigneLanding,
			editor: LigneEditor
		},
		{
			id: 'density',
			name: 'High Density',
			world: 'A Japanese high-density site. Ruled modules, red header tabs, tiny type, nothing wasted.',
			chips: ['#ffffff', '#e60012', '#111111'],
			landing: DensityLanding,
			editor: DensityEditor
		},
		{
			id: 'typecase',
			name: 'Type Case',
			world: 'A letterpress shop. Wood case, lead sorts locked in a chase, one spot ink.',
			chips: ['#a8783f', '#7b7f83', '#b8351f'],
			landing: TypeCaseLanding,
			editor: TypeCaseEditor
		},
		{
			id: 'albers',
			name: 'Colour Study',
			world: 'An interaction-of-colour plate. Flat unmixed fields, depth from relationship, no chrome.',
			chips: ['#e8e2d4', '#c8471f', '#2f5aa8'],
			landing: AlbersLanding,
			editor: AlbersEditor
		},
		{
			id: 'darkroom',
			name: 'Darkroom',
			world: 'A printing bay under amber safelight. Frames on the drying line, timed baths, enamel trays.',
			chips: ['#1a1210', '#e08a2c', '#d8d4cc'],
			landing: DarkroomLanding,
			editor: DarkroomEditor
		},
		{
			id: 'quiz',
			name: 'Quiz Spread',
			world: 'A nineties teen-magazine spread. Halftone collage, hot pink and acid green, gel-pen marks.',
			chips: ['#f7f4ec', '#ff2d8a', '#b6e021'],
			landing: QuizLanding,
			editor: QuizEditor
		},
		{
			id: 'studio',
			name: 'Studio Utility',
			world: 'A quiet professional animation utility. Familiar controls, compact hierarchy, the artwork gets the colour.',
			chips: ['#f5f6f8', '#20242a', '#3659d9'],
			landing: StudioLanding,
			editor: StudioEditor
		},
		{
			id: 'lighttable',
			name: 'Light Table',
			world: 'An animator’s illuminated drawing table. Registration pegs, non-photo blue, cleanup red, stacked cels.',
			chips: ['#fbfcff', '#2f6fb0', '#dc4f4f'],
			landing: LightTableLanding,
			editor: LightTableEditor
		},
		{
			id: 'carton',
			name: 'Egg Carton',
			world: 'A moulded-pulp frame tray. Each drawing occupies a cell; the loop is the dozen seen as a sequence.',
			chips: ['#c8c4b7', '#f4f1e8', '#c53f32'],
			landing: CartonLanding,
			editor: CartonEditor
		},
		{
			id: 'fieldguide',
			name: 'Field Guide',
			world: 'A working naturalist’s guide. Specimen plates, observation notes, forest ink, and one comb-red index.',
			chips: ['#f4f5ef', '#183a30', '#b53c35'],
			landing: FieldGuideLanding,
			editor: FieldGuideEditor
		},
		{
			id: 'enamel',
			name: 'Enamel Bench',
			world: 'A white enamel workbench with cobalt rims, comb-red controls, and yellow inspection lamps.',
			chips: ['#f7f8f4', '#18577d', '#b9362f'],
			landing: EnamelLanding,
			editor: EnamelEditor
		},
		{
			id: 'coopplan',
			name: 'Coop Plan',
			world: 'A measured chicken-coop blueprint. Frames occupy bays; onion skins are revision marks; output is the build sheet.',
			chips: ['#124b69', '#f3f7f6', '#f05a4f'],
			landing: CoopPlanLanding,
			editor: CoopPlanEditor
		},
		{
			id: 'cartridge',
			name: 'Cartridge Kit',
			world: 'A printed game cartridge and developer manual. Indigo plastic, paper labels, contact pins, no neon arcade glow.',
			chips: ['#171a2b', '#4b55c7', '#d84642'],
			landing: CartridgeLanding,
			editor: CartridgeEditor
		},
		{
			id: 'stitch',
			name: 'Stitch Frame',
			world: 'An embroidery pattern desk. Pixels become counted stitches; frames sit in hoops; thread cards carry the palette.',
			chips: ['#f3f4ef', '#762d3b', '#2d5d67'],
			landing: StitchLanding,
			editor: StitchEditor
		},
		{
			id: 'stage',
			name: 'Center Stage',
			world: 'Canvas first. The artwork owns the room; navigation and teaching collapse into a caption rail and edge docks.',
			chips: ['#f2d64b', '#173b45', '#d8423f'],
			landing: StageLanding,
			editor: StageEditor
		},
		{
			id: 'storyboard',
			name: 'Storyboard Wall',
			world: 'The sequence is the product. Frames read left to right, notes attach to motion, and export is the final panel.',
			chips: ['#f4f0e8', '#24201d', '#df5a47'],
			landing: StoryboardLanding,
			editor: StoryboardEditor
		},
		{
			id: 'moderooms',
			name: 'Mode Rooms',
			world: 'Focus, Grid, and Loop become three different rooms. The active job changes the entire workspace topology.',
			chips: ['#f7f7f2', '#2345a0', '#ef4d40'],
			landing: ModeRoomsLanding,
			editor: ModeRoomsEditor
		},
		{
			id: 'riso',
			name: 'Riso Duplex',
			world: 'A two-ink risograph proof. Comb red and deep blue overlap, dots stay visible, and every frame reads like a print pass.',
			chips: ['#f2eddf', '#2254a3', '#e34435'],
			landing: RisoLanding,
			editor: RisoEditor
		},
		{
			id: 'xerox',
			name: 'Xerox Zine',
			world: 'A cut-and-paste photocopy zine. Hard black toner, crooked sheets, correction tape, and one stubborn comb-red stamp.',
			chips: ['#eeeeea', '#111111', '#d93b35'],
			landing: XeroxLanding,
			editor: XeroxEditor
		}
	];

	const SURFACES = [
		{ id: 'landing', name: 'Landing' },
		{ id: 'editor', name: 'Editor' }
	] as const;

	let themeId = $state(THEMES[0].id);
	let surface = $state<'landing' | 'editor'>('landing');
	let tabstrip: HTMLElement;

	const theme = $derived(THEMES.find((t) => t.id === themeId) ?? THEMES[0]);
	const View = $derived(surface === 'landing' ? theme.landing : theme.editor);
	const index = $derived(THEMES.findIndex((t) => t.id === theme.id) + 1);

	function readHash() {
		const [t, s] = location.hash.replace(/^#/, '').split('/');
		if (THEMES.some((x) => x.id === t)) themeId = t;
		if (s === 'landing' || s === 'editor') surface = s;
	}

	onMount(() => {
		readHash();
		addEventListener('hashchange', readHash);
		return () => removeEventListener('hashchange', readHash);
	});

	$effect(() => {
		const next = `#${themeId}/${surface}`;
		if (location.hash !== next) history.replaceState(null, '', next);
		tabstrip?.querySelector(`[data-theme="${themeId}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	});

	function step(by: number) {
		const i = THEMES.findIndex((t) => t.id === themeId);
		themeId = THEMES[(i + by + THEMES.length) % THEMES.length].id;
	}

	function onKey(e: KeyboardEvent) {
		if ((e.target as HTMLElement).matches('input, textarea, select')) return;
		if (e.key === 'ArrowRight') step(1);
		else if (e.key === 'ArrowLeft') step(-1);
		else if (e.key.toLowerCase() === 'v') surface = surface === 'landing' ? 'editor' : 'landing';
		else if (/^[0-9]$/.test(e.key)) {
			// 1-9 pick directly, 0 picks the tenth
			const n = e.key === '0' ? 10 : Number(e.key);
			if (n <= THEMES.length) themeId = THEMES[n - 1].id;
		}
	}
</script>

<svelte:head>
	<title>Doodle-Do design directions</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onkeydown={onKey} />

<header class="switcher">
	<div class="bar top">
		<span class="brand">DOODLE&#8209;DO <b>DESIGN DIRECTIONS</b></span>
		<span class="count">{index} of {THEMES.length}</span>
		<div class="spacer"></div>
		<div class="surfaces" role="group" aria-label="Surface">
			{#each SURFACES as s (s.id)}
				<button
					class:on={s.id === surface}
					aria-pressed={s.id === surface}
					onclick={() => (surface = s.id)}
				>
					{s.name}
				</button>
			{/each}
			<kbd>V</kbd>
		</div>
		<div class="stepper">
			<button onclick={() => step(-1)} aria-label="Previous direction">‹</button>
			<button onclick={() => step(1)} aria-label="Next direction">›</button>
		</div>
	</div>

	<nav class="bar tabs" aria-label="Design direction" bind:this={tabstrip}>
		{#each THEMES as t, i (t.id)}
			<button
				class="tab"
				data-theme={t.id}
				class:on={t.id === themeId}
				aria-current={t.id === themeId ? 'true' : undefined}
				title={t.world}
				onclick={() => (themeId = t.id)}
			>
				<span class="chips" aria-hidden="true">
					{#each t.chips as c (c)}<i style="background: {c}"></i>{/each}
				</span>
				<span class="name">{t.name}</span>
				<kbd>{i < 9 ? i + 1 : i === 9 ? 0 : '–'}</kbd>
			</button>
		{/each}
	</nav>

	<p class="world">{theme.world}</p>
</header>

<div class="surface">
	{#key themeId + surface}
		<View />
	{/key}
</div>

<style>
	.switcher {
		position: sticky;
		top: 0;
		z-index: 1000;
		background: #0b0b0d;
		border-bottom: 1px solid rgba(255, 255, 255, 0.16);
		font-family: ui-sans-serif, system-ui, sans-serif;
		color: #d6d6de;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
	}
	.bar.top {
		height: 40px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.09);
	}
	.brand {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: #6f6f7a;
		white-space: nowrap;
	}
	.brand b {
		color: #f2f2f5;
		font-weight: 700;
	}
	.count {
		font-size: 11px;
		color: #6f6f7a;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.spacer {
		flex: 1;
	}
	.surfaces,
	.stepper {
		display: flex;
		align-items: center;
		gap: 3px;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 6px 10px;
		font: inherit;
		font-size: 12px;
		color: #a9a9b4;
		white-space: nowrap;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
	}
	button:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
	}
	button.on {
		color: #fff;
		background: rgba(255, 255, 255, 0.13);
		border-color: rgba(255, 255, 255, 0.2);
	}
	button:focus-visible {
		outline: 2px solid #7aa2ff;
		outline-offset: 1px;
	}
	.stepper button {
		padding: 4px 9px;
		font-size: 15px;
		line-height: 1;
		border-color: rgba(255, 255, 255, 0.16);
	}

	/* the direction tabs: one row, scrollable rather than wrapping, so the
	   header height stays predictable for the sticky offsets below it */
	.tabs {
		height: 44px;
		gap: 2px;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}
	.tab {
		flex: none;
		padding: 6px 9px;
	}
	.tab.on {
		box-shadow: inset 0 -2px 0 #7aa2ff;
	}
	.chips {
		display: flex;
		border-radius: 3px;
		overflow: hidden;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.22);
	}
	.chips i {
		width: 7px;
		height: 14px;
	}
	.name {
		font-weight: 500;
	}
	kbd {
		font: inherit;
		font-size: 9px;
		letter-spacing: 0.06em;
		color: #75757e;
		padding: 2px 4px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 3px;
	}
	.world {
		margin: 0;
		padding: 5px 12px 6px;
		font-size: 11px;
		line-height: 1.4;
		color: #8a8a95;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	/* Each theme owns its own stacking context, so a theme's sticky header
	   scrolls under this one instead of fighting it for the top edge. */
	.surface {
		position: relative;
		z-index: 0;
		isolation: isolate;
	}

	@media (max-width: 700px) {
		.brand b {
			display: none;
		}
		.world {
			display: none;
		}
	}
</style>
