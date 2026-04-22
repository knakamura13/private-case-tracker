<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Plus, CalendarDays } from 'lucide-svelte';
	import { fmtDateTime, daysUntil } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	function rangeHref(r: 'upcoming' | 'past') {
		const u = new URL($page.url);
		u.searchParams.set('range', r);
		return u.pathname + '?' + u.searchParams.toString();
	}
</script>

<PageHeader title="Appointments" description="Upcoming and past appointments.">
	{#snippet actions()}
		<Button href="/appointments/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New appointment{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<div class="mb-4 inline-flex rounded-md border border-border bg-muted/30 p-1 text-sm">
	<a href={rangeHref('upcoming')} class={`rounded px-3 py-1 ${data.range !== 'past' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Upcoming</a>
	<a href={rangeHref('past')} class={`rounded px-3 py-1 ${data.range === 'past' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Past</a>
</div>

<FilterBar
	filters={[
		{
			name: 'type',
			label: 'Type',
			options: [
				{ value: 'CIVIL_MARRIAGE', label: 'Civil marriage' },
				{ value: 'BIOMETRICS', label: 'Biometrics' },
				{ value: 'INTERVIEW', label: 'Interview' },
				{ value: 'MEDICAL_EXAM', label: 'Medical exam' },
				{ value: 'ATTORNEY_CONSULT', label: 'Attorney consult' },
				{ value: 'TRANSLATION_OR_NOTARY', label: 'Translation/notary' },
				{ value: 'DOCUMENT_PICKUP', label: 'Document pickup' },
				{ value: 'OTHER', label: 'Other' }
			]
		},
		{
			name: 'status',
			label: 'Status',
			options: [
				{ value: 'SCHEDULED', label: 'Scheduled' },
				{ value: 'CONFIRMED', label: 'Confirmed' },
				{ value: 'COMPLETED', label: 'Completed' },
				{ value: 'CANCELED', label: 'Canceled' },
				{ value: 'RESCHEDULED', label: 'Rescheduled' },
				{ value: 'MISSED', label: 'Missed' }
			]
		}
	]}
/>

{#if data.appointments.length === 0}
	<EmptyState title="No appointments yet" description="Track biometrics, interviews, attorney meetings, and more.">
		{#snippet icon()}<CalendarDays class="h-8 w-8" />{/snippet}
		{#snippet actions()}<Button href="/appointments/new">New appointment</Button>{/snippet}
	</EmptyState>
{:else}
	<ul class="space-y-3">
		{#each data.appointments as a (a.id)}
			{@const d = daysUntil(a.scheduledAt)}
			<li>
				<a href={`/appointments/${a.id}`}>
					<Card class="flex items-start gap-4 p-4 hover:border-primary/40">
						<div class="text-center">
							<p class="text-xs text-muted-foreground">{fmtDateTime(a.scheduledAt).split(' at ')[0]}</p>
							<p class="text-sm font-semibold">{fmtDateTime(a.scheduledAt).split(' at ')[1] ?? ''}</p>
							{#if d !== null && data.range !== 'past'}
								<Badge variant={d < 0 ? 'destructive' : d < 7 ? 'warning' : 'secondary'} class="mt-1 text-[10px]">
									{d < 0 ? `${-d}d ago` : d === 0 ? 'Today' : `in ${d}d`}
								</Badge>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<p class="truncate font-medium">{a.title}</p>
								<Badge>{titleCase(a.type)}</Badge>
								<Badge variant="outline">{titleCase(a.status)}</Badge>
							</div>
							{#if a.location}<p class="mt-1 truncate text-sm text-muted-foreground">{a.location}</p>{/if}
						</div>
					</Card>
				</a>
			</li>
		{/each}
	</ul>
{/if}
