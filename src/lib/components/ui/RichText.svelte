<script lang="ts">
    import { linkifyText } from '$lib/utils/linkify';

    let {
        text,
        class: klass = '',
        lineClamp = false,
        onClick,
        editable = false
    }: {
        text: string | null;
        class?: string;
        lineClamp?: boolean;
        onClick?: () => void;
        editable?: boolean;
    } = $props();

    const parts = $derived(linkifyText(text || ''));

    function handleClick(e: MouseEvent) {
        if (!editable) return;
        if ((e.target as HTMLElement).closest('A')) {
            return;
        }
        onClick?.();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (!editable) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    }

    const richTextClass = $derived(`rich-text ${lineClamp ? 'rich-text--clamp' : ''} ${klass}`.trim());
    const editableClass = $derived(`rich-text rich-text--editable ${lineClamp ? 'rich-text--clamp' : ''} ${klass}`.trim());
</script>

{#if parts.length === 0}
    <p class={richTextClass}></p>
{:else if editable}
    <div class={editableClass} onclick={handleClick} onkeydown={handleKeyDown} role="button" tabindex={0}>
        {#each parts as part}
            {#if part.type === 'url'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text__link" onclick={(e) => e.stopPropagation()}>
                    {part.content}
                </a>
            {:else if part.type === 'phone'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text__link" onclick={(e) => e.stopPropagation()}
                    >{part.content}</a
                >
            {:else}
                {part.content}
            {/if}
        {/each}
    </div>
{:else}
    <p class={richTextClass}>
        {#each parts as part}
            {#if part.type === 'url'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text__link" onclick={(e) => e.stopPropagation()}>
                    {part.content}
                </a>
            {:else if part.type === 'phone'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text__link" onclick={(e) => e.stopPropagation()}>
                    {part.content}
                </a>
            {:else}
                {part.content}
            {/if}
        {/each}
    </p>
{/if}

<style>
    .rich-text {
        margin: 0;
        font: inherit;
        color: inherit;
    }

    .rich-text--clamp {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .rich-text--editable {
        cursor: pointer;
        border-radius: var(--r-sm);
    }

    .rich-text--editable:focus {
        outline: 2px solid var(--ink-3);
        outline-offset: 2px;
    }

    .rich-text__link {
        color: var(--peri-d);
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .rich-text__link:hover {
        color: var(--ink);
    }
</style>
