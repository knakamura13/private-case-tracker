<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import TaskForm from '$lib/components/tasks/TaskForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
	import { Trash2, Check } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDateTime } from '$lib/utils/dates';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state(false);
	let checklistItems = $state<{ text: string; done: boolean }[]>([]);
	$effect(() => {
		checklistItems = (data.task.checklist ?? []).map((c) => ({ text: c.text, done: c.done }));
	});
	let newItemText = $state('');

	const formOptions = $derived(data.forms.map((f) => ({ id: f.id, label: `${f.code} — ${f.name}` })));
	const evidenceOptions = $derived(data.evidence.map((e) => ({ id: e.id, label: e.title })));
	const appointmentOptions = $derived(data.appointments.map((a) => ({ id: a.id, label: a.title })));
	const milestoneOptions = $derived(
		data.milestones.map((m) => ({ id: m.id, label: `${m.phase.replaceAll('_', ' ')} — ${m.title}` }))
	);

	function addChecklistItem() {
		const t = newItemText.trim();
		if (!t) return;
		checklistItems = [...checklistItems, { text: t, done: false }];
		newItemText = '';
	}
</script>

<PageHeader title={data.task.title}>
	{#snippet description()}
		{#if data.task.description}
			<MarkdownRenderer content={data.task.description} class="prose prose-sm max-w-none" />
		{/if}
	{/snippet}
	{#snippet actions()}
		<Badge>{data.task.status.replaceAll('_', ' ').toLowerCase()}</Badge>
		<Badge variant="outline">{data.task.priority.toLowerCase()}</Badge>
		<Button variant="outline" onclick={() => (editing = !editing)}>
			{editing ? 'Cancel' : 'Edit'}
		</Button>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

{#if editing}
	<div class="mb-8">
		<TaskForm
			action="?/update"
			onenhance={() => async ({ update }) => {
				await update();
				editing = false;
			}}
			initial={{
				title: data.task.title,
				description: data.task.description,
				dueDate: data.task.dueDate,
				priority: data.task.priority,
				status: data.task.status,
				ownerId: data.task.owner?.id,
				linkedFormId: data.task.form?.id,
				linkedEvidenceId: data.task.evidence?.id,
				linkedAppointmentId: data.task.appointment?.id,
				linkedMilestoneId: data.task.milestone?.id
			}}
			forms={formOptions}
			evidence={evidenceOptions}
			appointments={appointmentOptions}
			milestones={milestoneOptions}
			members={data.members}
			submitLabel="Save changes"
			error={form?.error}
			errorId={form?.errorId}
		/>
	</div>
{:else}
	<div class="grid gap-6 md:grid-cols-3">
		<Card class="md:col-span-2 p-4">
			<h2 class="text-base font-semibold">Checklist</h2>
			<form method="post" action="?/checklist" use:enhance class="mt-3 space-y-2">
				{#each checklistItems as item, i}
					<label class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40">
						<input
							type="checkbox"
							name={`items[${i}][done]`}
							checked={item.done}
							onchange={(e) => { const row = checklistItems[i]; if (row) row.done = (e.currentTarget as HTMLInputElement).checked; }}
						/>
						<input type="hidden" name={`items[${i}][text]`} value={item.text} />
						<span class={item.done ? 'text-muted-foreground line-through' : ''}>{item.text}</span>
						<button
							type="button"
							class="ml-auto text-xs text-muted-foreground hover:text-destructive"
							onclick={() => (checklistItems = checklistItems.filter((_, idx) => idx !== i))}
						>Remove</button>
					</label>
				{/each}
				<div class="flex items-center gap-2">
					<Input placeholder="Add checklist item" bind:value={newItemText} />
					<Button type="button" variant="outline" onclick={addChecklistItem}>
						{#snippet children()}<Check class="h-4 w-4" /> Add{/snippet}
					</Button>
				</div>
				<Button type="submit" size="sm">Save checklist</Button>
			</form>
		</Card>
		<Card class="p-4 text-sm">
			<h2 class="mb-2 text-base font-semibold">Details</h2>
			<dl class="space-y-2 text-muted-foreground">
				<div><dt class="text-xs uppercase">Due</dt><dd>{data.task.dueDate ? fmtDateTime(data.task.dueDate) : '—'}</dd></div>
				<div><dt class="text-xs uppercase">Owner</dt><dd>{data.task.owner?.name ?? data.task.owner?.email ?? 'Unassigned'}</dd></div>
				{#if data.task.form}<div><dt class="text-xs uppercase">Form</dt><dd><a class="text-primary underline-offset-4 hover:underline" href={`/forms/${data.task.form.id}`}>{data.task.form.code} — {data.task.form.name}</a></dd></div>{/if}
				{#if data.task.evidence}<div><dt class="text-xs uppercase">Evidence</dt><dd><a class="text-primary underline-offset-4 hover:underline" href={`/evidence/${data.task.evidence.id}`}>{data.task.evidence.title}</a></dd></div>{/if}
				{#if data.task.appointment}<div><dt class="text-xs uppercase">Appointment</dt><dd><a class="text-primary underline-offset-4 hover:underline" href={`/appointments/${data.task.appointment.id}`}>{data.task.appointment.title}</a></dd></div>{/if}
				{#if data.task.milestone}<div><dt class="text-xs uppercase">Milestone</dt><dd><a class="text-primary underline-offset-4 hover:underline" href={`/timeline#${data.task.milestone.id}`}>{data.task.milestone.title}</a></dd></div>{/if}
				<div><dt class="text-xs uppercase">Last updated</dt><dd>{fmtDateTime(data.task.updatedAt)}</dd></div>
			</dl>
		</Card>
	</div>
{/if}
