// Demonstration artwork for the design mockups. SYNTHETIC: hand-authored
// here, not produced in the editor, and not shipped product content. Every
// color is a DEFAULT_PALETTE (DB16) index so the mockups stay honest about
// the 16-color starter palette and 1-bit alpha the real document model uses.
import { DEFAULT_PALETTE } from '$lib/core/palette';

export const PALETTE = DEFAULT_PALETTE;

export const SPRITE_W = 16;
export const SPRITE_H = 16;

// '.' is transparent; every other glyph maps to a 1-based palette index,
// matching EditorSession.colorValue.
const INK: Record<string, number> = {
	'.': 0,
	'1': 1, // #140c1c  outline
	'7': 7, // #d04648  comb, wattle
	s: 11, // #8595a1  feather shade
	f: 15, // #dad45e  beak, feet
	w: 16 // #deeed6  white feathers
};

// Four-frame chicken walk: contact, passing-up, opposite contact,
// passing-down. The 30-minute Phase 1 gate animation, drawn small.
const WALK_GRIDS: string[][] = [
	[
		'........77......',
		'.......777......',
		'.......1111.....',
		'......1www1f....',
		'.....11w1w1ff...',
		'....1wwwww17....',
		'...1wwwwwww1....',
		'11.1wwwwwwww1...',
		'1w11wwwwwwww1...',
		'.11swwwwwwww1...',
		'...1wwwwwww1....',
		'....11www11.....',
		'.....1f1.1f1....',
		'.....1f1.1f1....',
		'......fff.fff...',
		'................'
	],
	[
		'.......77.......',
		'......777.......',
		'......1111......',
		'.....1www1f.....',
		'....11w1w1ff....',
		'...1wwwww17.....',
		'..1wwwwwww1.....',
		'11.1wwwwwwww1...',
		'1w11wwwwwwww1...',
		'.11swwwwwwww1...',
		'...11wwwww11....',
		'......1f1.......',
		'......1f1.......',
		'.....1f1........',
		'......fff.......',
		'................'
	],
	[
		'........77......',
		'.......777......',
		'.......1111.....',
		'......1www1f....',
		'.....11w1w1ff...',
		'....1wwwww17....',
		'...1wwwwwww1....',
		'11.1wwwwwwww1...',
		'1w11wwsswwww1...',
		'.11wwwwsswww1...',
		'...1wwwwwww1....',
		'....11www11.....',
		'....1f1...1f1...',
		'....1f1...1f1...',
		'.....fff...fff..',
		'................'
	],
	[
		'................',
		'........77......',
		'.......777......',
		'.......1111.....',
		'......1www1f....',
		'.....11w1w1ff...',
		'....1wwwww17....',
		'...1wwwwwww1....',
		'11.1wwwwwwww1...',
		'1w11wwwwwwww1...',
		'.11swwwwwwww1...',
		'...1wwwwwww1....',
		'....11www11.....',
		'......1f1.......',
		'......1f1.......',
		'.......fff......'
	]
];

function expand(grid: string[]): Uint8Array {
	const px = new Uint8Array(SPRITE_W * SPRITE_H);
	for (let y = 0; y < SPRITE_H; y++) {
		const row = grid[y];
		for (let x = 0; x < SPRITE_W; x++) px[y * SPRITE_W + x] = INK[row[x]] ?? 0;
	}
	return px;
}

export const WALK: Uint8Array[] = WALK_GRIDS.map(expand);

/** Per-frame durations shown in the mockups, in ms. 8 FPS with a held contact. */
export const WALK_MS = [125, 125, 125, 125];

export function hexAt(value: number): string | null {
	return value === 0 ? null : (PALETTE[value - 1] ?? null);
}
