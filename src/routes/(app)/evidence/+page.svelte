<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Plus, Layers } from 'lucide-svelte';
	import { fmtDate } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const grouped = $derived(
		data.items.reduce<Record<string, typeof data.items>>((acc, it) => {
			(acc[it.type] ||= []).push(it);
			return acc;
		}, {})
	);

	function statusVariant(s: string) {
		if (s === 'READY') return 'success';
		if (s === 'NEEDS_BETTER_COPY' || s === 'NEEDS_TRANSLATION') return 'warning';
		return 'secondary';
	}
</script>

<PageHeader title="Evidence" description="Metadata-first library of relationship and supporting evidence.">
	{#snippet actions()}
		<Button href="/evidence/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New evidence{/snippet}
		</Button>
	{/snippet}
</PageHeader>

{#if data.gaps.length > 0}
	<Card class="mb-5 border-warning/40 bg-warning/5 p-4">
		<h2 class="text-sm font-semibold">Evidence gaps</h2>
		<p class="text-xs text-muted-foreground">Target counts below are guidance only, not legal requirements.</p>
		<ul class="mt-2 flex flex-wrap gap-2 text-xs">
			{#each data.gaps as g}
				<li class="rounded-full border border-border bg-card px-2 py-1">
					<span class="font-medium">{g.category}</span>
					<span class="text-muted-foreground"> — {g.have}/{g.target}</span>
				</li>
			{/each}
		</ul>
	</Card>
{/if}

<FilterBar
	filters={[
		{
			name: 'status',
			label: 'Status',
			options: [
				{ value: 'COLLECTED', label: 'Collected' },
				{ value: 'NEEDS_SCAN', label: 'Needs scan' },
				{ value: 'NEEDS_TRANSLATION', label: 'Needs translation' },
				{ value: 'NEEDS_BETTER_COPY', label: 'Needs better copy' },
				{ value: 'READY', label: 'Ready' }
			]
		},
		{
			name: 'type',
			label: 'Category',
			options: data.categories.map((c) => ({ value: c, label: c }))
		}
	]}
/>

{#if data.items.length === 0}
	<EmptyState title="No evidence yet" description="Add evidence items with metadata, descriptions, and links.">
		{#snippet icon()}<Layers class="h-8 w-8" />{/snippet}
		{#snippet actions()}<Button href="/evidence/new">Add evidence</Button>{/snippet}
	</EmptyState>
{:else}
	{#each Object.entries(grouped) as [type, items]}
		<section class="mb-6">
			<h2 class="mb-2 text-sm font-semibold text-muted-foreground">{type}</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each items as it (it.id)}
					<a href={`/evidence/${it.id}`} class="block">
						<Card class="p-4 hover:border-primary/40">
							<div class="flex items-start justify-between gap-2">
								<h3 class="font-medium">{it.title}</h3>
								<Badge variant={statusVariant(it.status)}>{titleCase(it.status)}</Badge>
							</div>
							{#if it.description}<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>{/if}
							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								{#if it.dateStart}<span>{fmtDate(it.dateStart)}{it.dateEnd ? ` – ${fmtDate(it.dateEnd)}` : ''}</span>{/if}
								{#if it.includedInPacket}<span class="text-success">In packet</span>{/if}
								<span>Confidence {it.confidenceScore}/5</span>
							</div>
						</Card>
					</a>
				{/each}
			</div>
		</section>
	{/each}
{/if}
