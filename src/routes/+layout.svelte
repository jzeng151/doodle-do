<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/assets/chicken-standing.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" />
</svelte:head>

{@render children()}
