<script lang="ts">
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

<div class="card {className}" style="display: flex; flex-direction: column; gap: 16px;">
	<div style="display: flex; align-items: center; justify-content: space-between;">
		<h3 class="display" style="font-size: 20px; margin: 0;">{title}</h3>
		{#if href}
			<a href={href} class="btn sm ghost">View all</a>
		{/if}
	</div>
	<div style="flex: 1;">{@render children()}</div>
</div>
