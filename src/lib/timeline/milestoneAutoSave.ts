import { invokeEnhance, type ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';

export interface MilestoneAutoSaveDeps {
    getOpen: () => boolean;
    getAction: () => string;
    getOnEnhance: () => ManualEnhanceHandler | undefined;
    buildFormData: () => FormData;
}

/** Debounced auto-save matching legacy MilestoneEditModal behavior (2s delay, isSaving guard). */
export function createMilestoneAutoSave(deps: MilestoneAutoSaveDeps) {
    let isSaving = false;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingSavePromise: Promise<void> | null = null;

    function reset() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = null;
        pendingSavePromise = null;
        isSaving = false;
    }

    function onOpen() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = null;
        pendingSavePromise = null;
        isSaving = false;
    }

    async function triggerAutoSave(immediate = false) {
        if (isSaving) return;
        if (saveTimeout) clearTimeout(saveTimeout);
        if (!deps.getOpen() || !deps.getAction()) return;
        const delay = immediate ? 0 : 2000;
        saveTimeout = setTimeout(async () => {
            const onenhance = deps.getOnEnhance();
            if (onenhance) {
                isSaving = true;
                const formData = deps.buildFormData();
                const cancel = () => {
                    isSaving = false;
                };

                pendingSavePromise = (async () => {
                    await invokeEnhance(onenhance, formData, cancel, 'Failed to auto-save milestone');
                    isSaving = false;
                    pendingSavePromise = null;
                })();

                await pendingSavePromise;
            }
        }, delay);
    }

    return { triggerAutoSave, reset, onOpen };
}
