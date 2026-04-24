<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { FolderLock, Plus, ExternalLink, Upload } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { fmtDateTime } from '$lib/utils/dates';
	import { goto } from '$app/navigation';
	import { setPendingUpload } from '$lib/stores/pendingUpload';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pageDragging = $state(false);

	function onDragEnter(e: DragEvent) {
		if (e.dataTransfer?.types.includes('Files')) pageDragging = true;
	}

	function onDragOver(e: DragEvent) {
		if (e.dataTransfer?.types.includes('Files')) {
			e.preventDefault();
			pageDragging = true;
		}
	}

	function onDragLeave(e: DragEvent) {
		// Only clear when leaving the page entirely
		if (!e.relatedTarget || !(document.documentElement.contains(e.relatedTarget as Node) && e.relatedTarget !== document.documentElement)) {
			pageDragging = false;
		}
	}

	async function onDrop(e: DragEvent) {
		e.preventDefault();
		pageDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) {
			setPendingUpload(file);
			await goto('/documents/new');
		}
	}

	function bytes(n: number | null): string {
		if (!n) return '';
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:window
	ondragenter={onDragEnter}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
/>

{#if pageDragging}
	<div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
		<div class="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary bg-primary/5 px-16 py-12 text-center">
			<Upload class="h-12 w-12 text-primary" />
			<p class="text-lg font-semibold text-primary">Drop to upload</p>
			<p class="text-sm text-muted-foreground">File will open in the upload form</p>
		</div>
	</div>
{/if}

<PageHeader title="Documents" description="Files and secure external links. Prefer metadata + link when possible." number="5">
	{#snippet actions()}
		<Button href="/documents/new">
			{#snippet children()}<Plus class="h-4 w-4" /> Add document{/snippet}
		</Button>
	{/snippet}
</PageHeader>
<FilterBar
	filters={[
		{
			name: 'category',
			label: 'Category',
			options: data.categories.map((c) => ({ value: c, label: c }))
		}
	]}
/>
{#if data.docs.length === 0}
	<EmptyState title="No documents yet" description="Store metadata and a secure external link. Uploads go to private object storage.">
		{#snippet icon()}<FolderLock class="h-8 w-8" />{/snippet}
		{#snippet actions()}<Button href="/documents/new">Add document</Button>{/snippet}
	</EmptyState>
{:else}
	<ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each data.docs as doc, i (doc.id)}
			<li in:fly={{ y: 30, duration: 500, delay: i * 50 + 100, easing: cubicOut }}>
							<a href={`/documents/${doc.id}`}>
					<Card class="p-4 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 hover:bg-card/90">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate font-medium">{doc.title}</p>
								<p class="text-xs text-muted-foreground">{doc.category}</p>
							</div>
							<Badge variant={doc.storageMode === 'EXTERNAL_LINK' ? 'outline' : 'secondary'}>
								{#snippet children()}
									{#if doc.storageMode === 'EXTERNAL_LINK'}<ExternalLink class="h-3 w-3" />{/if}
									{doc.storageMode === 'EXTERNAL_LINK' ? 'Link' : 'Uploaded'}
								{/snippet}
							</Badge>
						</div>
						<div class="mt-2 text-xs text-muted-foreground">
							{fmtDateTime(doc.createdAt)}{doc.sizeBytes ? ` · ${bytes(doc.sizeBytes)}` : ''}
						</div>
					</Card>
				</a>
			</li>
		{/each}
	</ul>
{/if}
