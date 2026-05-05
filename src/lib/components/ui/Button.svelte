<script lang="ts" module>
    export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
</script>

<script lang="ts">
    /* eslint-disable svelte/valid-compile */
    import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

    type Props = (HTMLButtonAttributes & { href?: undefined }) | (HTMLAnchorAttributes & { href: string });

    let {
        class: klass = '',
        variant = 'default',
        size = 'default',
        loading = false,
        disabled = false,
        href,
        children,
        ...rest
    }: Props & {
        variant?: ButtonVariant;
        size?: ButtonSize;
        loading?: boolean;
        disabled?: boolean;
        class?: string;
        children?: import('svelte').Snippet;
    } = $props();
    /* eslint-enable svelte/valid-compile */

    const isDisabled = $derived(disabled || loading);

    function variantClass(value: ButtonVariant) {
        switch (value) {
            case 'destructive':
                return 'destructive';
            case 'outline':
                return 'outline';
            case 'secondary':
                return 'secondary';
            case 'ghost':
                return 'ghost';
            case 'link':
                return 'link';
            case 'default':
                return 'primary';
        }
    }

    function sizeClass(value: ButtonSize) {
        switch (value) {
            case 'sm':
                return 'sm';
            case 'lg':
                return 'lg';
            case 'icon':
                return 'icon';
            case 'default':
                return '';
        }
    }

    const classes = $derived(`btn ${variantClass(variant)} ${sizeClass(size)} ${loading ? 'loading' : ''} ${klass}`.trim());

    const title = $derived(rest.title || (size === 'icon' ? (rest['aria-label'] as string) : undefined));
</script>

{#if href}
    <a {href} class={classes} {title} {...rest as HTMLAnchorAttributes}>
        {#if children}{@render children()}{/if}
    </a>
{:else}
    <button class={classes} {title} disabled={isDisabled} {...rest as HTMLButtonAttributes}>
        {#if loading}
            <span class="btn-spinner"></span>
        {/if}
        {#if children}{@render children()}{/if}
    </button>
{/if}

<style>
    .btn-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: btn-spin 0.75s linear infinite;
        flex-shrink: 0;
    }

    @keyframes btn-spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .btn.loading {
        pointer-events: none;
        opacity: 0.8;
    }
</style>
