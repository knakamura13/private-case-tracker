<script lang="ts">
    import { renderMarkdown } from '$lib/utils/markdown';

    let { content = '', class: className = '' }: { content?: string; class?: string } = $props();
</script>

{#if content}
    <!-- eslint-disable svelte/no-at-html-tags -->
    <div class="md-render md-render--clamp {className}">
        {@html renderMarkdown(content)}
    </div>
    <!-- eslint-enable svelte/no-at-html-tags -->
{/if}

<style>
    .md-render {
        font-size: 13px;
        line-height: 1.6;
        color: var(--ink);
        max-width: none;
    }

    .md-render--clamp {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .md-render :global(p) {
        margin: 0 0 0.5em;
    }

    .md-render :global(p:last-child) {
        margin-bottom: 0;
    }

    .md-render :global(ul),
    .md-render :global(ol) {
        margin: 0;
        padding-left: 1.2em;
    }

    .md-render :global(code) {
        font-family: var(--font-mono);
        font-size: 0.9em;
    }
</style>
