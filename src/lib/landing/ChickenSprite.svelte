<script lang="ts">
	import { onMount } from 'svelte';

	let {
		playing = false,
		src = '/assets/chicken-walk.png',
		label = 'white chicken walk cycle, drawn in Doodle-Do',
		scale = 4,
		frameMs = 125,
		frameIndex,
		onready
	}: {
		playing?: boolean;
		src?: string;
		label?: string;
		scale?: number;
		frameMs?: number;
		frameIndex?: number;
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
		image.src = src;
	});

	$effect(() => {
		if (frameIndex !== undefined) return;
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
	aria-label={`${frameCount}-frame ${label}`}
	style={`background-image:url("${src}");width:${frameSize * scale}px;height:${frameSize * scale}px;background-size:${frameSize * frameCount * scale}px ${frameSize * scale}px;background-position:${-frameSize * scale * ((frameIndex ?? frame) % frameCount)}px 0`}
></span>

<style>
	.sprite {
		display: block;
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}
</style>
