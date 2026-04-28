<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'btn',
		variants: {
			variant: {
				default: 'btn-primary',
				destructive: 'btn-destructive',
				outline: 'btn-outline',
				secondary: 'btn-secondary',
				ghost: 'btn-ghost',
				link: 'btn-link'
			},
			size: {
				default: '',
				sm: 'btn-sm',
				lg: 'btn-lg',
				icon: 'btn-icon'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

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

	const classes = $derived(cn(buttonVariants({ variant, size }), klass));
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
