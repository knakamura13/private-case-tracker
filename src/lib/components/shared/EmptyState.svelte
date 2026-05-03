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

<div class={`empty-state ${klass}`}>
    {#if icon}
        <div class="empty-state-icon">{@render icon()}</div>
    {/if}
    <h3 class="empty-state-title">{title}</h3>
    {#if description}
        <p class="empty-state-description">{description}</p>
    {/if}
    {#if actions}
        <div class="empty-state-actions">{@render actions()}</div>
    {/if}
</div>
