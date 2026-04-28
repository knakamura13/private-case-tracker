<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		value = $bindable(''),
		children,
		...rest
	}: HTMLSelectAttributes & { class?: string; children?: import('svelte').Snippet } = $props();
	/* eslint-enable svelte/valid-compile */

	const selectClass = $derived(cn('select', klass));
</script>

<select bind:value class={selectClass} {...rest}>
	{#if children}{@render children()}{/if}
</select>
