<script lang="ts">
    let {
        label,
        value,
        class: klass = ''
    }: {
        label: string;
        value: string | number | null | undefined;
        class?: string;
    } = $props();
</script>

<div class="data-field {klass}">
    <span class="data-field__label">{label}</span>
    <span class="data-field__value">{value ?? '—'}</span>
</div>

<style>
    .data-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .data-field__label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ink-3);
    }

    .data-field__value {
        font-size: 14px;
        color: var(--ink);
        line-height: 1.4;
    }
</style>
