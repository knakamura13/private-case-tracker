<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		title,
		description,
		actions,
		icon,
		class: klass = ''
	}: {
		title: string;
		description?: string;
		actions?: import('svelte').Snippet;
		icon?: import('svelte').Snippet;
		class?: string;
	} = $props();
</script>

<div class={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center', klass)}>
	{#if icon}
		<div class="mb-3 text-muted-foreground">{@render icon()}</div>
	{/if}
	<h3 class="text-base font-semibold">{title}</h3>
	{#if description}
		<p class="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
	{/if}
	{#if actions}
		<div class="mt-4 flex items-center gap-2">{@render actions()}</div>
	{/if}
</div>
