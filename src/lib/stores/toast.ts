import { toast } from 'svelte-sonner';

export function showSuccessToast(message: string) {
    toast.success(message, {
        duration: 3000,
        closeButton: true
    });
}

export function showErrorToast(message: string) {
    toast.error(message, {
        duration: 5000,
        closeButton: true
    });
}

export function showInfoToast(message: string) {
    toast(message, {
        duration: 3000,
        closeButton: true
    });
}
