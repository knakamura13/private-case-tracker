<script lang="ts">
	import { Upload, FileText } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	let {
		file = $bindable<File | null>(null),
		accept = '*/*',
		class: klass = ''
	}: {
		file?: File | null;
		accept?: string;
		class?: string;
	} = $props();

	let dragging = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function onDragLeave(e: DragEvent) {
		if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
			dragging = false;
		}
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const dropped = e.dataTransfer?.files[0];
		if (dropped) file = dropped;
	}

	function onInputChange(e: Event) {
		file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}

	function open() {
		inputEl?.click();
	}

	function formatBytes(n: number): string {
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div
	role="button"
	tabindex="0"
	class={cn(
		'flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-all',
		dragging
			? 'scale-[1.01] border-primary bg-primary/5'
			: file
				? 'border-success/60 bg-success/5'
				: 'border-border bg-muted/30 hover:border-ring/40 hover:bg-muted/50',
		klass
	)}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	onclick={open}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open();
		}
	}}
	aria-label={file ? `Selected: ${file.name}. Click to change.` : 'Drop a file or click to browse'}
>
	<input bind:this={inputEl} type="file" {accept} class="sr-only" onchange={onInputChange} />

	{#if dragging}
		<Upload class="h-9 w-9 scale-110 text-primary transition-transform duration-200" />
		<p class="text-sm font-medium text-primary">Drop to select</p>
	{:else if file}
		<FileText class="h-9 w-9 text-success" />
		<div>
			<p class="text-sm font-medium">{file.name}</p>
			<p class="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
		</div>
		<p class="text-xs text-muted-foreground">Click to change file</p>
	{:else}
		<Upload class="h-9 w-9 text-muted-foreground" />
		<div>
			<p class="text-sm font-medium">Drop a file here</p>
			<p class="text-xs text-muted-foreground">or click to browse · max 50 MB</p>
		</div>
	{/if}
</div>
