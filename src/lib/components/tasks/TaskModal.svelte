<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import TaskChecklistEditor from '$lib/components/tasks/TaskChecklistEditor.svelte';
    import { fieldFromInitial } from '$lib/utils/initialFields';
    import { taskStatusPillClass } from '$lib/tasks/taskStatusDisplay';
    import { parseTaskChecklist, type TaskChecklistItem } from '$lib/tasks/taskChecklist';
    import type { ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import ThreeDotsMenu from '$lib/components/ui/ThreeDotsMenu.svelte';
    import { Trash2 } from 'lucide-svelte';
    import { showSuccessToast, showErrorToast } from '$lib/stores/toast';

    let {
        mode,
        open,
        onClose,
        action,
        defaultStatus,
        initial = {},
        error,
        errorId,
        onenhance
    }: {
        mode: 'create' | 'edit';
        open: boolean;
        onClose: () => void | Promise<void>;
        action: string;
        defaultStatus?: string;
        initial?: Record<string, unknown>;
        error?: string;
        errorId?: string;
        onenhance?: SubmitFunction | ManualEnhanceHandler;
    } = $props();

    const submitEnhance = $derived(onenhance as SubmitFunction | undefined);

    const TASK_ALLOWED = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'checklist'] as const;

    const taskStatusOptions = [
        { value: 'TODO', label: 'This week' },
        { value: 'IN_PROGRESS', label: 'Soon' },
        { value: 'WAITING', label: 'Waiting' },
        { value: 'DONE', label: 'Done' }
    ];

    function val(name: string, fallback = '') {
        return fieldFromInitial(initial, TASK_ALLOWED, name, fallback);
    }

    let editableChecklist = $state<TaskChecklistItem[]>([]);
    let checklistJson = $derived(JSON.stringify(editableChecklist));

    let dueDateValue = $state('');
    let titleValue = $state('');
    let descriptionValue = $state('');
    let statusValue = $state('TODO');
    let priorityValue = $state('MEDIUM');

    const statusPillClass = $derived(() => taskStatusPillClass(statusValue));

    async function handleDelete() {
        const id = val('id');
        if (!id) return;

        // Close immediately
        void onClose();

        try {
            const formData = new FormData();
            formData.set('id', id);

            const response = await fetch(`${action.split('?')[0]}?/delete`, {
                method: 'POST',
                body: formData
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch {
                // SvelteKit might return a non-JSON response in some error cases
                showErrorToast('Failed to delete task');
                return;
            }

            if (result.type === 'success' || (result.type === 'redirect' && !result.error)) {
                showSuccessToast('Task deleted');
            } else {
                const data = result.data ? (typeof result.data === 'string' ? JSON.parse(result.data) : result.data) : {};
                showErrorToast(data.error || 'Failed to delete task');
            }
        } catch (e) {
            showErrorToast('Failed to delete task');
        }
    }

    const menuItems = $derived([
        {
            label: 'Delete',
            icon: Trash2,
            variant: 'destructive' as const,
            action: handleDelete
        }
    ]);

    $effect(() => {
        if (open) {
            if (mode === 'create') {
                titleValue = '';
                descriptionValue = '';
                statusValue = defaultStatus || 'TODO';
                priorityValue = 'MEDIUM';
                dueDateValue = '';
                editableChecklist = [];
            } else {
                titleValue = val('title');
                descriptionValue = val('description');
                statusValue = val('status', 'TODO');
                priorityValue = val('priority', 'MEDIUM');
                editableChecklist = parseTaskChecklist(initial.checklist);
                dueDateValue = val('dueDate');
            }
        }
    });
</script>

{#snippet taskHeader()}
    <Select
        id="task-status"
        bind:value={statusValue}
        options={taskStatusOptions}
        ariaLabel="Task status"
        size="sm"
        menuClass="dropdown-menu--min-12rem"
        triggerClass={`task-status-trigger ${statusPillClass()}`}
    />
{/snippet}

{#snippet taskHeaderActions()}
    {#if mode === 'edit'}
        <ThreeDotsMenu items={menuItems} menuId="task-options" />
    {/if}
{/snippet}

{#snippet taskEditFooter()}
    <Button type="button" variant="ghost" onclick={onClose}>Cancel</Button>
    <Button type="submit" form="task-edit-form" class="modal-footer-save">Save changes</Button>
{/snippet}

{#if mode === 'create'}
    <Dialog
        {open}
        {onClose}
        ariaLabel="Create task"
        header={taskHeader}
        footerFormId="task-create-form"
        cancelLabel="Cancel"
        cancelVariant="ghost"
        submitLabel="Create task"
        submitClass="modal-footer-save"
    >
        <form id="task-create-form" method="post" {action} use:enhance={submitEnhance!} class="modal-form">
            <input type="hidden" name="status" value={statusValue} />
            <input type="hidden" name="priority" value={priorityValue} />
            <input type="hidden" name="checklist" value={checklistJson} />

            <div class="modal-title-row">
                <Input name="title" bind:value={titleValue} class="modal-title-input display" placeholder="Task title" required />
            </div>

            <div class="modal-description-section">
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    class="modal-description-textarea"
                />
            </div>

            <TaskChecklistEditor bind:items={editableChecklist} />

            <div class="modal-metadata-item">
                <label class="modal-metadata-label" for="dueDate">Due Date</label>
                <Input name="dueDate" id="dueDate" type="date" bind:value={dueDateValue} />
            </div>

            {#if error}
                <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
            {/if}
        </form>
    </Dialog>
{:else}
    <Dialog {open} {onClose} ariaLabel="Edit task" header={taskHeader} headerActions={taskHeaderActions} footer={taskEditFooter}>
        <form id="task-edit-form" method="post" {action} use:enhance={submitEnhance!} class="modal-form">
            <input type="hidden" name="status" value={statusValue} />
            <input type="hidden" name="priority" value={priorityValue} />
            <input type="hidden" name="checklist" value={checklistJson} />
            <input type="hidden" name="id" value={val('id')} />

            <div class="modal-title-row">
                <Input name="title" bind:value={titleValue} class="modal-title-input display" placeholder="Task title" />
            </div>

            <div class="modal-description-section">
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    class="modal-description-textarea"
                />
            </div>

            <TaskChecklistEditor bind:items={editableChecklist} />

            <div class="modal-metadata-item">
                <label class="modal-metadata-label" for="edit-dueDate">Due Date</label>
                <Input name="dueDate" id="edit-dueDate" type="date" bind:value={dueDateValue} />
            </div>

            {#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
        </form>
    </Dialog>
{/if}

<style>
    :global(button.task-status-trigger) {
        height: 24px;
        min-height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 11px;
        font-weight: 600;
        gap: 6px;
        box-shadow: none;
    }

    :global(button.task-status-trigger .select-trigger-label) {
        text-transform: none;
    }

    :global(button.task-status-trigger .select-trigger-chevron) {
        opacity: 0.75;
        width: 12px;
        height: 12px;
    }

    :global(button.task-status-trigger.s-active) {
        background: var(--peri);
        color: var(--peri-d);
        border-color: color-mix(in srgb, var(--peri-d) 18%, transparent);
    }

    :global(button.task-status-trigger.s-active:hover) {
        background: color-mix(in srgb, var(--peri) 82%, var(--peri-d) 18%);
        border-color: color-mix(in srgb, var(--peri-d) 24%, transparent);
    }

    :global(button.task-status-trigger.s-done) {
        background: var(--sage);
        color: var(--sage-d);
        border-color: color-mix(in srgb, var(--sage-d) 18%, transparent);
    }

    :global(button.task-status-trigger.s-done:hover) {
        background: color-mix(in srgb, var(--sage) 80%, var(--sage-d) 20%);
        border-color: color-mix(in srgb, var(--sage-d) 24%, transparent);
    }

    :global(button.task-status-trigger.s-note) {
        background: var(--surface-3);
        color: var(--ink-2);
        border-color: color-mix(in srgb, var(--ink-2) 10%, transparent);
    }

    :global(button.task-status-trigger.s-note:hover) {
        background: color-mix(in srgb, var(--surface-3) 86%, var(--ink-2) 14%);
        border-color: color-mix(in srgb, var(--ink-2) 16%, transparent);
    }

    :global(button.task-status-trigger.s-waiting) {
        background: var(--blush);
        color: var(--blush-d);
        border-color: color-mix(in srgb, var(--blush-d) 18%, transparent);
    }

    :global(button.task-status-trigger.s-waiting:hover) {
        background: color-mix(in srgb, var(--blush) 80%, var(--blush-d) 20%);
        border-color: color-mix(in srgb, var(--blush-d) 24%, transparent);
    }
</style>
