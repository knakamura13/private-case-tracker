<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	let { content = '', class: className = '' }: { content?: string; class?: string } = $props();
</script>

{#if content}
	<!-- eslint-disable svelte/no-at-html-tags -->
	<div class="prose prose-sm max-w-none line-clamp-4 {className}">
		{@html renderMarkdown(content)}
	</div>
	<!-- eslint-enable svelte/no-at-html-tags -->
{/if}
