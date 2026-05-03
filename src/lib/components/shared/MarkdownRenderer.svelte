<script lang="ts">
    import { renderMarkdown } from '$lib/utils/markdown';

    let { content = '', class: className = '' }: { content?: string; class?: string } = $props();
</script>

{#if content}
    <!-- eslint-disable svelte/no-at-html-tags -->
    <div class="mdrender-prose mdrender-prose-sm mdrender-max-w-none mdrender-line-clamp-4 {className}">
        {@html renderMarkdown(content)}
    </div>
    <!-- eslint-enable svelte/no-at-html-tags -->
{/if}
