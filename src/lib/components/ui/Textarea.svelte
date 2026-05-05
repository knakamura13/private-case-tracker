<script lang="ts">
    /* eslint-disable svelte/valid-compile */
    import type { HTMLTextareaAttributes } from 'svelte/elements';

    let { class: klass = '', value = $bindable(''), ...rest }: HTMLTextareaAttributes & { class?: string } = $props();

    function autoResize(node: HTMLTextAreaElement) {
        const MIN_HEIGHT = 90;
        const MAX_HEIGHT = 400;

        const resize = () => {
            node.style.height = 'auto';
            const newHeight = Math.max(MIN_HEIGHT, Math.min(node.scrollHeight, MAX_HEIGHT));
            node.style.height = `${newHeight}px`;
        };

        // Initial resize after DOM is ready
        requestAnimationFrame(resize);

        node.addEventListener('input', resize);

        return {
            destroy() {
                node.removeEventListener('input', resize);
            }
        };
    }
    /* eslint-enable svelte/valid-compile */

    const textareaClass = $derived(`textarea ${klass}`.trim());
</script>

<textarea use:autoResize bind:value class={textareaClass} {...rest}></textarea>
