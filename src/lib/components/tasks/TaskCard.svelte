<script lang="ts">
    import Card from '$lib/components/ui/Card.svelte';
    import { fmtDate } from '$lib/utils/dates';
    import { Calendar } from 'lucide-svelte';

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

    const isOverdue = $derived(
        task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
    );

    const taskCardClasses = $derived(
        `task-card-inner ${!isAnyDragging ? 'task-card-hoverable' : ''} ${isDragging ? 'task-card-dragging' : ''} ${task.status === 'DONE' ? 'task-card-done' : ''}`.trim()
    );
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
        class={taskCardClasses}
        {draggable}
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
        <Card class="task-card-body task-card-border-none task-card-shadow-none task-card-bg-transparent">
            {#if isOverdue}
                <div class="task-card-overdue">● overdue</div>
            {/if}
            <p class="task-card-title">{task.title}</p>
            {#if hasMeaningfulDescription(task.description)}
                <div class="task-card-description task-card-description--clamped">{task.description}</div>
            {/if}
            {#if task.checklist && task.checklist.length > 0}
                <div class="task-card-checklist">
                    <div class="task-card-checklist-summary">
                        {task.checklist.filter((ci) => ci.done).length}/{task.checklist.length}
                    </div>
                </div>
            {/if}
            <div class="task-card-footer">
                {#if task.dueDate}
                    <div class="task-card-due mono">
                        <Calendar class="task-card-icon-xs" />
                        {fmtDate(task.dueDate)}
                    </div>
                {/if}
                {#if task.checklist && task.checklist.length > 0}
                    <span class="task-card-subtask-count mono"
                        >{task.checklist.filter((ci) => ci.done).length}/{task.checklist.length}</span
                    >
                {/if}
            </div>
        </Card>
    </div>

    {#if isDropTarget && dropPosition === 'after'}
        <div class="task-card-drop-indicator task-card-drop-indicator-bottom"></div>
    {/if}
</div>
