declare module 'gifenc' {
	export interface WriteFrameOpts {
		palette?: number[][];
		delay?: number; // ms
		transparent?: boolean;
		transparentIndex?: number;
		dispose?: number;
		repeat?: number;
		colorDepth?: number;
		first?: boolean;
	}
	export interface Encoder {
		writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOpts): void;
		finish(): void;
		bytes(): Uint8Array;
		bytesView(): Uint8Array;
		reset(): void;
	}
	export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): Encoder;
	export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): number[][];
	export function applyPalette(
		rgba: Uint8Array | Uint8ClampedArray,
		palette: number[][]
	): Uint8Array;
	export function nearestColorIndex(palette: number[][], pixel: number[]): number;
}
