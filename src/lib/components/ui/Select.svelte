<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		value = $bindable(''),
		children,
		...rest
	}: HTMLSelectAttributes & { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<select
	bind:value
	class={cn(
		'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
		klass
	)}
	{...rest}
>
	{#if children}{@render children()}{/if}
</select>
