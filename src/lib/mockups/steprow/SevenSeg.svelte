<script lang="ts">
	// Seven-segment readout, drawn rather than fonted: an LED display shows its
	// unlit segments faintly, and no typeface reproduces that.
	let {
		value,
		color = '#ff3b30',
		height = 44,
		pad = 0
	}: { value: string | number; color?: string; height?: number; pad?: number } = $props();

	const SEG: Record<string, [number, number, number, number]> = {
		a: [2.2, 0.4, 7.6, 2.6],
		g: [2.2, 9.7, 7.6, 2.6],
		d: [2.2, 19.0, 7.6, 2.6],
		f: [0.4, 2.2, 2.6, 8.3],
		b: [9.0, 2.2, 2.6, 8.3],
		e: [0.4, 11.5, 2.6, 8.3],
		c: [9.0, 11.5, 2.6, 8.3]
	};
	const DIGITS: Record<string, string> = {
		'0': 'abcdef',
		'1': 'bc',
		'2': 'abged',
		'3': 'abgcd',
		'4': 'fgbc',
		'5': 'afgcd',
		'6': 'afgedc',
		'7': 'abc',
		'8': 'abcdefg',
		'9': 'abfgcd',
		'-': 'g',
		' ': ''
	};

	const chars = $derived(String(value).padStart(pad, ' ').split(''));
	const glyphs = $derived(chars.filter((c) => c !== '.'));
	// 12 wide + 3 gutter per digit, plus 5 per decimal point
	const width = $derived(glyphs.length * 15 - 3 + (chars.length - glyphs.length) * 5);
</script>

<svg
	viewBox="0 0 {width} 22"
	{height}
	width={(width / 22) * height}
	role="img"
	aria-label={String(value)}
	style="--lit: {color}"
>
	{#each chars as ch, i (i)}
		{@const prior = chars.slice(0, i)}
		{@const x = prior.filter((c) => c !== '.').length * 15 + prior.filter((c) => c === '.').length * 5}
		{#if ch === '.'}
			<rect {x} y="19.0" width="2.6" height="2.6" rx="0.6" class="on" />
		{:else}
			{@const on = DIGITS[ch] ?? ''}
			<g transform="translate({x} 0)">
				{#each Object.entries(SEG) as [id, [sx, sy, w, h]] (id)}
					<rect
						x={sx}
						y={sy}
						width={w}
						height={h}
						rx="0.7"
						class={on.includes(id) ? 'on' : 'off'}
					/>
				{/each}
			</g>
		{/if}
	{/each}
</svg>

<style>
	svg {
		display: block;
		overflow: visible;
	}
	.on {
		fill: var(--lit);
		filter: drop-shadow(0 0 3px color-mix(in srgb, var(--lit) 70%, transparent));
	}
	.off {
		fill: var(--lit);
		opacity: 0.09;
	}
</style>
