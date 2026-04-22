<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { FolderLock, Plus, ExternalLink } from 'lucide-svelte';
	import { fmtDateTime } from '$lib/utils/dates';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function bytes(n: number | null): string {
		if (!n) return '';
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<PageHeader title="Documents" description="Files and secure external links. Prefer metadata + link when possible.">
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
		{#each data.docs as doc (doc.id)}
			<li>
				<a href={`/documents/${doc.id}`}>
					<Card class="p-4 hover:border-primary/40">
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
