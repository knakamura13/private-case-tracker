<script lang="ts">
    let {
        owner,
        size = 'default',
        color = 'sage'
    }: {
        owner: { id: string; name: string | null; email: string } | null;
        size?: 'default' | 'sm';
        color?: 'sage' | 'blush' | 'butter' | 'peri';
    } = $props();

    const initial = $derived(owner ? owner.name?.[0] || owner.email?.[0] || 'U' : '?');

    const sizeClass = $derived(size === 'sm' ? 'avatar-sm' : 'avatar');

    const colorClass = $derived(`avatar-${color}`);
</script>

{#if owner}
    <div class="avatar {sizeClass} {colorClass}" title={owner.name ?? owner.email}>
        {initial}
    </div>
{/if}

<style>
    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-ui);
        font-size: 13px;
        font-weight: 500;
        color: var(--ink);
        flex-shrink: 0;
    }

    .avatar-sm {
        width: 24px;
        height: 24px;
        font-size: 10px;
    }

    .avatar-sage {
        background: var(--sage);
    }

    .avatar-blush {
        background: var(--blush);
    }

    .avatar-butter {
        background: var(--butter);
    }

    .avatar-peri {
        background: var(--peri);
    }
</style>
