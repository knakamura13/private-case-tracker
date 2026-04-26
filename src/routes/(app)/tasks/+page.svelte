<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TaskCard from '$lib/components/tasks/TaskCard.svelte';
	import { Plus } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface TasksPageData extends PageData {
		members: { id: string; name: string | null; email: string }[];
	}

	let { data }: { data: TasksPageData } = $props();

	const COLUMNS = [
		{ id: 'TODO', label: 'To Do', color: 'bg-muted' },
		{ id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-warning/20' },
		{ id: 'ON_HOLD', label: 'On Hold', color: 'bg-secondary/20' },
		{ id: 'DONE', label: 'Done', color: 'bg-success/20' }
	] as const;

	const grouped = $derived(
		COLUMNS.map((col) => ({
			...col,
			tasks: data.tasks
				.filter((t) => t.status === col.id)
				.sort((a, b) => a.order - b.order)
				.map((t) => ({
					...t,
					owner: t.ownerId ? { id: t.ownerId, name: null, email: '' } : null
				}))
		}))
	);
</script>

<PageHeader title="Tasks" description="Personal todos and errands (not legal proceedings)." number="03">
	{#snippet actions()}
		<Button href="/tasks/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New task{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<div class="flex gap-4 overflow-x-auto pb-4">
	{#each grouped as column (column.id)}
		<div class="flex min-w-[300px] flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold">{column.label}</h2>
				<span class="text-sm text-muted-foreground">{column.tasks.length}</span>
			</div>
			<div class="flex-1 space-y-2">
				{#each column.tasks as task (task.id)}
					<TaskCard
						task={task}
						onEdit={(id) => (window.location.href = `/tasks/${id}`)}
					/>
				{/each}
				{#if column.tasks.length === 0}
					<div class="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
						No tasks
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
