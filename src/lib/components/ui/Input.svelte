<script lang="ts">
    /* eslint-disable svelte/valid-compile */
    import type { HTMLInputAttributes } from 'svelte/elements';

    let {
        class: klass = '',
        value = $bindable(''),
        error = false,
        ...rest
    }: HTMLInputAttributes & { class?: string; error?: boolean } = $props();
    /* eslint-enable svelte/valid-compile */

    const inputClass = $derived(`input ${error ? 'input-error' : ''} ${klass}`.trim());
</script>

<input bind:value class={inputClass} {...rest} />
