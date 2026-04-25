<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StatusBadge from '$lib/components/signature/StatusBadge.svelte';
	import { HelpCircle, Plus } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function sectionVariant(source: string) {
		if (['ATTORNEY', 'NONPROFIT', 'USCIS_SITE', 'COUNTY_SITE'].includes(source)) return 'success';
		if (source === 'COMMUNITY') return 'warning';
		return 'secondary';
	}

	const sections = $derived([
		{ label: 'Official sources', subtitle: 'Attorney, nonprofit, or government-site answers.', items: data.official },
		{ label: 'Community / anecdotal', subtitle: 'Forum and community sources — not authoritative.', items: data.community },
		{ label: 'Other', subtitle: 'Uncategorized.', items: data.other }
	]);
</script>

<PageHeader title="Questions" description="Track unresolved questions, their sources, and answers." number="04">
	{#snippet actions()}
		<Button href="/questions/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New question{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<FilterBar
	filters={[
		{
			name: 'status',
			label: 'Status',
			options: [
				{ value: 'OPEN', label: 'Open' },
				{ value: 'RESEARCHING', label: 'Researching' },
				{ value: 'ANSWERED', label: 'Answered' },
				{ value: 'WONT_FIX', label: "Won't pursue" }
			]
		},
		{
			name: 'source',
			label: 'Source',
			options: [
				{ value: 'ATTORNEY', label: 'Attorney' },
				{ value: 'NONPROFIT', label: 'Nonprofit' },
				{ value: 'USCIS_SITE', label: 'USCIS site' },
				{ value: 'COUNTY_SITE', label: 'County site' },
				{ value: 'COMMUNITY', label: 'Community' },
				{ value: 'OTHER', label: 'Other' }
			]
		}
	]}
/>

{#if data.items.length === 0}
	<EmptyState title="No questions yet" description="Capture open questions — you can answer them later and track the source.">
		{#snippet icon()}<HelpCircle class="h-8 w-8" />{/snippet}
		{#snippet actions()}<Button href="/questions/new">New question</Button>{/snippet}
	</EmptyState>
{:else}
	{#each sections as section}
		{#if section.items.length > 0}
			<section class="mb-6">
				<h2 class="text-sm font-semibold">{section.label}</h2>
				<p class="mb-2 text-xs text-muted-foreground">{section.subtitle}</p>
				<ul class="space-y-2">
					{#each section.items as q, i (q.id)}
						<li in:fly={{ y: 30, duration: 500, delay: i * 50 + 100, easing: cubicOut }}>
							<a href={`/questions/${q.id}`}>
								<Card class="p-3 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 hover:bg-card/90">
									<div class="flex items-start justify-between gap-2">
										<p class="text-sm">{q.question}</p>
										<Badge variant={sectionVariant(q.sourceType)}>{titleCase(q.sourceType)}</Badge>
									</div>
									<div class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
										<StatusBadge variant="neutral" status={titleCase(q.status)} />
										<Badge variant="outline">{titleCase(q.priority)}</Badge>
										{#if q.category}<span>{q.category}</span>{/if}
									</div>
								</Card>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}
{/if}
