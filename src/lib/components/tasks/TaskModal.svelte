<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import RichText from '$lib/components/ui/RichText.svelte';
    import TaskChecklistEditor from '$lib/components/tasks/TaskChecklistEditor.svelte';
    import { fieldFromInitial } from '$lib/utils/initialFields';
    import { taskStatusLabel, taskStatusPillClass } from '$lib/tasks/taskStatusDisplay';
    import { createTaskAutoSave } from '$lib/tasks/taskAutoSave';
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

    let showDueDatePicker = $state(false);
    let isEditingDescription = $state(false);
    let dueDateInputEl = $state<HTMLInputElement | null>(null);

    let dueDateValue = $state('');
    let titleValue = $state('');
    let descriptionValue = $state('');
    let statusValue = $state('TODO');
    let priorityValue = $state('MEDIUM');

    const statusPillClass = $derived(() => taskStatusPillClass(statusValue));
    const statusLabel = $derived(() => taskStatusLabel(statusValue));

    const autoSave = createTaskAutoSave({
        getOpen: () => open,
        getAction: () => action,
        getOnEnhance: () => (mode === 'edit' ? (onenhance as ManualEnhanceHandler) : undefined),
        buildFormData: () => {
            const formData = new FormData();
            formData.append('id', val('id'));
            formData.append('title', titleValue);
            formData.append('description', descriptionValue);
            formData.append('status', statusValue);
            formData.append('priority', priorityValue);
            formData.append('dueDate', dueDateValue);
            formData.append('checklist', checklistJson);
            return formData;
        }
    });

    $effect(() => {
        if (open) {
            if (mode === 'create') {
                titleValue = '';
                descriptionValue = '';
                statusValue = defaultStatus || 'TODO';
                priorityValue = 'MEDIUM';
                dueDateValue = '';
                editableChecklist = [];
                showDueDatePicker = false;
                isEditingDescription = false;
            } else {
                titleValue = val('title');
                descriptionValue = val('description');
                statusValue = val('status', 'TODO');
                priorityValue = val('priority', 'MEDIUM');
                editableChecklist = parseTaskChecklist(initial.checklist);
                dueDateValue = val('dueDate');
                isEditingDescription = false;
                autoSave.onOpen();
                showDueDatePicker = false;
            }
        } else if (mode === 'edit') {
            autoSave.reset();
            showDueDatePicker = false;
            isEditingDescription = false;
        }
    });

    function handleDueDateSave() {
        if (dueDateInputEl) {
            dueDateInputEl.value = dueDateValue;
        }
        showDueDatePicker = false;
        if (mode === 'edit') void autoSave.triggerAutoSave();
    }

    async function onChecklistMutate(immediate = false) {
        if (mode === 'edit') {
            await autoSave.triggerAutoSave(immediate, false);
        }
    }

    async function saveBeforeCloseWrapper() {
        await autoSave.saveBeforeClose(onClose);
    }
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

            {#if showDueDatePicker}
                <div class="modal-mt-2 modal-flex modal-gap-2">
                    <Input type="date" bind:value={dueDateValue} class="modal-text-sm" />
                    <Button type="button" size="sm" onclick={() => (showDueDatePicker = false)}>Done</Button>
                </div>
            {/if}

            <div class="modal-description-section">
                <input type="hidden" name="description" value={descriptionValue} />
                {#if isEditingDescription}
                    <Textarea
                        bind:value={descriptionValue}
                        onblur={() => (isEditingDescription = false)}
                        onkeydown={(e) => {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                isEditingDescription = false;
                            }
                        }}
                        placeholder="Add a more detailed description..."
                        rows={4}
                        class="modal-description-textarea"
                    />
                {:else}
                    <button
                        type="button"
                        class="modal-description-display"
                        onclick={() => (isEditingDescription = true)}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                isEditingDescription = true;
                            }
                        }}
                    >
                        {#if descriptionValue}
                            <RichText text={descriptionValue} />
                        {:else}
                            <span class="modal-description-placeholder">Add a more detailed description...</span>
                        {/if}
                    </button>
                {/if}
            </div>

            <TaskChecklistEditor bind:items={editableChecklist} />

            <input type="hidden" name="status" value={statusValue} />
            <input type="hidden" name="priority" value={priorityValue} />
            <input type="hidden" name="dueDate" value={dueDateValue} />

            {#if error}
                <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
            {/if}
        </form>
    </Dialog>
{:else}
    <Dialog {open} onClose={saveBeforeCloseWrapper} ariaLabel="Edit task" header={taskHeader} footer={taskEditFooter}>
        <form id="task-edit-form" method="post" {action} class="modal-form">
            <div class="modal-title-row">
                <Input
                    name="title"
                    bind:value={titleValue}
                    oninput={() => void autoSave.triggerAutoSave()}
                    onfocus={() => autoSave.markFocused('title')}
                    onblur={() => {
                        autoSave.markBlurred('title');
                        void autoSave.triggerAutoSave(true);
                    }}
                    class="modal-title-input display"
                    placeholder="Task title"
                />
            </div>

            {#if showDueDatePicker}
                <div class="modal-mt-2 modal-flex modal-gap-2">
                    <Input bind:value={dueDateValue} type="date" class="modal-text-sm" />
                    <Button type="button" size="sm" onclick={handleDueDateSave}>Save</Button>
                    <Button type="button" variant="ghost" size="sm" onclick={() => (showDueDatePicker = false)}>Cancel</Button>
                </div>
            {/if}

            <div class="modal-description-section">
                {#if isEditingDescription}
                    <Textarea
                        name="description"
                        bind:value={descriptionValue}
                        oninput={() => void autoSave.triggerAutoSave()}
                        onfocus={() => autoSave.markFocused('description')}
                        onblur={() => {
                            autoSave.markBlurred('description');
                            isEditingDescription = false;
                            void autoSave.triggerAutoSave(true);
                        }}
                        onkeydown={(e) => {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                isEditingDescription = false;
                            }
                        }}
                        placeholder="Add a more detailed description..."
                        rows={4}
                        class="modal-description-textarea"
                    />
                {:else}
                    <button
                        type="button"
                        class="modal-description-display"
                        onclick={() => (isEditingDescription = true)}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                isEditingDescription = true;
                            }
                        }}
                    >
                        {#if descriptionValue}
                            <RichText text={descriptionValue} />
                        {:else}
                            <span class="modal-description-placeholder">Add a more detailed description...</span>
                        {/if}
                    </button>
                {/if}
            </div>

            <TaskChecklistEditor bind:items={editableChecklist} onMutate={onChecklistMutate} />

            {#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
            <input type="hidden" name="checklist" value={checklistJson} />
            <input type="hidden" name="id" value={val('id')} />
            <input type="hidden" name="dueDate" value={dueDateValue} bind:this={dueDateInputEl} />
        </form>
    </Dialog>
{/if}
