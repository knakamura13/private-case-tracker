<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: klass = '',
		children,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { class?: string; children?: import('svelte').Snippet } = $props();
	/* eslint-enable svelte/valid-compile */

	const cardClass = $derived(`card ${klass}`.trim());
</script>

<div class={cardClass} {...rest}>
	{#if children}{@render children()}{/if}
</div>
