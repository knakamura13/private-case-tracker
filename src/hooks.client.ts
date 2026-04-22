import type { HandleClientError } from '@sveltejs/kit';
import { showErrorToast } from '$lib/stores/errorToast';

export const handleError: HandleClientError = async ({ error, event, message }) => {
	const err = error instanceof Error ? error : new Error(String(error));

	// Best-effort: persist client-side failures for later diagnosis.
	try {
		await fetch('/api/errors/client', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				message: err.message || message,
				stack: err.stack,
				url: event.url?.toString?.() ?? String(event.url),
				userAgent: navigator.userAgent
			})
		});
	} catch {
		// ignore
	}

	showErrorToast({ message: err.message || message, stack: err.stack });
	return { message: err.message || message };
};
