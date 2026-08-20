import { describe, expect, it, vi } from 'vitest';
import { createDoc } from '../core/document';
import { LoopPlayer, nextLoopFrame } from './loop';

describe('nextLoopFrame (playback range)', () => {
	it('advances within the range and wraps from end to start', () => {
		expect(nextLoopFrame(1, 1, 3)).toBe(2);
		expect(nextLoopFrame(2, 1, 3)).toBe(3);
		expect(nextLoopFrame(3, 1, 3)).toBe(1);
	});

	it('snaps a frame outside the range to the start', () => {
		expect(nextLoopFrame(0, 2, 3)).toBe(2);
		expect(nextLoopFrame(5, 1, 3)).toBe(1);
	});

	it('holds still on a single-frame range', () => {
		expect(nextLoopFrame(2, 2, 2)).toBe(2);
	});
});

describe('LoopPlayer playback speed', () => {
	it('scales elapsed playback time', () => {
		let tick: FrameRequestCallback = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			tick = callback;
			return 1;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const target = {
			width: 1,
			height: 1,
			getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() })
		} as unknown as HTMLCanvasElement;
		const compositor = { frameCanvas: () => ({}) } as never;
		const doc = createDoc({ width: 1, height: 1, fps: 10, palette: ['#000000'] });
		const player = new LoopPlayer(doc, compositor, target, undefined, undefined, () => 0.25);

		player.start();
		tick(399);
		expect(player.currentFrame).toBe(0);
		tick(400);
		expect(player.currentFrame).toBe(1);

		player.stop();
		now.mockRestore();
		vi.unstubAllGlobals();
	});

	it('starts reverse playback at the range end and completes finite repeats', () => {
		let tick: FrameRequestCallback = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => ((tick = callback), 1));
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const target = { width: 1, height: 1, getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() }) } as unknown as HTMLCanvasElement;
		const doc = createDoc({ width: 1, height: 1, fps: 10, palette: ['#000000'], frameCount: 3 });
		const complete = vi.fn();
		const player = new LoopPlayer(doc, { frameCanvas: () => ({}) } as never, target, undefined, undefined, undefined, () => 'reverse', () => 1, complete);
		player.start();
		expect(player.currentFrame).toBe(2);
		tick(100); tick(200); tick(300);
		expect(player.currentFrame).toBe(0);
		expect(complete).toHaveBeenCalledOnce();
		now.mockRestore();
		vi.unstubAllGlobals();
	});

	it('does not hold the first frame twice between ping-pong cycles', () => {
		let tick: FrameRequestCallback = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => ((tick = callback), 1));
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const target = { width: 1, height: 1, getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() }) } as unknown as HTMLCanvasElement;
		const doc = createDoc({ width: 1, height: 1, fps: 10, palette: ['#000000'], frameCount: 3 });
		const player = new LoopPlayer(doc, { frameCanvas: () => ({}) } as never, target, undefined, undefined, undefined, () => 'ping-pong', () => 2);
		player.start();
		for (let time = 100; time <= 500; time += 100) tick(time);
		expect(player.currentFrame).toBe(1);
		player.stop();
		now.mockRestore();
		vi.unstubAllGlobals();
	});

	it('restarts ping-pong forward after seeking', () => {
		let tick: FrameRequestCallback = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => ((tick = callback), 1));
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const target = { width: 1, height: 1, getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() }) } as unknown as HTMLCanvasElement;
		const doc = createDoc({ width: 1, height: 1, fps: 10, palette: ['#000000'], frameCount: 3 });
		const complete = vi.fn();
		const player = new LoopPlayer(doc, { frameCanvas: () => ({}) } as never, target, undefined, undefined, undefined, () => 'ping-pong', () => 1, complete);
		player.start();
		tick(100); tick(200); tick(300);
		player.stop();
		player.seek(0);
		player.start();
		tick(100);
		expect(player.currentFrame).toBe(1);
		expect(complete).not.toHaveBeenCalled();
		now.mockRestore();
		vi.unstubAllGlobals();
	});

	it('clamps a deleted sought frame before reading its duration', () => {
		let tick: FrameRequestCallback = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => ((tick = callback), 1));
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const target = { width: 1, height: 1, getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() }) } as unknown as HTMLCanvasElement;
		const doc = createDoc({ width: 1, height: 1, fps: 10, palette: ['#000000'], frameCount: 4 });
		const player = new LoopPlayer(doc, { frameCanvas: () => ({}) } as never, target, undefined, () => ({ start: 0, end: 1 }));
		player.start();
		player.seek(3);
		doc.frames.pop();
		expect(() => tick(1)).not.toThrow();
		expect(player.currentFrame).toBe(0);
		player.stop();
		now.mockRestore();
		vi.unstubAllGlobals();
	});

	it('notifies listeners when playback clamps a sought frame into range', () => {
		let tick: FrameRequestCallback = () => {};
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => ((tick = callback), 1));
		vi.stubGlobal('cancelAnimationFrame', () => {});
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const target = { width: 1, height: 1, getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() }) } as unknown as HTMLCanvasElement;
		const doc = createDoc({ width: 1, height: 1, fps: 10, palette: ['#000000'], frameCount: 3 });
		const onFrame = vi.fn();
		const player = new LoopPlayer(doc, { frameCanvas: () => ({}) } as never, target, onFrame, () => ({ start: 1, end: 1 }));
		player.start();
		player.seek(2);
		onFrame.mockClear();
		tick(1);
		expect(player.currentFrame).toBe(1);
		expect(onFrame).toHaveBeenCalledWith(1);
		player.stop();
		now.mockRestore();
		vi.unstubAllGlobals();
	});

	it('reseeks paused playback when its range changes', () => {
		const target = { width: 1, height: 1, getContext: () => ({ imageSmoothingEnabled: false, clearRect: vi.fn(), drawImage: vi.fn() }) } as unknown as HTMLCanvasElement;
		const doc = createDoc({ width: 1, height: 1, palette: ['#000000'], frameCount: 3 });
		let range = { start: 0, end: 0 };
		const player = new LoopPlayer(doc, { frameCanvas: () => ({}) } as never, target, undefined, () => range);
		player.blit();
		range = { start: 2, end: 2 };
		player.blit();
		expect(player.currentFrame).toBe(2);
	});
});
