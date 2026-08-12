<script lang="ts">
	import { onMount } from 'svelte';

	let {
		playing = false,
		scale = 4,
		frameMs = 125,
		onready
	}: {
		playing?: boolean;
		scale?: number;
		frameMs?: number;
		onready?: (frameCount: number) => void;
	} = $props();
	let frame = $state(0);
	let frameSize = $state(16);
	let frameCount = $state(1);

	onMount(() => {
		const image = new Image();
		image.onload = () => {
			if (image.naturalHeight === 0 || image.naturalWidth % image.naturalHeight !== 0) return;
			frameSize = image.naturalHeight;
			frameCount = image.naturalWidth / image.naturalHeight;
			frame = 0;
			onready?.(frameCount);
		};
		image.src = '/assets/chicken-walk.png';
	});

	$effect(() => {
		if (!playing) {
			frame = 0;
			return;
		}
		const timer = setInterval(() => (frame = (frame + 1) % frameCount), frameMs);
		return () => clearInterval(timer);
	});
</script>

<span
	class="sprite"
	role="img"
	aria-label={`${frameCount}-frame white chicken walk cycle, drawn in Doodle-Do`}
	style={`width:${frameSize * scale}px;height:${frameSize * scale}px;background-size:${frameSize * frameCount * scale}px ${frameSize * scale}px;background-position:${-frameSize * scale * frame}px 0`}
></span>

<style>
	.sprite {
		display: block;
		background-image: url('/assets/chicken-walk.png');
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}
</style>
