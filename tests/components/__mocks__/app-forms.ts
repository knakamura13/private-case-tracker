export function enhance(_node: HTMLElement, _callback: (params: { formData: FormData; cancel: () => void }) => void) {
    // The enhance action stores the callback for the form submission
    // For testing, we don't need to do anything special since triggerAutoSave calls onenhance directly
    return {
        destroy: () => {}
    };
}
