<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, sub, eyebrow, number, actions }: { title: string; sub?: string; eyebrow?: string; number?: string; actions?: Snippet } = $props();
</script>

<div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; gap: 24px; flex-wrap: wrap;">
	<div>
		{#if eyebrow || number}
			<div class="eyebrow" style="margin-bottom: 12px;">{eyebrow || `PAGE ${number}`}</div>
		{/if}
		<h1 class="display" style="font-size: 56px; line-height: 1; margin: 0;">{title}</h1>
		{#if sub}
			<p style="color: var(--ink-2); margin-top: 12px; font-size: 15px; max-width: 560px; line-height: 1.5; text-wrap: pretty;">{sub}</p>
		{/if}
	</div>
	{#if actions}
		{@render actions()}
	{/if}
</div>
