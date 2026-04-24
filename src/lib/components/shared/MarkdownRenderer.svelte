<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	let { content = '', class: className = '' }: { content?: string; class?: string } = $props();
</script>

{#if content}
	<div class={className} class:prose class:prose-sm class:max-w-none>
		{@html renderMarkdown(content)}
	</div>
{/if}
