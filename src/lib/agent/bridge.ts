import { MAX_LAYERS, MAX_PALETTE, frameDurationMs } from '../core/document';
import { PixelDiffCommand } from '../core/commands';
import type { EditorSession } from '../editor/session.svelte';
import { floodFill } from '../tools/fill';
import { StrokeBuilder } from '../tools/pencil';

type Args = Record<string, unknown>;

function object(value: unknown): Args {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('args must be an object');
	return value as Args;
}

function integer(args: Args, key: string, min: number, max: number): number {
	const value = args[key];
	if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
		throw new Error(`${key} must be an integer from ${min} to ${max}`);
	}
	return value as number;
}

function number(args: Args, key: string, min: number, max: number, fallback: number): number {
	const value = args[key] ?? fallback;
	if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
		throw new Error(`${key} must be a number from ${min} to ${max}`);
	}
	return value;
}

function target(session: EditorSession, args: Args): { frame: number; layer: number } {
	const frame = integer(args, 'frame', 0, session.doc.frames.length - 1);
	const layer = integer(args, 'layer', 0, session.doc.frames[frame].layers.length - 1);
	const pixels = session.doc.frames[frame].layers[layer].pixels;
	if (session.doc.frames.some((candidate) => candidate.layers.some((item) => item !== session.doc.frames[frame].layers[layer] && item.pixels === pixels))) {
		throw new Error('target is a linked cel; unlink it before applying an agent edit');
	}
	return { frame, layer };
}

function editable(session: EditorSession, args: Args): void {
	const expected = integer(args, 'expectedVersion', 0, Number.MAX_SAFE_INTEGER);
	if (expected !== session.version) {
		throw new Error(`version conflict: expected ${expected}, current ${session.version}; read the document again`);
	}
	if (session.strokeActive || session.floating || session.hasSelection || session.selectionGestureActive) {
		throw new Error('finish the active user stroke or selection before applying an agent edit');
	}
}

function pixelValue(session: EditorSession, args: Args): number {
	return integer(args, 'value', 0, session.doc.palette.length);
}

function edited(session: EditorSession, extra: Args = {}): Args {
	return { version: session.version, ...extra };
}

export function executeAgentOperation(
	session: EditorSession,
	operation: string,
	rawArgs: unknown
): unknown {
	const args = object(rawArgs);
	const doc = session.doc;

	if (operation === 'get_document') {
		return {
			version: session.version,
			meta: { name: doc.meta.name, width: doc.meta.width, height: doc.meta.height, fps: doc.meta.fps, tags: doc.meta.tags ?? [] },
			palette: [{ value: 0, hex: null, name: 'transparent' }, ...doc.palette.map((hex, i) => ({ value: i + 1, hex }))],
			current: { frame: session.currentFrame, layer: session.currentLayer, mode: session.mode },
			editing: { strokeActive: session.strokeActive, hasSelection: session.hasSelection || session.selectionGestureActive },
			frames: doc.frames.map((frame, index) => ({
				index,
				durationMs: frameDurationMs(doc, index),
				overridesFps: frame.durationMs !== undefined,
				layers: frame.layers.map((layer, layerIndex) => ({
					index: layerIndex,
					name: layer.name,
					visible: layer.visible,
					linkId: layer.linkId ?? null
				}))
			})),
			history: { canUndo: session.bus.canUndo, canRedo: session.bus.canRedo }
		};
	}

	if (operation === 'get_frame') {
		const frame = integer(args, 'frame', 0, doc.frames.length - 1);
		const x = integer(args, 'x', 0, doc.meta.width - 1);
		const y = integer(args, 'y', 0, doc.meta.height - 1);
		const width = args.width === undefined ? doc.meta.width - x : integer(args, 'width', 1, doc.meta.width - x);
		const height = args.height === undefined ? doc.meta.height - y : integer(args, 'height', 1, doc.meta.height - y);
		const layers =
			args.layer === undefined
				? doc.frames[frame].layers.map((_, index) => index)
				: [integer(args, 'layer', 0, doc.frames[frame].layers.length - 1)];
		return {
			version: session.version,
			frame,
			region: { x, y, width, height },
			layers: layers.map((layerIndex) => {
				const layer = doc.frames[frame].layers[layerIndex];
				return {
					index: layerIndex,
					name: layer.name,
					visible: layer.visible,
					rows: Array.from({ length: height }, (_, row) =>
						Array.from(layer.pixels.subarray((y + row) * doc.meta.width + x, (y + row) * doc.meta.width + x + width))
					)
				};
			})
		};
	}

	editable(session, args);

	if (operation === 'draw_stroke') {
		const { frame, layer } = target(session, args);
		const value = pixelValue(session, args);
		const brushSize = integer(args, 'brushSize', 1, 4);
		if (typeof args.mirrorX !== 'boolean') throw new Error('mirrorX must be boolean');
		const mirrorY = args.mirrorY ?? false;
		if (typeof mirrorY !== 'boolean') throw new Error('mirrorY must be boolean');
		const mirrorAxisX = number(args, 'mirrorAxisX', 0, doc.meta.width - 1, (doc.meta.width - 1) / 2);
		const mirrorAxisY = number(args, 'mirrorAxisY', 0, doc.meta.height - 1, (doc.meta.height - 1) / 2);
		if (!Number.isInteger(mirrorAxisX * 2) || !Number.isInteger(mirrorAxisY * 2)) throw new Error('mirror axes must use half-pixel steps');
		if (!Array.isArray(args.points) || args.points.length < 1 || args.points.length > 2048) {
			throw new Error('points must contain 1 to 2048 coordinates');
		}
		const points = args.points.map((raw) => {
			const p = object(raw);
			return {
				x: integer(p, 'x', 0, doc.meta.width - 1),
				y: integer(p, 'y', 0, doc.meta.height - 1)
			};
		});
		const stroke = new StrokeBuilder(doc, frame, layer, value, brushSize, args.mirrorX, undefined, false, undefined, 0, mirrorAxisX, mirrorY, mirrorAxisY);
		stroke.begin(points[0].x, points[0].y);
		for (const point of points.slice(1)) stroke.moveTo(point.x, point.y);
		const command = stroke.end();
		if (command) session.bus.dispatch(command, { applied: true });
		session.currentFrame = frame;
		session.currentLayer = layer;
		return edited(session, { changedPixels: command?.pixelCount ?? 0 });
	}

	if (operation === 'apply_pixel_patch') {
		const { frame, layer } = target(session, args);
		if (!Array.isArray(args.edits) || args.edits.length < 1 || args.edits.length > doc.meta.width * doc.meta.height) {
			throw new Error(`edits must contain 1 to ${doc.meta.width * doc.meta.height} pixels`);
		}
		const changes = new Map<number, number>();
		for (const raw of args.edits) {
			const edit = object(raw);
			const x = integer(edit, 'x', 0, doc.meta.width - 1);
			const y = integer(edit, 'y', 0, doc.meta.height - 1);
			changes.set(y * doc.meta.width + x, pixelValue(session, edit));
		}
		const pixels = doc.frames[frame].layers[layer].pixels;
		const entries = [...changes].filter(([index, value]) => pixels[index] !== value);
		if (entries.length) {
			session.bus.dispatch(
				new PixelDiffCommand(
					'agent-pixel-patch',
					frame,
					layer,
					new Uint32Array(entries.map(([index]) => index)),
					new Uint8Array(entries.map(([index]) => pixels[index])),
					new Uint8Array(entries.map(([, value]) => value)),
					doc.meta.width
				)
			);
		}
		session.currentFrame = frame;
		session.currentLayer = layer;
		return edited(session, { changedPixels: entries.length });
	}

	if (operation === 'flood_fill') {
		const { frame, layer } = target(session, args);
		const x = integer(args, 'x', 0, doc.meta.width - 1);
		const y = integer(args, 'y', 0, doc.meta.height - 1);
		const command = floodFill(doc, frame, layer, x, y, pixelValue(session, args));
		if (command) session.bus.dispatch(command);
		session.currentFrame = frame;
		session.currentLayer = layer;
		return edited(session, { changedPixels: command?.pixelCount ?? 0 });
	}

	if (operation === 'add_frame') {
		session.currentFrame = integer(args, 'afterFrame', 0, doc.frames.length - 1);
		if (typeof args.duplicate !== 'boolean') throw new Error('duplicate must be boolean');
		session.addFrame(args.duplicate);
		return edited(session, { frame: session.currentFrame });
	}

	if (operation === 'delete_frame') {
		if (doc.frames.length === 1) throw new Error('cannot delete the final frame');
		session.currentFrame = integer(args, 'frame', 0, doc.frames.length - 1);
		session.deleteFrame();
		return edited(session, { frame: session.currentFrame });
	}

	if (operation === 'set_frame_duration') {
		session.currentFrame = integer(args, 'frame', 0, doc.frames.length - 1);
		if (args.durationMs !== null) integer(args, 'durationMs', 20, Number.MAX_SAFE_INTEGER);
		session.setFrameDuration(args.durationMs === null ? undefined : (args.durationMs as number));
		return edited(session, { frame: session.currentFrame, durationMs: session.currentFrameDurationMs() });
	}

	if (operation === 'set_fps') {
		session.setFps(integer(args, 'fps', 1, 24));
		return edited(session, { fps: doc.meta.fps });
	}

	if (operation === 'add_palette_color') {
		if (session.paletteLocked) throw new Error('palette is locked');
		if (doc.palette.length >= MAX_PALETTE) throw new Error(`palette already has ${MAX_PALETTE} colors`);
		if (typeof args.hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(args.hex)) {
			throw new Error('hex must be #rrggbb');
		}
		session.addPaletteColor(args.hex.toLowerCase());
		return edited(session, { value: doc.palette.length, hex: doc.palette.at(-1) });
	}

	if (operation === 'add_layer') {
		const frame = integer(args, 'frame', 0, doc.frames.length - 1);
		if (doc.frames[frame].layers.length >= MAX_LAYERS) throw new Error(`frame already has ${MAX_LAYERS} layers`);
		session.currentFrame = frame;
		session.currentLayer = integer(args, 'afterLayer', 0, doc.frames[frame].layers.length - 1);
		session.addLayer();
		return edited(session, { frame, layer: session.currentLayer });
	}

	if (operation === 'undo' || operation === 'redo') {
		const available = operation === 'undo' ? session.bus.canUndo : session.bus.canRedo;
		if (!available) throw new Error(`nothing to ${operation}`);
		session[operation]();
		return edited(session);
	}

	throw new Error(`unsupported agent operation: ${operation}`);
}

const STORAGE_KEY = 'doodle-do-mcp-bridge';

export function connectAgentBridge(getSession: () => EditorSession | null): () => void {
	const page = new URL(window.location.href);
	const suppliedToken = page.searchParams.get('mcp');
	const suppliedPort = page.searchParams.get('mcpPort');
	if (suppliedToken) {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: suppliedToken, port: suppliedPort ?? '43120' }));
		page.searchParams.delete('mcp');
		page.searchParams.delete('mcpPort');
		history.replaceState(history.state, '', page);
	}

	let saved: unknown;
	try {
		saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
	} catch {
		sessionStorage.removeItem(STORAGE_KEY);
		return () => {};
	}
	if (!saved || typeof saved !== 'object') return () => {};
	const config = saved as Args;
	if (typeof config.token !== 'string' || !/^\d{1,5}$/.test(String(config.port))) return () => {};
	const port = Number(config.port);
	if (port < 1 || port > 65535) return () => {};
	const base = `http://127.0.0.1:${port}`;
	const token = encodeURIComponent(config.token);
	const events = new EventSource(`${base}/events?token=${token}`);
	let queue = Promise.resolve();

	events.addEventListener('operation', (event) => {
		queue = queue.then(async () => {
			let request: Args;
			try {
				request = object(JSON.parse((event as MessageEvent<string>).data));
				if (request.protocolVersion !== 1) throw new Error('unsupported bridge protocol version');
				if (typeof request.id !== 'string' || typeof request.operation !== 'string') {
					throw new Error('invalid bridge request');
				}
				const session = getSession();
				if (!session) throw new Error('Doodle-Do has no open document');
				const result = executeAgentOperation(session, request.operation, request.args);
				await fetch(`${base}/result?token=${token}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: request.id, ok: true, result })
				});
			} catch (error) {
				if (request! && typeof request.id === 'string') {
					await fetch(`${base}/result?token=${token}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							id: request.id,
							ok: false,
							error: error instanceof Error ? error.message : String(error)
						})
					});
				}
			}
		});
	});

	return () => events.close();
}
