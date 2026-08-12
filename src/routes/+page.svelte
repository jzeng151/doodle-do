<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadAutosave } from '$lib/io/autosave';
	import { PRODUCT_CONTENT } from '$lib/content/product';
	import AppStyles from '$lib/AppStyles.svelte';
	import Landing from '$lib/landing/Landing.svelte';

	let ready = $state(false);
	let hasAutosave = $state(false);

	onMount(() => {
		if (location.hash === '#editor') {
			void goto('/canvas', { replaceState: true });
			return;
		}
		loadAutosave().then((saved) => {
			hasAutosave = Boolean(saved);
			ready = true;
		});
	});
</script>

<svelte:head>
	<title>Doodle-Do | Frame-by-frame pixel animation</title>
	<meta name="description" content={PRODUCT_CONTENT.description} />
</svelte:head>

<AppStyles />
<Landing {ready} resume={hasAutosave} onStart={() => void goto('/canvas')} />
