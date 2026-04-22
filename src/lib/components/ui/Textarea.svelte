<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		value = $bindable(''),
		...rest
	}: HTMLTextareaAttributes & { class?: string } = $props();
</script>

<textarea
	bind:value
	class={cn(
		'flex min-h-[90px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
		klass
	)}
	{...rest}
></textarea>
