<script lang="ts">
	let { children } = $props();

	// Emitted through {@html} rather than as a source comment: the Svelte
	// compiler strips comments from the production build, and a direction
	// contract the build erases is a contract nobody can audit.
	const CONTRACT = `<!--
THESIS: Doodle-Do is a machine whose loop never stops while you edit it, so the
surface is that machine, not a page about it. Refuses the dark-neon retro-gaming
hero and its predictable opposite, the calm SaaS screenshot-in-a-browser-frame.
OWN-WORLD: early-80s rhythm machine. Charcoal panel with fine grain, step keys
quartered red/orange/yellow/white, LEDs the only glow, silkscreen caps, seven-
segment readouts, real screws and a wood cheek.
STORY: the visitor sees a running pattern, understands frames are steps and FPS
is tempo, hits a key, and the loop changes under their hand.
FIRST VIEWPORT: full-bleed panel. Left third: silkscreen wordmark, the one-line
claim, START DRAWING as the primary key. Right two-thirds: the live step row,
four armed frame keys under a chase light, seven-segment FPS readout above.
FORM: candidate 6 of the challenger hand, fused; seed key 7f841c05.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;
</script>

{@html CONTRACT}

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Archivo:wdth,wght@100,400;100,500;100,600;100,700;125,800;125,900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Martian+Mono:wght@400;600;800&family=Barlow:wght@400;500;600&family=Grandstander:wght@600;700;800&family=Nunito+Sans:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700;900&family=Alfa+Slab+One&family=Petrona:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&family=Anton&family=Karla:wght@400;500;700&family=Lilita+One&family=Gochi+Hand&display=swap"
	/>
</svelte:head>

{@render children()}

<style>
	:global(html) {
		-webkit-text-size-adjust: 100%;
	}
	:global(body) {
		margin: 0;
	}
	:global(.mock *) {
		box-sizing: border-box;
	}
	/* the switcher is fixed at the bottom; every surface clears it. It wraps
	   to two rows under 720px, so the clearance nearly doubles there. */
	:global(.mock) {
		padding-bottom: 5.5rem;
	}
	@media (max-width: 720px) {
		:global(.mock) {
			padding-bottom: 11rem;
		}
	}
	:global(.mock h1, .mock h2, .mock h3, .mock h4, .mock p, .mock ul, .mock ol, .mock figure) {
		margin: 0;
	}
	:global(.mock ul, .mock ol) {
		padding: 0;
		list-style: none;
	}
	:global(.mock button) {
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
</style>
