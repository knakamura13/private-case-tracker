<script lang="ts">
	import SectionNumber from '$lib/components/signature/SectionNumber.svelte';
	let {
		title,
		description,
		actions,
		number,
		class: klass = ''
	}: {
		title: string;
		description?: string;
		actions?: import('svelte').Snippet;
		number?: string | number;
		class?: string;
	} = $props();
</script>

<header class={`page-header ${klass}`}>
	<div class="page-header-main">
		{#if number !== undefined}
			<SectionNumber {number} {title} as="h1" class="-mt-4" />
		{:else}
			<h1 class="page-header-title">{title}</h1>
		{/if}
		<div class="page-header-meta">
			{#if description}
				<p class="page-header-description">{description}</p>
			{/if}
			{#if actions}
				<div class="page-header-actions">{@render actions()}</div>
			{/if}
		</div>
	</div>
</header>
