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
	class="group relative py-1"
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
		<div class="pointer-events-none absolute top-0 left-0 right-0 z-20 h-1 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-opacity duration-200 animate-pulse"></div>
	{/if}

	<div
		class={cn(
			'relative z-10 cursor-pointer rounded-lg border border-border transition duration-200 ease-out',
			!isAnyDragging &&
				'hover:bg-card/90 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 dark:hover:shadow-primary/20',
			isDragging && 'opacity-50'
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
		<div class="flex items-center gap-3">
			<GripVertical class="h-4 w-4 shrink-0 text-muted-foreground hidden md:block" />
			<div class="min-w-0 flex-1">
				<p class="line-clamp-2 font-medium">{task.title}</p>
				{#if task.priority !== 'MEDIUM'}
					<Badge variant="outline" class="shrink-0">{titleCase(task.priority)}</Badge>
				{/if}
				{#if hasMeaningfulDescription(task.description)}
					<RichText text={task.description} lineClamp={true} class="mt-1" />
				{/if}
				{#if task.checklist && task.checklist.length > 0}
					<div class="mt-2">
						<div class="mb-1 text-xs text-muted-foreground">
							{task.checklist.filter((ci) => ci.done).length}/{task.checklist.length} checklist items
						</div>
						<ul class="space-y-1">
							{#each task.checklist.slice(0, 3) as ci (ci.id)}
								<li class="flex items-center gap-2 text-sm">
									<input type="checkbox" checked={ci.done} disabled class="h-3.5 w-3.5 rounded border-border" />
									<span class={ci.done ? 'line-through text-muted-foreground' : ''}>{ci.text}</span>
								</li>
							{/each}
							{#if task.checklist.length > 3}
								<li class="text-xs text-muted-foreground">+{task.checklist.length - 3} more</li>
							{/if}
						</ul>
					</div>
				{/if}
				{#if task.dueDate || ownerLabel(task.owner)}
					<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						{#if task.dueDate}<span>Due {fmtDate(task.dueDate)}</span>{/if}
						{#if ownerLabel(task.owner)}<span>{ownerLabel(task.owner)}</span>{/if}
					</div>
				{/if}
			</div>
		</div>
		</Card>
	</div>

	{#if isDropTarget && dropPosition === 'after'}
		<div class="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-1 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-opacity duration-200 animate-pulse"></div>
	{/if}
</div>
