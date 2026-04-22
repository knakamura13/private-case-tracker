<script lang="ts">
	import Textarea from '$lib/components/ui/Textarea.svelte';
	let {
		name = 'bodyMd',
		value = $bindable(''),
		placeholder = 'Write your note in Markdown…'
	}: { name?: string; value?: string; placeholder?: string } = $props();

	let tab = $state<'write' | 'preview'>('write');

	function renderMarkdown(src: string): string {
		// Minimal, safe Markdown renderer (headings, bold, italic, code, links, lists).
		const escape = (s: string) =>
			s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		let html = escape(src);
		html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
		html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
		html = html.replace(/^#### (.*)$/gm, '<h4 class="mt-3 font-semibold">$1</h4>');
		html = html.replace(/^### (.*)$/gm, '<h3 class="mt-3 text-base font-semibold">$1</h3>');
		html = html.replace(/^## (.*)$/gm, '<h2 class="mt-3 text-lg font-semibold">$1</h2>');
		html = html.replace(/^# (.*)$/gm, '<h1 class="mt-3 text-xl font-semibold">$1</h1>');
		html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1">$1</code>');
		html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
		html = html.replace(
			/\[([^\]]+)\]\((https?:[^\s)]+)\)/g,
			'<a href="$2" class="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer noopener">$1</a>'
		);
		// Simple bullet lists
		html = html.replace(/(^|\n)- (.+)/g, '$1<li>$2</li>');
		html = html.replace(/(<li>.*<\/li>)(?!\s*<li>)/gs, '<ul class="list-disc pl-6">$1</ul>');
		html = html.replace(/\n\n+/g, '</p><p class="mt-3">');
		return `<p>${html}</p>`;
	}
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
