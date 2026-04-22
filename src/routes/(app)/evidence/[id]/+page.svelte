<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import EvidenceForm from '$lib/components/evidence/EvidenceForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
</script>

<PageHeader title={data.evidence.title} description={data.evidence.description ?? undefined}>
	{#snippet actions()}
		<Badge>{titleCase(data.evidence.status)}</Badge>
		<Badge variant="outline">{data.evidence.type}</Badge>
		<Button variant="outline" onclick={() => (editing = !editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

{#if editing}
	<form method="post" action="?/update" use:enhance={() => ({ update }) => update().then(() => { editing = false; })}>
		<EvidenceForm
			initial={{
				title: data.evidence.title,
				type: data.evidence.type,
				status: data.evidence.status,
				dateStart: data.evidence.dateStart,
				dateEnd: data.evidence.dateEnd,
				peopleInvolved: data.evidence.peopleInvolved,
				description: data.evidence.description,
				significance: data.evidence.significance,
				confidenceScore: data.evidence.confidenceScore,
				includedInPacket: data.evidence.includedInPacket,
				notes: data.evidence.notes
			}}
			submitLabel="Save changes"
			error={form?.error}
		/>
	</form>
{:else}
	<div class="grid gap-6 md:grid-cols-3">
		<Card class="p-4 text-sm md:col-span-2">
			<h2 class="mb-2 font-semibold">Significance</h2>
			<p class="text-muted-foreground">{data.evidence.significance ?? 'No significance noted yet.'}</p>
			{#if data.evidence.notes}
				<h3 class="mt-4 mb-1 font-semibold">Notes</h3>
				<p class="whitespace-pre-wrap text-muted-foreground">{data.evidence.notes}</p>
			{/if}
		</Card>
		<Card class="p-4 text-sm">
			<h2 class="mb-2 font-semibold">Metadata</h2>
			<dl class="space-y-2 text-muted-foreground">
				<div><dt class="text-xs uppercase">Date</dt><dd>{fmtDate(data.evidence.dateStart)}{data.evidence.dateEnd ? ` – ${fmtDate(data.evidence.dateEnd)}` : ''}</dd></div>
				<div><dt class="text-xs uppercase">People</dt><dd>{data.evidence.peopleInvolved.join(', ') || '—'}</dd></div>
				<div><dt class="text-xs uppercase">Confidence</dt><dd>{data.evidence.confidenceScore}/5</dd></div>
				<div><dt class="text-xs uppercase">In packet</dt><dd>{data.evidence.includedInPacket ? 'Yes' : 'No'}</dd></div>
			</dl>
		</Card>
	</div>

	{#if data.evidence.files.length > 0}
		<section class="mt-6">
			<h3 class="mb-2 text-sm font-semibold text-muted-foreground">Linked files</h3>
			<ul class="space-y-1 text-sm">
				{#each data.evidence.files as ef (ef.file.id)}
					<li><a href={`/documents/${ef.file.id}`} class="text-primary underline-offset-4 hover:underline">{ef.file.title}</a> <span class="text-xs text-muted-foreground">— {ef.file.category}</span></li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}
