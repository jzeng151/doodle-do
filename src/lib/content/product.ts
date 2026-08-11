import { TIPS } from '$lib/learn/tips';

export const PRODUCT_CONTENT = {
	name: 'Doodle-Do',
	tagline: 'Draw a frame. Watch it loop.',
	description:
		'Draw frame-by-frame pixel animations in your browser. Watch edits appear in the loop, get tips as you work, and export sprite sheets, GIFs, or individual frames.',
	localPromise: ['No account', 'No upload', 'Works offline after the first load'],
	example: {
		name: 'White chicken walk',
		frames: 4,
		fps: 8,
		frameMs: 125,
		note: "Example artwork drawn with Doodle-Do's 16-color starter palette."
	},
	modes: [
		{
			id: 'focus',
			label: 'Focus',
			great: 'Drawing one frame with onion skin for context.',
			strains: 'Comparing several frames.'
		},
		{
			id: 'grid',
			label: 'Grid',
			great: 'Editing frames side by side.',
			strains: 'Fine detail on one frame.'
		},
		{
			id: 'loop',
			label: 'Loop',
			great: 'Watching the animation at full speed.',
			strains: 'Drawing. Switch back to Focus or Grid.'
		}
	],
	tips: ['T02', 'T09', 'T15'].map((id) => TIPS[id]),
	outputs: [
		['Sprite sheet', 'PNG + TexturePacker JSON-hash + doodledo.json'],
		['Animated preview', 'GIF with per-frame timing'],
		['Individual frames', 'One PNG per frame, bundled as ZIP'],
		['Project file', '.doodledo file you can save and reopen']
	],
	capabilities: [
		'Pencil, eraser, fill, eyedropper, rectangle, lasso, wand, and polygon tools',
		'Onion skin, mirror drawing, layers, bulk frame edits, full undo and redo',
		'Palette locking and editing, up to 64 colors, with 1-bit transparency',
		'Imports .doodledo projects and horizontal strip PNGs with optional timing data'
	]
} as const;

export type ProductMode = (typeof PRODUCT_CONTENT.modes)[number];
