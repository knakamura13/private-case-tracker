<script lang="ts">
    let {
        title,
        description,
        actions,
        icon,
        class: klass = ''
    }: {
        title: string;
        description?: string;
        actions?: import('svelte').Snippet;
        icon?: import('svelte').Snippet;
        class?: string;
    } = $props();
</script>

<div class="empty-state {klass}">
    {#if icon}
        <div class="empty-state__icon">{@render icon()}</div>
    {/if}
    <h3 class="empty-state__title">{title}</h3>
    {#if description}
        <p class="empty-state__description">{description}</p>
    {/if}
    {#if actions}
        <div class="empty-state__actions">{@render actions()}</div>
    {/if}
</div>

<style>
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 32px 16px;
        color: var(--ink-2);
    }

    .empty-state__icon {
        margin-bottom: 12px;
        color: var(--ink-3);
    }

    .empty-state__title {
        margin: 0 0 8px;
        font-family: var(--font-display);
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--ink);
    }

    .empty-state__description {
        margin: 0 0 16px;
        font-size: 13px;
        line-height: 1.5;
        max-width: 360px;
    }

    .empty-state__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
    }
</style>
