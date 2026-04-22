<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		children,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<div class={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', klass)} {...rest}>
	{#if children}{@render children()}{/if}
</div>
