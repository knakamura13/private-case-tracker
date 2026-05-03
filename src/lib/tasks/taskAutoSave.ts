import { invokeEnhance, type ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';

export interface TaskAutoSaveDeps {
    getOpen: () => boolean;
    getAction: () => string;
    getOnEnhance: () => ManualEnhanceHandler | undefined;
    buildFormData: () => FormData;
}

export function createTaskAutoSave(deps: TaskAutoSaveDeps) {
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingSavePromise: Promise<void> | null = null;
    let focusedField: string | null = null;
    let hasPendingChanges = false;
    let saveVersion = 0;
    let lastSavedVersion = 0;

    function reset() {
        focusedField = null;
        hasPendingChanges = false;
        saveVersion = 0;
        lastSavedVersion = 0;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = null;
        pendingSavePromise = null;
    }

    function onOpen() {
        focusedField = null;
        hasPendingChanges = false;
        saveVersion = 0;
        lastSavedVersion = 0;
    }

    async function performAutoSave() {
        const onenhance = deps.getOnEnhance();
        if (!onenhance || !deps.getOpen() || !deps.getAction()) return;
        if (pendingSavePromise) {
            await pendingSavePromise;
            if (saveVersion > lastSavedVersion) {
                await performAutoSave();
            }
            return;
        }

        const versionToSave = saveVersion;
        const formData = deps.buildFormData();
        const cancel = () => undefined;

        pendingSavePromise = (async () => {
            const ok = await invokeEnhance(onenhance, formData, cancel, 'Failed to auto-save task');
            if (ok) {
                lastSavedVersion = Math.max(lastSavedVersion, versionToSave);
            }
            hasPendingChanges = saveVersion > lastSavedVersion;
            pendingSavePromise = null;
        })();

        await pendingSavePromise;
    }

    async function triggerAutoSave(immediate = false, force = false) {
        saveVersion += 1;
        hasPendingChanges = true;
        if (saveTimeout) clearTimeout(saveTimeout);
        if (!deps.getOpen() || !deps.getAction()) return;
        if (focusedField && !force) return;

        if (immediate) {
            await performAutoSave();
            return;
        }

        saveTimeout = setTimeout(() => {
            saveTimeout = null;
            if (focusedField && !force) return;
            void performAutoSave();
        }, 2000);
    }

    async function saveBeforeClose(onClose: () => void | Promise<void>) {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        if (hasPendingChanges || pendingSavePromise) {
            focusedField = null;
            await triggerAutoSave(true, true);
        }
        await onClose();
    }

    return {
        markFocused(field: string) {
            focusedField = field;
        },
        markBlurred(field: string) {
            if (focusedField === field) focusedField = null;
        },
        triggerAutoSave,
        saveBeforeClose,
        reset,
        onOpen
    };
}
