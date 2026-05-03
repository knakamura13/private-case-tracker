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

<div class={`section-number ${klass}`}>
    <div class="section-number-bg">
        {formattedNumber}
    </div>
    <div class="section-number-content">
        {#if title}
            <svelte:element this={tag} class="section-number-title">
                {title}
            </svelte:element>
        {/if}
    </div>
</div>
