<script lang="ts">
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { renderMarkdown } from '$lib/utils/markdown';
	let {
		name = 'bodyMd',
		value = $bindable(''),
		placeholder = 'Write your note in Markdown…'
	}: { name?: string; value?: string; placeholder?: string } = $props();

	let tab = $state<'write' | 'preview'>('write');
</script>

<div class="space-y-2">
	<div class="inline-flex rounded-md border border-border bg-muted/30 p-1 text-xs">
		<button type="button" class={`rounded px-2 py-1 ${tab === 'write' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} onclick={() => (tab = 'write')}>Write</button>
		<button type="button" class={`rounded px-2 py-1 ${tab === 'preview' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} onclick={() => (tab = 'preview')}>Preview</button>
	</div>
	{#if tab === 'write'}
		<Textarea {name} bind:value {placeholder} class="min-h-[240px] font-mono text-sm" />
	{:else}
		<div class="min-h-[240px] rounded-md border border-border bg-card p-4 text-sm leading-relaxed prose prose-sm max-w-none">
			{@html renderMarkdown(value)}
		</div>
	{/if}
</div>
