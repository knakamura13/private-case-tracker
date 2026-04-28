<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'badge',
		variants: {
			variant: {
				default: 'badge-default',
				secondary: 'badge-secondary',
				success: 'badge-success',
				warning: 'badge-warning',
				destructive: 'badge-destructive',
				outline: 'badge-outline'
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

	const badgeClass = $derived(cn(badgeVariants({ variant }), klass));
</script>

<span class={badgeClass} {...rest}>
	{#if children}{@render children()}{/if}
</span>
