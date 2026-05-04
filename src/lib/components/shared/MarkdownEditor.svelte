<script lang="ts">
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import { renderMarkdown } from '$lib/utils/markdown';
    let {
        name = 'bodyMd',
        value = $bindable(''),
        placeholder = 'Write your note in Markdown…'
    }: { name?: string; value?: string; placeholder?: string } = $props();

    let tab = $state<'write' | 'preview'>('write');
</script>

<div class="md-editor">
    <div class="md-editor__tabs" role="tablist">
        <button
            type="button"
            class="md-editor__tab"
            class:md-editor__tab--active={tab === 'write'}
            onclick={() => (tab = 'write')}
            role="tab"
            aria-selected={tab === 'write'}>Write</button
        >
        <button
            type="button"
            class="md-editor__tab"
            class:md-editor__tab--active={tab === 'preview'}
            onclick={() => (tab = 'preview')}
            role="tab"
            aria-selected={tab === 'preview'}>Preview</button
        >
    </div>
    {#if tab === 'write'}
        <div class="md-editor__write">
            <Textarea {name} bind:value {placeholder} />
        </div>
    {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <div class="md-editor__preview">
            {@html renderMarkdown(value)}
        </div>
        <!-- eslint-enable svelte/no-at-html-tags -->
    {/if}
</div>

<style>
    .md-editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .md-editor__tabs {
        display: inline-flex;
        align-items: center;
        border-radius: var(--r-sm);
        border: 1px solid var(--hairline);
        background: color-mix(in srgb, var(--surface-3) 30%, var(--surface));
        padding: 4px;
        gap: 2px;
    }

    .md-editor__tab {
        border: none;
        background: transparent;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 11px;
        font-family: var(--font-ui);
        cursor: pointer;
        color: var(--ink-3);
    }

    .md-editor__tab--active {
        background: var(--surface);
        color: var(--ink);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .md-editor__write :global(textarea) {
        min-height: 240px;
        font-family: var(--font-mono);
        font-size: 13px;
    }

    .md-editor__preview {
        min-height: 240px;
        border-radius: var(--r-sm);
        border: 1px solid var(--hairline);
        background: var(--surface);
        padding: 16px;
        font-size: 13px;
        line-height: 1.65;
        color: var(--ink);
        max-width: none;
    }

    .md-editor__preview :global(p) {
        margin: 0 0 0.75em;
    }

    .md-editor__preview :global(p:last-child) {
        margin-bottom: 0;
    }

    .md-editor__preview :global(ul),
    .md-editor__preview :global(ol) {
        margin: 0 0 0.75em;
        padding-left: 1.25em;
    }

    .md-editor__preview :global(code) {
        font-family: var(--font-mono);
        font-size: 0.9em;
    }

    .md-editor__preview :global(pre) {
        overflow: auto;
        padding: 8px;
        border-radius: var(--r-sm);
        background: var(--surface-2);
    }
</style>
