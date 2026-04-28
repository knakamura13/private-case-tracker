<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import RichText from '$lib/components/ui/RichText.svelte';
	import { titleCase } from '$lib/utils/format';
	import { fmtDate } from '$lib/utils/dates';
	import { GripVertical } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	let {
		task,
		onEdit,
		draggable = false,
		onDragStart,
		onDragEnter,
		onDragOver,
		onDragLeave,
		onDrop,
		onDragEnd,
		isDragging = false,
		isDropTarget = false,
		isAnyDragging = false,
		dropPosition = null
	}: {
		task: {
			id: string;
			title: string;
			description: string | null;
			status: string;
			priority: string;
			dueDate: string | null;
			owner: { id: string; name: string | null; email: string } | null;
			checklist?: Array<{ id: string; text: string; done: boolean }>;
		};
		onEdit?: (id: string) => void;
		draggable?: boolean;
		onDragStart?: (e: DragEvent, id: string) => void;
		onDragEnter?: (e: DragEvent, id: string) => void;
		onDragOver?: (e: DragEvent, id: string) => void;
		onDragLeave?: () => void;
		onDrop?: (e: DragEvent, id: string, status: string) => void;
		onDragEnd?: () => void;
		isDragging?: boolean;
		isDropTarget?: boolean;
		isAnyDragging?: boolean;
		dropPosition?: 'before' | 'after' | null;
	} = $props();

	function hasMeaningfulDescription(description: string | null) {
		return /[\p{L}\p{N}]/u.test(description?.trim() ?? '');
	}

	function ownerLabel(owner: { id: string; name: string | null; email: string } | null) {
		return owner?.name?.trim() || owner?.email?.trim() || '';
	}
</script>

<div
	class="task-card"
	role="listitem"
	ondragenter={(e) => {
		if (onDragEnter) {
			e.stopPropagation();
			onDragEnter(e, task.id);
		}
	}}
	ondragover={(e) => {
		if (onDragOver) {
			e.stopPropagation();
			onDragOver(e, task.id);
		}
	}}
	ondragleave={() => onDragLeave && onDragLeave()}
	ondrop={(e) => onDrop && onDrop(e, task.id, task.status)}
>
	{#if isDropTarget && dropPosition === 'before'}
		<div class="task-card-drop-indicator"></div>
	{/if}

	<div
		class={cn(
			'task-card-inner',
			!isAnyDragging && '',
			isDragging && 'task-card-dragging'
		)}
		draggable={draggable}
		data-task-id={task.id}
		ondragstart={(e) => onDragStart && onDragStart(e, task.id)}
		ondragend={() => onDragEnd && onDragEnd()}
		onclick={() => onEdit && onEdit(task.id)}
		onkeydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && onEdit) {
				e.preventDefault();
				onEdit(task.id);
			}
		}}
		role="button"
		tabindex="0"
		aria-label={task.title}
	>
		<Card class="p-4 border-none shadow-none bg-transparent">
		<div class="task-card-content">
			<GripVertical class="task-card-grip h-4 w-4 shrink-0 text-muted-foreground" />
			<div class="task-card-body">
				<p class="task-card-title">{task.title}</p>
				{#if task.priority !== 'MEDIUM'}
					<Badge variant="outline" class="shrink-0">{titleCase(task.priority)}</Badge>
				{/if}
				{#if hasMeaningfulDescription(task.description)}
					<RichText text={task.description} lineClamp={true} class="mt-1" />
				{/if}
				{#if task.checklist && task.checklist.length > 0}
					<div class="task-card-checklist">
						<div class="task-card-checklist-summary">
							{task.checklist.filter((ci) => ci.done).length}/{task.checklist.length} checklist items
						</div>
						<ul class="task-card-checklist-list">
							{#each task.checklist.slice(0, 3) as ci (ci.id)}
								<li class="task-card-checklist-item">
									<input type="checkbox" checked={ci.done} disabled class="task-card-checklist-checkbox" />
									<span class={ci.done ? 'task-card-checklist-text-done' : ''}>{ci.text}</span>
								</li>
							{/each}
							{#if task.checklist.length > 3}
								<li class="task-card-checklist-more">+{task.checklist.length - 3} more</li>
							{/if}
						</ul>
					</div>
				{/if}
				{#if task.dueDate || ownerLabel(task.owner)}
					<div class="task-card-meta">
						{#if task.dueDate}<span>Due {fmtDate(task.dueDate)}</span>{/if}
						{#if ownerLabel(task.owner)}<span>{ownerLabel(task.owner)}</span>{/if}
					</div>
				{/if}
			</div>
		</div>
		</Card>
	</div>

	{#if isDropTarget && dropPosition === 'after'}
		<div class="task-card-drop-indicator task-card-drop-indicator-bottom"></div>
	{/if}
</div>
