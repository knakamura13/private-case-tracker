<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	let {
		title,
		href,
		class: className,
		children
	}: {
		title: string;
		href?: string;
		class?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<Card class={`widget ${className}`}>
	<div class="widget-header">
		<h2 class="widget-title">{title}</h2>
		{#if href}
			<a href={href} class="widget-link">Open</a>
		{/if}
	</div>
	<div class="widget-content">{@render children()}</div>
</Card>
