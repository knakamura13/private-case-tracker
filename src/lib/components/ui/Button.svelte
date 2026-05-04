<script lang="ts" module>
    const buttonVariants = {
        variant: {
            default: 'primary',
            destructive: 'destructive',
            outline: 'outline',
            secondary: 'secondary',
            ghost: 'ghost',
            link: 'link'
        },
        size: {
            default: '',
            sm: 'sm',
            lg: 'lg',
            icon: 'icon'
        }
    } as const;

    export type ButtonVariant = keyof typeof buttonVariants.variant;
    export type ButtonSize = keyof typeof buttonVariants.size;
</script>

<script lang="ts">
    /* eslint-disable svelte/valid-compile */
    import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

    type Props = (HTMLButtonAttributes & { href?: undefined }) | (HTMLAnchorAttributes & { href: string });

    let {
        class: klass = '',
        variant = 'default',
        size = 'default',
        href,
        children,
        ...rest
    }: Props & {
        variant?: ButtonVariant;
        size?: ButtonSize;
        class?: string;
        children?: import('svelte').Snippet;
    } = $props();
    /* eslint-enable svelte/valid-compile */

    // eslint-disable-next-line security/detect-object-injection
    const classes = $derived(`btn ${buttonVariants.variant[variant]} ${buttonVariants.size[size]} ${klass}`.trim());
</script>

{#if href}
    <a {href} class={classes} {...rest as HTMLAnchorAttributes}>
        {#if children}{@render children()}{/if}
    </a>
{:else}
    <button class={classes} {...rest as HTMLButtonAttributes}>
        {#if children}{@render children()}{/if}
    </button>
{/if}
