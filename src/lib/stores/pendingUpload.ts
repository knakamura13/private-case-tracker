/**
 * Module-level singleton that carries a File across a SvelteKit client-side
 * navigation.  The documents list page writes here before calling goto();
 * documents/new consumes it in onMount so the drop zone is pre-filled.
 */
let pendingFile: File | null = null;

export function setPendingUpload(file: File): void {
	pendingFile = file;
}

export function consumePendingUpload(): File | null {
	const f = pendingFile;
	pendingFile = null;
	return f;
}
