<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import TaskChecklistEditor from '$lib/components/tasks/TaskChecklistEditor.svelte';
    import { fieldFromInitial } from '$lib/utils/initialFields';
    import { taskStatusLabel, taskStatusPillClass } from '$lib/tasks/taskStatusDisplay';
    import { parseTaskChecklist, type TaskChecklistItem } from '$lib/tasks/taskChecklist';
    import type { ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';

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

    const submitEnhance = $derived(mode === 'create' ? (onenhance as SubmitFunction | undefined) : undefined);

    const TASK_ALLOWED = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'checklist'] as const;

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
    const statusLabel = $derived(() => taskStatusLabel(statusValue));


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
    <span class="pill {statusPillClass()}">{statusLabel()}</span>
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
            <input type="hidden" name="checklist" value={checklistJson} />

            <div class="modal-title-row">
                <Input name="title" bind:value={titleValue} class="modal-title-input display" placeholder="Task title" required />
            </div>

            <div class="modal-description-section">
                <input type="hidden" name="description" value={descriptionValue} />
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    class="modal-description-textarea"
                />
            </div>

            <TaskChecklistEditor bind:items={editableChecklist} />

            <div class="modal-metadata-grid">
                <div class="modal-metadata-item">
                    <label class="modal-metadata-label" for="status">Status</label>
                    <select name="status" id="status" bind:value={statusValue} class="input">
                        <option value="TODO">This week</option>
                        <option value="IN_PROGRESS">Soon</option>
                        <option value="WAITING">Waiting</option>
                        <option value="DONE">Done</option>
                    </select>
                </div>
                <div class="modal-metadata-item">
                    <label class="modal-metadata-label" for="priority">Priority</label>
                    <select name="priority" id="priority" bind:value={priorityValue} class="input">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>
            </div>

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
    <Dialog {open} {onClose} ariaLabel="Edit task" header={taskHeader} footer={taskEditFooter}>
        <form id="task-edit-form" method="post" {action} class="modal-form">
            <div class="modal-title-row">
                <Input
                    name="title"
                    bind:value={titleValue}
                    class="modal-title-input display"
                    placeholder="Task title"
                />
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

            <div class="modal-metadata-grid">
                <div class="modal-metadata-item">
                    <label class="modal-metadata-label" for="edit-status">Status</label>
                    <select name="status" id="edit-status" bind:value={statusValue} class="input">
                        <option value="TODO">This week</option>
                        <option value="IN_PROGRESS">Soon</option>
                        <option value="WAITING">Waiting</option>
                        <option value="DONE">Done</option>
                    </select>
                </div>
                <div class="modal-metadata-item">
                    <label class="modal-metadata-label" for="edit-priority">Priority</label>
                    <select name="priority" id="edit-priority" bind:value={priorityValue} class="input">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>
            </div>

            <div class="modal-metadata-item">
                <label class="modal-metadata-label" for="edit-dueDate">Due Date</label>
                <Input name="dueDate" id="edit-dueDate" type="date" bind:value={dueDateValue} />
            </div>

            {#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
            <input type="hidden" name="description" value={descriptionValue} />
            <input type="hidden" name="checklist" value={checklistJson} />
            <input type="hidden" name="id" value={val('id')} />
        </form>
    </Dialog>
{/if}
