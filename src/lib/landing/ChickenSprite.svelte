<script lang="ts">
	let { playing = false, scale = 4 }: { playing?: boolean; scale?: number } = $props();
	let frame = $state(0);

	$effect(() => {
		if (!playing) {
			frame = 0;
			return;
		}
		const timer = setInterval(() => (frame = (frame + 1) % 4), 125);
		return () => clearInterval(timer);
	});
</script>

<span
	class="sprite"
	role="img"
	aria-label="Four-frame white chicken walk cycle, drawn in Doodle-Do"
	style={`width:${16 * scale}px;height:${16 * scale}px;background-size:${64 * scale}px ${16 * scale}px;background-position:${-16 * scale * frame}px 0`}
></span>

<style>
	.sprite {
		display: block;
		background-image: url('/assets/chicken-walk.png');
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}
</style>
