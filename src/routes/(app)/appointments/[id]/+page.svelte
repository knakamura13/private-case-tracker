<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import AppointmentForm from '$lib/components/appointments/AppointmentForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDateTime } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
</script>

<PageHeader title={data.appointment.title}>
	{#snippet actions()}
		<Badge>{titleCase(data.appointment.type)}</Badge>
		<Badge variant="outline">{titleCase(data.appointment.status)}</Badge>
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
		<AppointmentForm
			initial={{
				title: data.appointment.title,
				type: data.appointment.type,
				status: data.appointment.status,
				scheduledAt: data.appointment.scheduledAt,
				durationMin: data.appointment.durationMin,
				location: data.appointment.location,
				confirmationDetails: data.appointment.confirmationDetails,
				attendees: data.appointment.attendees,
				notes: data.appointment.notes
			}}
			submitLabel="Save changes"
			error={form?.error}
		/>
	</form>
{:else}
	<Card class="p-4 text-sm">
		<dl class="grid grid-cols-1 gap-3 md:grid-cols-2">
			<div><dt class="text-xs uppercase text-muted-foreground">When</dt><dd>{fmtDateTime(data.appointment.scheduledAt)}</dd></div>
			<div><dt class="text-xs uppercase text-muted-foreground">Duration</dt><dd>{data.appointment.durationMin ? `${data.appointment.durationMin} min` : '—'}</dd></div>
			<div><dt class="text-xs uppercase text-muted-foreground">Location</dt><dd>{data.appointment.location ?? '—'}</dd></div>
			<div><dt class="text-xs uppercase text-muted-foreground">Confirmation</dt><dd>{data.appointment.confirmationDetails ?? '—'}</dd></div>
			<div class="md:col-span-2"><dt class="text-xs uppercase text-muted-foreground">Attendees</dt><dd>{data.appointment.attendees.join(', ') || '—'}</dd></div>
			{#if data.appointment.notes}<div class="md:col-span-2"><dt class="text-xs uppercase text-muted-foreground">Notes</dt><dd class="whitespace-pre-wrap">{data.appointment.notes}</dd></div>{/if}
		</dl>
	</Card>
{/if}
