import { showErrorToast } from '$lib/stores/toast';

export type ManualEnhanceHandler = (params: { formData: FormData; cancel: () => void }) => void | (() => Promise<void>);

/** @returns false if handler threw or was missing when needed by caller */
export async function invokeEnhance(
    onenhance: ManualEnhanceHandler | undefined,
    formData: FormData,
    cancel: () => void,
    errorMessage?: string
): Promise<boolean> {
    if (!onenhance) return true;
    try {
        const result = onenhance({ formData, cancel });
        if (result && typeof result === 'function') {
            await result();
        }
        return true;
    } catch {
        if (errorMessage) showErrorToast(errorMessage);
        cancel();
        return false;
    }
}
