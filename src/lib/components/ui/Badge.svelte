<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
		variants: {
			variant: {
				default: 'border-transparent bg-primary/10 text-primary',
				secondary: 'border-transparent bg-secondary text-secondary-foreground',
				success: 'border-transparent bg-success/15 text-success',
				warning: 'border-transparent bg-warning/20 text-warning',
				destructive: 'border-transparent bg-destructive/15 text-destructive',
				outline: 'border-border text-foreground'
			}
		},
		defaultVariants: { variant: 'default' }
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		variant = 'default',
		children,
		...rest
	}: HTMLAttributes<HTMLSpanElement> & {
		class?: string;
		variant?: BadgeVariant;
		children?: import('svelte').Snippet;
	} = $props();
	/* eslint-enable svelte/valid-compile */
</script>

<span class={cn(badgeVariants({ variant }), klass)} {...rest}>
	{#if children}{@render children()}{/if}
</span>
