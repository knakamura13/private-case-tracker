<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let {
		class: klass = '',
		value = $bindable(''),
		children,
		...rest
	}: HTMLSelectAttributes & { class?: string; children?: import('svelte').Snippet } = $props();
	/* eslint-enable svelte/valid-compile */

	const selectClass = $derived(`select ${klass}`.trim());
</script>

<select bind:value class={selectClass} {...rest}>
	{#if children}{@render children()}{/if}
</select>
