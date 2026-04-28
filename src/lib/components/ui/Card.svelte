<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		children,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { class?: string; children?: import('svelte').Snippet } = $props();
	/* eslint-enable svelte/valid-compile */

	const cardClass = $derived(cn('card', klass));
</script>

<div class={cardClass} {...rest}>
	{#if children}{@render children()}{/if}
</div>
