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
        // Don't trigger onClick if clicking on a link
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

    const richTextClass = $derived(`rich-text ${lineClamp ? 'rich-text-line-clamp' : ''} ${klass}`.trim());
    const editableClass = $derived(`rich-text-editable ${richTextClass}`.trim());
</script>

{#if parts.length === 0}
    <p class={richTextClass}></p>
{:else if editable}
    <div class={editableClass} onclick={handleClick} onkeydown={handleKeyDown} role="button" tabindex={0}>
        {#each parts as part}
            {#if part.type === 'url'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text-link" onclick={(e) => e.stopPropagation()}>
                    {part.content}
                </a>
            {:else if part.type === 'phone'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text-link" onclick={(e) => e.stopPropagation()}
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
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text-link" onclick={(e) => e.stopPropagation()}>
                    {part.content}
                </a>
            {:else if part.type === 'phone'}
                <a href={part.href} target="_blank" rel="noopener noreferrer" class="rich-text-link" onclick={(e) => e.stopPropagation()}>
                    {part.content}
                </a>
            {:else}
                {part.content}
            {/if}
        {/each}
    </p>
{/if}
