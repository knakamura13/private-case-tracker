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

<div class="mdeditor-space-y-2">
	<div class="mdeditor-inline-flex mdeditor-rounded-md mdeditor-border mdeditor-bg-muted-30 mdeditor-p-1 mdeditor-text-xs">
		<button type="button" class={`mdeditor-rounded mdeditor-px-2 mdeditor-py-1 ${tab === 'write' ? 'mdeditor-bg-card mdeditor-shadow-sm' : 'mdeditor-text-muted'}`} onclick={() => (tab = 'write')}>Write</button>
		<button type="button" class={`mdeditor-rounded mdeditor-px-2 mdeditor-py-1 ${tab === 'preview' ? 'mdeditor-bg-card mdeditor-shadow-sm' : 'mdeditor-text-muted'}`} onclick={() => (tab = 'preview')}>Preview</button>
	</div>
	{#if tab === 'write'}
		<Textarea {name} bind:value {placeholder} class="mdeditor-min-h-240 mdeditor-font-mono mdeditor-text-sm" />
	{:else}
		<!-- eslint-disable svelte/no-at-html-tags -->
		<div class="mdeditor-min-h-240 mdeditor-rounded-md mdeditor-border mdeditor-bg-card mdeditor-p-4 mdeditor-text-sm mdeditor-leading-relaxed mdrender-prose mdrender-prose-sm mdrender-max-w-none">
			{@html renderMarkdown(value)}
		</div>
		<!-- eslint-enable svelte/no-at-html-tags -->
	{/if}
</div>
