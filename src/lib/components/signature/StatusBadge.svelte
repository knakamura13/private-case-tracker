<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const statusBadgeVariants = tv({
		base: 'inline-flex items-center border-l-[3px] bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground transition-colors',
		variants: {
			variant: {
				success: 'border-l-success',
				warning: 'border-l-warning',
				error: 'border-l-destructive',
				neutral: 'border-l-muted-foreground',
				default: 'border-l-primary'
			}
		},
		defaultVariants: { variant: 'default' }
	});

	export type StatusBadgeVariant = VariantProps<typeof statusBadgeVariants>['variant'];
</script>

<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		status,
		variant = 'default',
		class: klass = ''
	}: {
		status: string;
		variant?: StatusBadgeVariant;
		class?: string;
	} = $props();
</script>

<span class={cn(statusBadgeVariants({ variant }), klass)}>
	{status}
</span>
