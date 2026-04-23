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
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
		{#if href}
			<a href={href} class="text-xs text-primary underline-offset-4 hover:underline">Open</a>
		{/if}
	</div>
	<div class="flex-1">{@render children()}</div>
</Card>
