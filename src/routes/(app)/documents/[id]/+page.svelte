<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { ExternalLink, Download, Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDateTime } from '$lib/utils/dates';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<PageHeader title={data.doc.title} description={data.doc.category}>
	{#snippet actions()}
		<Badge variant={data.doc.storageMode === 'EXTERNAL_LINK' ? 'outline' : 'secondary'}>
			{data.doc.storageMode === 'EXTERNAL_LINK' ? 'External link' : 'Uploaded'}
		</Badge>
		{#if data.doc.storageMode === 'EXTERNAL_LINK' && data.doc.externalUrl}
			<Button variant="outline" href={data.doc.externalUrl} target="_blank" rel="noreferrer noopener">
				{#snippet children()}<ExternalLink class="h-4 w-4" /> Open link{/snippet}
			</Button>
		{:else}
			<form method="post" action="?/download">
				<Button type="submit" variant="outline">
					{#snippet children()}<Download class="h-4 w-4" /> Download{/snippet}
				</Button>
			</form>
		{/if}
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

<Card class="p-4 text-sm">
	<dl class="grid grid-cols-1 gap-3 md:grid-cols-2">
		<div><dt class="text-xs uppercase text-muted-foreground">Uploaded</dt><dd>{fmtDateTime(data.doc.createdAt)}</dd></div>
		<div><dt class="text-xs uppercase text-muted-foreground">Uploaded by</dt><dd>{data.doc.uploadedBy?.name ?? data.doc.uploadedBy?.email ?? '—'}</dd></div>
		{#if data.doc.sizeBytes}<div><dt class="text-xs uppercase text-muted-foreground">Size</dt><dd>{(data.doc.sizeBytes / 1024).toFixed(0)} KB</dd></div>{/if}
		{#if data.doc.mimeType}<div><dt class="text-xs uppercase text-muted-foreground">Type</dt><dd>{data.doc.mimeType}</dd></div>{/if}
		{#if data.doc.form}<div><dt class="text-xs uppercase text-muted-foreground">Linked form</dt><dd><a class="text-primary underline-offset-4 hover:underline" href={`/forms/${data.doc.form.id}`}>{data.doc.form.code} — {data.doc.form.name}</a></dd></div>{/if}
		{#if data.doc.evidence}<div><dt class="text-xs uppercase text-muted-foreground">Linked evidence</dt><dd><a class="text-primary underline-offset-4 hover:underline" href={`/evidence/${data.doc.evidence.id}`}>{data.doc.evidence.title}</a></dd></div>{/if}
		{#if data.doc.notes}<div class="md:col-span-2"><dt class="text-xs uppercase text-muted-foreground">Notes</dt><dd class="whitespace-pre-wrap">{data.doc.notes}</dd></div>{/if}
	</dl>
</Card>

{#if data.doc.versions.length > 0}
	<section class="mt-6">
		<h3 class="mb-2 text-sm font-semibold text-muted-foreground">Versions</h3>
		<ul class="space-y-1 text-sm">
			{#each data.doc.versions as v (v.id)}
				<li><a href={`/documents/${v.id}`} class="text-primary underline-offset-4 hover:underline">{v.title}</a> <span class="text-xs text-muted-foreground">— {fmtDateTime(v.createdAt)}</span></li>
			{/each}
		</ul>
	</section>
{/if}
