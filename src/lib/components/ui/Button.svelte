<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'cursor-pointer touch-action-manipulation inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px]',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground border border-transparent hover:border-primary-foreground/30',
				destructive: 'bg-destructive text-destructive-foreground border border-transparent hover:border-destructive-foreground/30',
				outline: 'border border-border bg-card hover:border-muted-foreground',
				secondary: 'bg-secondary text-secondary-foreground border border-transparent hover:border-secondary-foreground/30',
				ghost: 'border border-transparent hover:border-border',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3 text-xs',
				lg: 'h-11 rounded-md px-6',
				icon: 'h-11 w-11'
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
