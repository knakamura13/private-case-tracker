<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import MilestoneForm from '$lib/components/timeline/MilestoneForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
	import { Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import { PHASE_LABELS } from '$lib/constants/phases';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
</script>

<PageHeader title={data.milestone.title} description={PHASE_LABELS[data.milestone.phase as keyof typeof PHASE_LABELS]}>
	{#snippet actions()}
		<Badge>{titleCase(data.milestone.status)}</Badge>
		<Badge variant="outline">{titleCase(data.milestone.priority)}</Badge>
		<Button variant="outline" onclick={() => (editing = !editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

{#if editing}
	<MilestoneForm
		action="?/update"
		onenhance={() => async ({ update }) => {
			await update();
			editing = false;
		}}
		members={data.members}
		initial={{
			title: data.milestone.title,
			description: data.milestone.description,
			phase: data.milestone.phase,
			status: data.milestone.status,
			priority: data.milestone.priority,
			ownerId: data.milestone.owner?.id,
			dueDate: data.milestone.dueDate,
			notes: data.milestone.notes
		}}
		submitLabel="Save changes"
		error={form?.error}
		errorId={form?.errorId}
	/>
{:else}
	<div class="grid gap-6 md:grid-cols-3">
		<Card class="p-4 text-sm md:col-span-2">
			{#if data.milestone.description}<MarkdownRenderer content={data.milestone.description} class="text-muted-foreground prose prose-sm max-w-none" />{/if}
			{#if data.milestone.notes}
				<h3 class="mt-3 font-semibold">Notes</h3>
				<MarkdownRenderer content={data.milestone.notes} class="text-muted-foreground prose prose-sm max-w-none" />
			{/if}
		</Card>
		<Card class="p-4 text-sm">
			<dl class="space-y-2 text-muted-foreground">
				<div><dt class="text-xs uppercase">Due</dt><dd>{fmtDate(data.milestone.dueDate)}</dd></div>
				<div><dt class="text-xs uppercase">Owner</dt><dd>{data.milestone.owner?.name ?? data.milestone.owner?.email ?? 'Unassigned'}</dd></div>
				{#if data.milestone.completedAt}<div><dt class="text-xs uppercase">Completed</dt><dd>{fmtDate(data.milestone.completedAt)}</dd></div>{/if}
			</dl>
		</Card>
	</div>

	{#if data.milestone.tasks.length > 0}
		<section class="mt-6">
			<h3 class="mb-2 text-sm font-semibold">Linked tasks</h3>
			<ul class="space-y-1 text-sm">
				{#each data.milestone.tasks as t (t.id)}
					<li><a href={`/tasks/${t.id}`} class="text-primary underline-offset-4 hover:underline">{t.title}</a></li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}
