<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		children,
		...rest
	}: HTMLLabelAttributes & { class?: string; children?: import('svelte').Snippet } = $props();
	/* eslint-enable svelte/valid-compile */
</script>

<label class={cn('text-sm font-medium leading-none', klass)} {...rest}>
	{#if children}{@render children()}{/if}
</label>
