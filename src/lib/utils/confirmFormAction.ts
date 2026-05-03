import { showSuccessToast, showErrorToast } from '$lib/stores/toast';

export async function confirmAndPostFormAction(opts: {
    url: string;
    id: string;
    confirmMessage: string;
    successMessage: string;
    errorMessage: string;
    onSuccess: () => void | Promise<void>;
}): Promise<void> {
    if (!confirm(opts.confirmMessage)) return;
    const formData = new FormData();
    formData.append('id', opts.id);
    const response = await fetch(opts.url, { method: 'POST', body: formData });
    if (response.ok) {
        showSuccessToast(opts.successMessage);
        await opts.onSuccess();
    } else {
        showErrorToast(opts.errorMessage);
    }
}
