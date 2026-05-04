<script lang="ts">
    /* eslint-disable svelte/valid-compile */
    import type { HTMLLabelAttributes } from 'svelte/elements';

    let { class: klass = '', children, ...rest }: HTMLLabelAttributes & { class?: string; children?: import('svelte').Snippet } = $props();
    /* eslint-enable svelte/valid-compile */

    const labelClass = $derived(`label ${klass}`.trim());
</script>

<label class={labelClass} {...rest}>
    {#if children}{@render children()}{/if}
</label>
