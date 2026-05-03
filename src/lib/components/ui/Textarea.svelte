<script lang="ts">
    /* eslint-disable svelte/valid-compile */
    import type { HTMLTextareaAttributes } from 'svelte/elements';

    let { class: klass = '', value = $bindable(''), ...rest }: HTMLTextareaAttributes & { class?: string } = $props();

    function autoResize(node: HTMLTextAreaElement) {
        let manuallyResized = false;
        const MIN_HEIGHT = 90;
        const MAX_HEIGHT = 400;

        const resize = () => {
            if (manuallyResized) return;
            node.style.height = 'auto';
            const newHeight = Math.max(MIN_HEIGHT, Math.min(node.scrollHeight, MAX_HEIGHT));
            node.style.height = `${newHeight}px`;
        };

        // Track manual resize via the resize handle
        const handleResizeStart = () => {
            manuallyResized = true;
        };

        const handleResizeEnd = () => {
            // After manual resize, allow auto-resize to take over again on next input
            manuallyResized = false;
        };

        // Initial resize after DOM is ready
        requestAnimationFrame(resize);

        node.addEventListener('input', resize);
        node.addEventListener('mousedown', handleResizeStart);
        node.addEventListener('mouseup', handleResizeEnd);

        return {
            destroy() {
                node.removeEventListener('input', resize);
                node.removeEventListener('mousedown', handleResizeStart);
                node.removeEventListener('mouseup', handleResizeEnd);
            }
        };
    }
    /* eslint-enable svelte/valid-compile */

    const textareaClass = $derived(`textarea ${klass}`.trim());
</script>

<textarea use:autoResize bind:value class={textareaClass} {...rest}></textarea>
