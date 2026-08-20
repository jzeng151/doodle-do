// Sprite sheet export (§4.6, decided): PNG + TexturePacker JSON-hash as the
// primary schema (Phaser loads it natively; Godot/Unity have importers),
// plus a simpler doodledo.json for hand-rolled engines. Layout and metadata
// are pure functions; only renderSheet touches canvas.

import { frameDurationMs, type Doc } from '../../core/document';
import type { Compositor } from '../../render/compositor';

export interface SheetRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface SheetLayout {
	columns: number;
	rows: number;
	width: number;
	height: number;
	rects: SheetRect[];
}

export function sheetLayout(frameCount: number, frameW: number, frameH: number): SheetLayout {
	const columns = frameCount;
	const rows = 1;
	const rects: SheetRect[] = [];
	for (let i = 0; i < frameCount; i++) {
		rects.push({
			x: i * frameW,
			y: 0,
			w: frameW,
			h: frameH
		});
	}
	return { columns, rows, width: columns * frameW, height: rows * frameH, rects };
}

// TexturePacker JSON-hash. Field-for-field the shape Phaser's atlas loader
// and Godot/Unity importer pipelines expect.
export function texturePackerJson(doc: Doc, layout: SheetLayout, imageName: string): string {
	const frames: Record<string, unknown> = {};
	layout.rects.forEach((rect, i) => {
		frames[`frame-${i}`] = {
			frame: rect,
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: rect.w, h: rect.h },
			sourceSize: { w: rect.w, h: rect.h }
		};
	});
	return JSON.stringify(
		{
			frames,
			meta: {
				app: 'Doodle-Do',
				version: '1.0',
				image: imageName,
				format: 'RGBA8888',
				size: { w: layout.width, h: layout.height },
				scale: '1',
				...(doc.meta.tags?.length && {
					frameTags: doc.meta.tags.map(({ repeats, ...tag }) => ({
						...tag,
						direction: tag.direction === 'ping-pong' ? 'pingpong' : tag.direction,
						repeat: repeats
					}))
				})
			}
		},
		null,
		'\t'
	);
}

// The simpler companion schema (documented publicly).
export function doodledoJson(doc: Doc, layout: SheetLayout, imageName: string): string {
	return JSON.stringify(
		{
			format: 'doodledo-sheet',
			version: 1,
			image: imageName,
			frameSize: { w: doc.meta.width, h: doc.meta.height },
			fps: doc.meta.fps,
			...(doc.meta.tags?.length && { animations: doc.meta.tags }),
			frames: layout.rects.map((rect, i) => ({
				...rect,
				durationMs: Math.round(frameDurationMs(doc, i))
			})),
			...(doc.meta.tags?.length && { animations: doc.meta.tags })
		},
		null,
		'\t'
	);
}

export async function renderSheet(
	doc: Doc,
	compositor: Compositor,
	layout: SheetLayout
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = layout.width;
	canvas.height = layout.height;
	const ctx = canvas.getContext('2d')!;
	layout.rects.forEach((rect, i) => {
		ctx.drawImage(compositor.frameCanvas(i), rect.x, rect.y);
	});
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encode failed'))), 'image/png');
	});
}
