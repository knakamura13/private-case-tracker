<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TaskCard from '$lib/components/tasks/TaskCard.svelte';
	import TaskCreateModal from '$lib/components/tasks/TaskCreateModal.svelte';
	import TaskEditModal from '$lib/components/tasks/TaskEditModal.svelte';
	import { Plus } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { showSuccessToast } from '$lib/stores/toast';
	import type { PageData } from './$types';

	interface TasksPageData extends PageData {
		members: { id: string; name: string | null; email: string }[];
	}

	let { data, form }: { data: TasksPageData; form: { error?: string; errorId?: string } } = $props();

	let showCreateModal = $state(false);
	let defaultStatus = $state<string | undefined>(undefined);
	let editingTask = $state<{ id: string } | null>(null);

	$effect(() => {
		const editParam = $page.url.searchParams.get('edit');
		if (editParam && !editingTask) {
			const taskExists = data.tasks.some((t) => t.id === editParam);
			if (taskExists) {
				editingTask = { id: editParam };
			} else {
				updateUrl(null);
			}
		} else if (!editParam && editingTask) {
			editingTask = null;
		} else if (editParam && editingTask) {
			// Validate that the task still exists while modal is open
			const taskExists = data.tasks.some((t) => t.id === editParam);
			if (!taskExists) {
				editingTask = null;
				updateUrl(null);
			}
		}
	});

	function updateUrl(id: string | null) {
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set('edit', id);
		} else {
			url.searchParams.delete('edit');
		}
		window.history.replaceState({}, '', url.toString());
	}

	const COLUMNS = [
		{ id: 'TODO', label: 'To Do', color: 'bg-muted' },
		{ id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-warning/20' },
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

<PageHeader title="Tasks" description="Personal todos and errands (not legal proceedings)." number="03" />

<div class="flex gap-4 overflow-x-auto min-h-[calc(100vh-14rem)]">
	{#each grouped as column (column.id)}
		<div class="flex min-w-[300px] flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold">{column.label}</h2>
				<span class="text-sm text-muted-foreground">{column.tasks.length}</span>
			</div>
			<div class="space-y-2">
				{#each column.tasks as task (task.id)}
					<TaskCard
						task={task}
						onEdit={(id) => {
							editingTask = { id };
							updateUrl(id);
						}}
					/>
				{/each}
				{#if column.tasks.length === 0}
					<div class="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
						No tasks
					</div>
				{/if}
			</div>
			<Button
				variant="ghost"
				class="w-full justify-start text-muted-foreground hover:text-foreground"
				onclick={() => {
					defaultStatus = column.id;
					showCreateModal = true;
				}}
			>
				{#snippet children()}<Plus class="h-4 w-4 mr-2" /> Add a card{/snippet}
			</Button>
		</div>
	{/each}
</div>

{#if editingTask}
	{@const task = data.tasks.find((t) => t.id === editingTask?.id)}
	{#if task}
		<TaskEditModal
			open={true}
			onClose={async () => {
				editingTask = null;
				updateUrl(null);
			}}
			action="?/update"
			deleteAction="?/delete"
			onenhance={({ formData, cancel }: { formData: FormData; cancel: () => void }) => {
				return async () => {
					const response = await fetch('?/update', { method: 'POST', body: formData });
					if (response.ok) {
						await invalidateAll();
						showSuccessToast('Task updated successfully');
					} else {
						cancel();
					}
				};
			}}
			members={data.members}
			initial={{
				id: task.id,
				title: task.title,
				description: task.description,
				status: task.status,
				priority: task.priority,
				ownerId: task.ownerId,
				dueDate: task.dueDate,
				checklist: task.checklist
			}}
			error={form?.error}
			errorId={form?.errorId}
		/>
	{/if}
{/if}

{#if showCreateModal}
	<TaskCreateModal
		open={true}
		onClose={() => {
			showCreateModal = false;
			defaultStatus = undefined;
		}}
		action="?/create"
		members={data.members}
		defaultStatus={defaultStatus}
		error={form?.error}
		errorId={form?.errorId}
		onenhance={() => {
			return async ({ result }: { result: { type: string } }) => {
				if (result.type === 'success') {
					showCreateModal = false;
					defaultStatus = undefined;
					await invalidateAll();
					showSuccessToast('Task created successfully');
				}
			};
		}}
	/>
{/if}
