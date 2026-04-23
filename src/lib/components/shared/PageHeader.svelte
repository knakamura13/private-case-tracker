<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let {
		title,
		description,
		actions,
		class: klass = ''
	}: {
		title: string;
		description?: string;
		actions?: import('svelte').Snippet;
		class?: string;
	} = $props();
</script>

<header class={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', klass)}>
	<div class="min-w-0">
		<h1 class="truncate text-2xl font-semibold tracking-tight">{title}</h1>
		{#if description}
			<p class="mt-1 text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center justify-end gap-2">{@render actions()}</div>
	{/if}
</header>
