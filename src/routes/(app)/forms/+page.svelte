<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Plus, FileText, ClipboardList } from 'lucide-svelte';
	import { fmtDate } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function statusVariant(status: string) {
		if (status === 'FILED' || status === 'RECEIVED') return 'success';
		if (status === 'READY_FOR_REVIEW') return 'warning';
		if (status === 'REPLACED' || status === 'NOT_NEEDED') return 'secondary';
		return 'default';
	}
</script>

<PageHeader title="Forms" description="Track filing status, planned dates, and supporting items.">
	{#snippet actions()}
		<Button variant="outline" href="/forms/packet">
			{#snippet children()}<ClipboardList class="h-4 w-4" /> Packet view{/snippet}
		</Button>
		<Button href="/forms/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New form{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<FilterBar
	filters={[
		{
			name: 'status',
			label: 'Filing status',
			options: [
				{ value: 'NOT_STARTED', label: 'Not started' },
				{ value: 'IN_PROGRESS', label: 'In progress' },
				{ value: 'READY_FOR_REVIEW', label: 'Ready for review' },
				{ value: 'FILED', label: 'Filed' },
				{ value: 'RECEIVED', label: 'Received' },
				{ value: 'REPLACED', label: 'Replaced' },
				{ value: 'NOT_NEEDED', label: 'Not needed' }
			]
		}
	]}
/>

{#if data.forms.length === 0}
	<EmptyState title="No forms yet" description="Add forms to track filing and supporting evidence.">
		{#snippet icon()}<FileText class="h-8 w-8" />{/snippet}
		{#snippet actions()}<Button href="/forms/new">Add a form</Button>{/snippet}
	</EmptyState>
{:else}
	<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
		{#each data.forms as form (form.id)}
			<a href={`/forms/${form.id}`} class="block">
				<Card class="p-4 hover:border-primary/40">
					<div class="flex items-start justify-between gap-2">
						<div>
							<p class="text-xs font-mono uppercase text-muted-foreground">{form.code}</p>
							<h3 class="font-semibold">{form.name}</h3>
							{#if form.purpose}<p class="mt-1 text-sm text-muted-foreground">{form.purpose}</p>{/if}
						</div>
						<Badge variant={statusVariant(form.filingStatus)}>{titleCase(form.filingStatus)}</Badge>
					</div>
					<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
						{#if form.plannedFilingDate}<span>Plan: {fmtDate(form.plannedFilingDate)}</span>{/if}
						{#if form.actualFilingDate}<span>Filed: {fmtDate(form.actualFilingDate)}</span>{/if}
						{#if form.receiptMask}<span>Receipt: {form.receiptMask}</span>{/if}
						<span>Supporting: {form.supportingItems.length}</span>
						<span>Docs: {form._count.documents}</span>
					</div>
				</Card>
			</a>
		{/each}
	</div>
{/if}
