<script lang="ts">
	import { onMount } from 'svelte';
	import { runBench, type BenchResults } from '../../../bench/scenario';

	let results = $state<BenchResults | null>(null);

	onMount(() => {
		// let the page settle so startup work doesn't pollute samples
		requestAnimationFrame(() =>
			requestAnimationFrame(async () => {
				results = await runBench();
				(window as unknown as { __doodleBench: BenchResults }).__doodleBench = results;
			})
		);
	});
</script>

<svelte:head>
	<title>Doodle-Do performance benchmark</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<h1>Doodle-Do bench</h1>
	{#if results}
		<p class="gate" class:pass={results.gate.passed} role="status" aria-live="polite">
			Gate (stroke→loop p95 &lt; {results.gate.limitMs}ms):
			{results.gate.passed ? 'PASS' : 'FAIL'}
		</p>
		<pre>{JSON.stringify(results, null, 2)}</pre>
	{:else}
		<p role="status" aria-live="polite">Running benchmark…</p>
	{/if}
</main>

<style>
	main {
		font-family: monospace;
		padding: 1rem;
	}
	.gate {
		font-weight: bold;
		color: #b00;
	}
	.gate.pass {
		color: #080;
	}
</style>
