<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { cn } from '$lib/utils/cn';
	let {
		title,
		href,
		class: className,
		children
	}: {
		title: string;
		href?: string;
		class?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<Card class={cn('flex h-full flex-col p-4', className)}>
	<div class="mb-4 flex items-center justify-between border-b border-border pb-3">
		<h2 class="text-lg font-display font-semibold text-foreground tracking-tight">{title}</h2>
		{#if href}
			<a href={href} class="text-xs text-primary underline-offset-4 hover:underline">Open</a>
		{/if}
	</div>
	<div class="flex-1">{@render children()}</div>
</Card>
