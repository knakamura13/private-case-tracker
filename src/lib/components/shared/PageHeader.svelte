<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import SectionNumber from '$lib/components/signature/SectionNumber.svelte';
	let {
		title,
		description,
		actions,
		number,
		class: klass = ''
	}: {
		title: string;
		description?: string;
		actions?: import('svelte').Snippet;
		number?: string | number;
		class?: string;
	} = $props();
</script>

<header class={cn('mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', klass)}>
	<div class="min-w-0 flex-1">
		{#if number !== undefined}
			<SectionNumber {number} {title} as="h1" class="-mt-4" />
		{:else}
			<h1 class="truncate text-h1 font-display font-semibold tracking-tight">{title}</h1>
		{/if}
		<div class="mt-2 flex flex-row flex-wrap items-center gap-2 sm:flex-row sm:items-end sm:justify-between">
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
			{#if actions}
				<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
			{/if}
		</div>
	</div>
</header>
