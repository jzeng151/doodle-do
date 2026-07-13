// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// File System Access API pickers (WICG, not yet in lib.dom)
	interface FilePickerType {
		description?: string;
		accept: Record<string, string[]>;
	}
	interface Window {
		showSaveFilePicker(opts?: {
			suggestedName?: string;
			types?: FilePickerType[];
		}): Promise<FileSystemFileHandle>;
		showOpenFilePicker(opts?: { types?: FilePickerType[] }): Promise<FileSystemFileHandle[]>;
	}
}

export {};
