<script lang="ts">
    let {
        number,
        title,
        as: tag = 'h2',
        class: klass = ''
    }: {
        number: string | number;
        title?: string;
        as?: 'h1' | 'h2' | 'h3';
        class?: string;
    } = $props();

    const formattedNumber = $derived(String(number).padStart(2, '0'));
</script>

<div class="section-number {klass}">
    <div class="section-number__bg">
        {formattedNumber}
    </div>
    <div class="section-number__content">
        {#if title}
            <svelte:element this={tag} class="section-number__title">
                {title}
            </svelte:element>
        {/if}
    </div>
</div>

<style>
    .section-number {
        display: flex;
        align-items: stretch;
        gap: 16px;
    }

    .section-number__bg {
        flex-shrink: 0;
        width: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--lilac);
        border: 1px solid var(--lilac-d);
        border-radius: var(--r-sm);
        font-family: var(--font-mono);
        font-size: 14px;
        font-weight: 700;
        color: var(--lilac-d);
    }

    .section-number__content {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
    }

    .section-number__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.2;
        color: var(--ink);
    }
</style>
