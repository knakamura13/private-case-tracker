import { toast } from 'svelte-sonner';
import ErrorToastBody from '$lib/components/ErrorToastBody.svelte';

type ToastError = {
	status?: number;
	message: string;
	errorId?: string;
	requestId?: string;
	stack?: string;
};

export function showErrorToast(err: ToastError) {
	// Renders the shared ErrorDetails UI inside the toast.
	toast.custom(ErrorToastBody, {
		componentProps: {
			status: err.status,
			message: err.message,
			errorId: err.errorId,
			requestId: err.requestId,
			stack: err.stack
		},
		duration: 10_000
	});
}
