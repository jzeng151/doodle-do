<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, updated, children }: { title: string; updated: string; children: Snippet } = $props();
</script>

<svelte:head><title>{title} | Doodle-Do</title></svelte:head>

<a class="skip" href="#legal-content">Skip to content</a>
<header>
	<a class="home" href="/"><img src="/assets/chicken-standing.png" alt="" />Doodle-Do</a>
	<a href="/canvas">Open the editor</a>
</header>
<main id="legal-content">
	<p class="label">Last updated {updated}</p>
	<h1>{title}</h1>
	<article>{@render children()}</article>
</main>

<style>
	.skip{position:fixed;top:.5rem;left:.5rem;z-index:2;padding:.6rem .8rem;background:var(--ink);color:var(--paper);transform:translateY(-150%)}.skip:focus{transform:none}
	header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem clamp(1rem,4vw,3rem);border-bottom:4px solid var(--ink)}header a{color:inherit;font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.home{display:flex;align-items:center;gap:.65rem;font-size:1.25rem;text-decoration:none}.home img{width:32px;height:32px;image-rendering:pixelated}
	main{width:min(760px,calc(100% - 2rem));margin:clamp(3rem,8vw,6rem) auto 6rem}.label{font-size:.6875rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}h1{margin:.35rem 0 2rem;font-size:clamp(2.5rem,8vw,5rem);line-height:1;letter-spacing:-.04em;text-wrap:balance}article{font-size:1rem;line-height:1.65}article :global(h2){margin:2.5rem 0 .6rem;padding-top:1rem;border-top:2px solid var(--ink);font-size:1.25rem;line-height:1.2}article :global(p),article :global(li){max-width:68ch}article :global(li+li){margin-top:.45rem}article :global(a){color:inherit;font-weight:700}
</style>
