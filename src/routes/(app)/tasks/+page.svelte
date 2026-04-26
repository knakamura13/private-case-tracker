<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TaskCard from '$lib/components/tasks/TaskCard.svelte';
	import TaskCreateModal from '$lib/components/tasks/TaskCreateModal.svelte';
	import TaskEditModal from '$lib/components/tasks/TaskEditModal.svelte';
	import { Plus } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { showSuccessToast } from '$lib/stores/toast';
	import { getPageNumber } from '$lib/constants/navigation';
	import { cn } from '$lib/utils/cn';
	import type { PageData } from './$types';

	interface TasksPageData extends PageData {
		members: { id: string; name: string | null; email: string }[];
	}

	let { data, form }: { data: TasksPageData; form: { error?: string; errorId?: string } } = $props();

	let showCreateModal = $state(false);
	let defaultStatus = $state<string | undefined>(undefined);
	const editParam = $derived($page.url.searchParams.get('edit'));
	const editingTask = $derived(
		editParam && data.tasks.some((t) => t.id === editParam)
			? { id: editParam }
			: null
	);

	// Drag and drop state
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let dropPosition = $state<'before' | 'after' | null>(null);
	let dragEnterCount = $state(0);
	let isDragging = $state(false);


	async function updateUrl(id: string | null) {
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set('edit', id);
		} else {
			url.searchParams.delete('edit');
		}
		await goto(url.toString(), { replaceState: true, noScroll: true });
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

	// Drag and drop handlers
	function handleDragStart(event: DragEvent, id: string) {
		if (isDragging) return;
		isDragging = true;
		dropTargetId = null;
		dropPosition = null;
		dragEnterCount = 0;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', id);
			event.dataTransfer.setData('application/x-task-id', id);
		}
		setTimeout(() => {
			draggingId = id;
		}, 0);
	}

	function handleDragEnd() {
		draggingId = null;
		dropTargetId = null;
		dropPosition = null;
		dragEnterCount = 0;
		isDragging = false;
	}

	function handleDragEnter(event: DragEvent, id: string) {
		event.preventDefault();
		dragEnterCount++;
		if (draggingId && draggingId !== id) {
			dropTargetId = id;
		}
	}

	function handleDragOver(event: DragEvent, id: string) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		if (!draggingId || draggingId === id) return;

		// Calculate drop position
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;
		const pos = event.clientY < midpoint ? 'before' : 'after';

		// Check if this is the same as the current position
		const activeTask = data.tasks.find((t) => t.id === draggingId);
		const targetTask = data.tasks.find((t) => t.id === id);

		if (activeTask && targetTask && activeTask.status === targetTask.status) {
			const column = grouped.find((c) => c.id === activeTask.status);
			if (column) {
				const activeIdx = column.tasks.findIndex((t) => t.id === draggingId);
				const targetIdx = column.tasks.findIndex((t) => t.id === id);

				if (
					(targetIdx === activeIdx - 1 && pos === 'after') ||
					(targetIdx === activeIdx + 1 && pos === 'before')
				) {
					dropTargetId = null;
					dropPosition = null;
					return;
				}
			}
		}

		dropTargetId = id;
		dropPosition = pos;
	}

	function handleDragOverColumn(event: DragEvent, columnId: string) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		// If we reach here, it's because we're dragging over the column itself
		// and not a card (which would have stopped propagation)
		if (draggingId) {
			dropTargetId = columnId;
			dropPosition = null;
		}
	}

	function handleDragLeave() {
		dragEnterCount--;
		if (dragEnterCount <= 0) {
			dragEnterCount = 0;
			dropTargetId = null;
			dropPosition = null;
		}
	}

	async function handleDrop(event: DragEvent, targetId: string, targetStatus: string) {
		event.preventDefault();
		const activeId = draggingId;
		const position = dropPosition;
		draggingId = null;
		dropTargetId = null;
		dropPosition = null;
		dragEnterCount = 0;
		isDragging = false;
		if (!activeId || activeId === targetId) return;

		const activeTask = data.tasks.find((t) => t.id === activeId);
		if (!activeTask) return;

		// Get all tasks and their current order
		const allTasks = [...data.tasks];
		
		// Build new order array
		const updates: Array<{ id: string; status: string; order: number }> = [];
		
		if (activeTask.status !== targetStatus) {
			// Moving to different column: update both source and target columns
			
			// Update source column (remove the task)
			const sourceColumnTasks = allTasks.filter((t) => t.status === activeTask.status).sort((a, b) => a.order - b.order);
			sourceColumnTasks.forEach((t, idx) => {
				if (t.id !== activeId) {
					updates.push({ id: t.id, status: t.status, order: idx });
				}
			});
			
			// Update target column (insert the task at target position)
			const targetColumnTasks = allTasks.filter((t) => t.status === targetStatus).sort((a, b) => a.order - b.order);
			let targetIndex = targetColumnTasks.findIndex((t) => t.id === targetId);
			
			// Adjust index based on drop position
			if (position === 'after') {
				targetIndex = targetIndex + 1;
			}
			
			// Insert active task at target position
			targetColumnTasks.splice(targetIndex, 0, { ...activeTask, status: targetStatus });
			
			// Assign new order values for target column
			targetColumnTasks.forEach((t, idx) => {
				updates.push({ id: t.id, status: t.status, order: idx });
			});
		} else {
			// Reordering within same column
			const columnTasks = allTasks.filter((t) => t.status === targetStatus).sort((a, b) => a.order - b.order);
			let targetIndex = columnTasks.findIndex((t) => t.id === targetId);
			
			// Remove active task from array
			const newOrder = columnTasks.filter((t) => t.id !== activeId);
			
			// Adjust target index if the active task was before the target
			const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
			if (activeIndex < targetIndex && position !== 'after') {
				targetIndex = targetIndex - 1;
			} else if (position === 'after') {
				targetIndex = targetIndex + 1;
			}
			
			// Insert at target position
			newOrder.splice(targetIndex, 0, activeTask);
			
			// Assign new order values
			newOrder.forEach((t, idx) => {
				updates.push({ id: t.id, status: t.status, order: idx });
			});
		}

		try {
			const formData = new FormData();
			formData.append('updates', JSON.stringify(updates));
			const response = await fetch('?/reorder', { method: 'POST', body: formData });
			if (response.ok) {
				await invalidateAll();
			} else {
				console.error('Reorder failed:', response.statusText);
			}
		} catch (error) {
			console.error('Drag operation failed:', error);
		}
	}

	async function handleDropOnColumn(event: DragEvent, targetStatus: string) {
		event.preventDefault();
		const activeId = draggingId;
		draggingId = null;
		dropTargetId = null;
		dragEnterCount = 0;
		isDragging = false;
		if (!activeId) return;

		const activeTask = data.tasks.find((t) => t.id === activeId);
		if (!activeTask) return;
		if (activeTask.status === targetStatus) return;

		// Get all tasks and their current order
		const allTasks = [...data.tasks];
		
		// Build new order array
		const updates: Array<{ id: string; status: string; order: number }> = [];
		
		// Update source column (remove the task)
		const sourceColumnTasks = allTasks.filter((t) => t.status === activeTask.status).sort((a, b) => a.order - b.order);
		sourceColumnTasks.forEach((t, idx) => {
			if (t.id !== activeId) {
				updates.push({ id: t.id, status: t.status, order: idx });
			}
		});
		
		// Update target column (append the task at the end)
		const targetColumnTasks = allTasks.filter((t) => t.status === targetStatus).sort((a, b) => a.order - b.order);
		targetColumnTasks.push({ ...activeTask, status: targetStatus });
		
		// Assign new order values for target column
		targetColumnTasks.forEach((t, idx) => {
			updates.push({ id: t.id, status: t.status, order: idx });
		});

		try {
			const formData = new FormData();
			formData.append('updates', JSON.stringify(updates));
			const response = await fetch('?/reorder', { method: 'POST', body: formData });
			if (response.ok) {
				await invalidateAll();
			} else {
				console.error('Reorder failed:', response.statusText);
			}
		} catch (error) {
			console.error('Drag operation failed:', error);
		}
	}
</script>

<PageHeader title="Tasks" description="Personal todos and errands (not legal proceedings)." number={getPageNumber('/tasks')} />

<div class="flex gap-4 overflow-x-auto min-h-[calc(100vh-14rem)]">
	{#each grouped as column (column.id)}
		<div class="flex min-w-[300px] flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold">{column.label}</h2>
				<span class="text-sm text-muted-foreground">{column.tasks.length}</span>
			</div>
			<div
				class="flex flex-col rounded-lg transition-colors duration-200"
				ondragenter={(e) => handleDragEnter(e, column.id)}
				ondragover={(e) => handleDragOverColumn(e, column.id)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDropOnColumn(e, column.id)}
				role="list"
				aria-label={`${column.label} column`}
				aria-dropeffect="move"
			>
				{#each column.tasks as task (task.id)}
					<TaskCard
						task={task}
						onEdit={async (id: string) => {
							await updateUrl(id);
						}}
						draggable={true}
						onDragStart={handleDragStart}
						onDragEnter={handleDragEnter}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={(e: DragEvent, id: string) => handleDrop(e, id, column.id)}
						onDragEnd={handleDragEnd}
						isDragging={draggingId === task.id}
						isDropTarget={dropTargetId === task.id}
						isAnyDragging={draggingId !== null}
						dropPosition={dropTargetId === task.id ? dropPosition : null}
					/>
				{/each}
				{#if column.tasks.length === 0}
					<div
						class={cn(
							'rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground transition duration-200',
							dropTargetId === column.id
								? 'scale-[1.02] border-primary bg-primary/5 text-primary'
								: 'border-border'
						)}
					>
						{dropTargetId === column.id ? 'Drop here' : 'No tasks'}
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
				await updateUrl(null);
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
