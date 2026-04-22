<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TaskCard from '$lib/components/tasks/TaskCard.svelte';
	import { Plus, List } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { TaskStatus } from '@prisma/client';

	let { data }: { data: PageData } = $props();

	const COLUMNS: { status: TaskStatus; label: string }[] = [
		{ status: 'TODO', label: 'To do' },
		{ status: 'IN_PROGRESS', label: 'In progress' },
		{ status: 'BLOCKED', label: 'Blocked' },
		{ status: 'DONE', label: 'Done' }
	];

	type BoardTask = (typeof data.tasks)[number];
	let columns = $state<Record<TaskStatus, BoardTask[]>>({
		TODO: [],
		IN_PROGRESS: [],
		BLOCKED: [],
		DONE: [],
		ARCHIVED: []
	});

	$effect(() => {
		const fresh: Record<TaskStatus, BoardTask[]> = {
			TODO: [],
			IN_PROGRESS: [],
			BLOCKED: [],
			DONE: [],
			ARCHIVED: []
		};
		for (const t of data.tasks) fresh[t.status].push(t);
		columns = fresh;
	});

	let draggingId: string | null = null;

	function onDragStart(e: DragEvent, id: string) {
		draggingId = id;
		e.dataTransfer?.setData('text/plain', id);
	}

	async function onDropTo(status: TaskStatus, e: DragEvent) {
		e.preventDefault();
		const id = draggingId ?? e.dataTransfer?.getData('text/plain');
		if (!id) return;
		// Move optimistically in-memory
		const all = Object.values(columns).flat();
		const task = all.find((t) => t.id === id);
		if (!task) return;
		task.status = status;
		const fresh: Record<TaskStatus, BoardTask[]> = {
			TODO: [],
			IN_PROGRESS: [],
			BLOCKED: [],
			DONE: [],
			ARCHIVED: []
		};
		for (const t of all) fresh[t.status].push(t);
		columns = fresh;
		const updates: { id: string; status: TaskStatus; order: number }[] = [];
		for (const [s, tasks] of Object.entries(columns) as [TaskStatus, BoardTask[]][]) {
			tasks.forEach((t, idx) => updates.push({ id: t.id, status: s, order: idx }));
		}
		await fetch('?/reorder', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-sveltekit-action': 'true' },
			body: JSON.stringify({ updates })
		});
		await invalidateAll();
		draggingId = null;
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
	}
</script>

<PageHeader title="Task board" description="Drag cards between columns to change status.">
	{#snippet actions()}
		<Button variant="outline" size="sm" href="/tasks">
			{#snippet children()}<List class="h-4 w-4" /> List{/snippet}
		</Button>
		<Button href="/tasks/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New task{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each COLUMNS as col (col.status)}
		<div
			class="rounded-lg border border-border bg-muted/30 p-3"
			role="list"
			aria-label={col.label}
			ondrop={(e) => onDropTo(col.status, e)}
			ondragover={onDragOver}
		>
			<div class="mb-2 flex items-center justify-between">
				<h2 class="text-sm font-semibold">{col.label}</h2>
				<span class="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
					{columns[col.status].length}
				</span>
			</div>
			<ul class="space-y-2">
				{#each columns[col.status] as task (task.id)}
					<li draggable="true" ondragstart={(e) => onDragStart(e, task.id)}>
						<TaskCard {task} compact />
					</li>
				{/each}
			</ul>
			{#if columns[col.status].length === 0}
				<p class="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">Drop here</p>
			{/if}
		</div>
	{/each}
</div>
