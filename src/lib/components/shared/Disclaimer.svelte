<script lang="ts">
    import { ShieldAlert } from 'lucide-svelte';
    import { privacyCopy } from '$lib/constants/navigation';
    let { detailed = false, class: klass = '' } = $props<{ detailed?: boolean; class?: string }>();
</script>

<div class="disclaimer {klass}">
    <ShieldAlert class="disclaimer__icon" />
    <span class="disclaimer__text">{detailed ? privacyCopy.long : privacyCopy.short}</span>
</div>

<style>
    .disclaimer {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--ink-3);
    }

    .disclaimer__icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .disclaimer__text {
        flex: 1;
        min-width: 0;
    }
</style>
