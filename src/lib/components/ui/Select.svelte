<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import { ChevronDown } from 'lucide-svelte';

	let {
		class: klass = '',
		value = $bindable(''),
		children,
		...rest
	}: HTMLSelectAttributes & { class?: string; children?: import('svelte').Snippet } = $props();
	/* eslint-enable svelte/valid-compile */
</script>

<div class={cn('relative', klass)}>
	<select
		bind:value
		class="flex h-11 w-full touch-action-manipulation appearance-none rounded-md border border-input bg-card py-2 pl-3 pr-8 text-sm ring-offset-background transition-colors duration-150 hover:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
		{...rest}
	>
		{#if children}{@render children()}{/if}
	</select>
	<ChevronDown
		class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
	/>
</div>
