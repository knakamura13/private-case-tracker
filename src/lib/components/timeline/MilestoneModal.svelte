<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
        import TaskChecklistEditor from '$lib/components/tasks/TaskChecklistEditor.svelte';
    import { fieldFromInitial } from '$lib/utils/initialFields';
    import type { ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';
    import type { TaskChecklistItem } from '$lib/tasks/taskChecklist';
    import { PHASE_LABELS } from '$lib/constants/phases';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';

    let {
        mode,
        open,
        onClose,
        action,
        defaultPhase,
        initial = {},
        error,
        errorId,
        onenhance
    }: {
        mode: 'create' | 'edit';
        open: boolean;
        onClose: () => void | Promise<void>;
        action: string;
        defaultPhase?: string;
        initial?: Record<string, unknown>;
        error?: string;
        errorId?: string;
        onenhance?: SubmitFunction | ManualEnhanceHandler;
    } = $props();

    const submitEnhance = $derived(mode === 'create' ? (onenhance as SubmitFunction | undefined) : undefined);

    const MILESTONE_ALLOWED = [
        'id',
        'title',
        'description',
        'phase',
        'status',
        'priority',
        'dueDate',
        'scheduledAt',
        'subTasks',
        'location'
    ] as const;

    function val(name: string, fallback = '') {
        return fieldFromInitial(initial, MILESTONE_ALLOWED, name, fallback);
    }

    let editableSubTasks = $state<TaskChecklistItem[]>([]);
    let subTasksJson = $derived(JSON.stringify(editableSubTasks));

    let showLocationInput = $state(false);
    let showDueDatePicker = $state(false);
    let showAppointmentDatePicker = $state(false);
    let isEditingLocation = $state(false);

    let locationAddress = $state('');
    let dueDateValue = $state('');
    let appointmentDateValue = $state('');
    let currentLocation = $state('');

    let titleValue = $state('');
    let descriptionValue = $state('');
    let phaseValue = $state('PREPARATION');
    let statusValue = $state('PLANNED');
    let priorityValue = $state('MEDIUM');

    let dueDateInputEl = $state<HTMLInputElement | null>(null);
    let scheduledAtInputEl = $state<HTMLInputElement | null>(null);


    $effect(() => {
        if (open) {
            if (mode === 'create') {
                titleValue = '';
                descriptionValue = '';
                phaseValue = defaultPhase || 'PREPARATION';
                statusValue = 'PLANNED';
                priorityValue = 'MEDIUM';
                editableSubTasks = [];
                dueDateValue = '';
                appointmentDateValue = '';
                currentLocation = '';
                locationAddress = '';
                showLocationInput = false;
                showDueDatePicker = false;
                showAppointmentDatePicker = false;
            } else {
                titleValue = val('title');
                descriptionValue = val('description');
                phaseValue = val('phase', 'PREPARATION');
                statusValue = val('status', 'PLANNED');
                priorityValue = val('priority', 'MEDIUM');
                editableSubTasks = (initial.subTasks as TaskChecklistItem[]) || [];
                dueDateValue = val('dueDate');
                appointmentDateValue = val('scheduledAt');
                currentLocation = val('location', '');
                showLocationInput = false;
                showDueDatePicker = false;
                showAppointmentDatePicker = false;
                isEditingLocation = false;
            }
        } else if (mode === 'edit') {
            showLocationInput = false;
            showDueDatePicker = false;
            showAppointmentDatePicker = false;
            isEditingLocation = false;
        }
    });

    function handleLocationSave() {
        if (!locationAddress.trim()) return;
        currentLocation = locationAddress.trim();
        locationAddress = '';
        showLocationInput = false;
        isEditingLocation = false;
    }

    function handleDueDateSave() {
        if (dueDateInputEl) {
            dueDateInputEl.value = dueDateValue;
        }
        showDueDatePicker = false;
    }

    function handleAppointmentDateSave() {
        if (scheduledAtInputEl) {
            scheduledAtInputEl.value = appointmentDateValue;
        }
        showAppointmentDatePicker = false;
    }

</script>

{#snippet milestoneInlinePickers()}
    {#if showDueDatePicker}
        <div class="modal-mt-2 modal-flex modal-gap-2">
            <Input bind:value={dueDateValue} type="date" class="modal-text-sm" />
            <Button type="button" size="sm" onclick={handleDueDateSave}>Save</Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showDueDatePicker = false)}>Cancel</Button>
        </div>
    {/if}
    {#if showAppointmentDatePicker}
        <div class="modal-mt-2 modal-flex modal-gap-2">
            <Input bind:value={appointmentDateValue} type="date" class="modal-text-sm" />
            <Button type="button" size="sm" onclick={handleAppointmentDateSave}>Save</Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showAppointmentDatePicker = false)}>Cancel</Button>
        </div>
    {/if}
    {#if showLocationInput || isEditingLocation}
        <div class="modal-mt-2 modal-flex modal-gap-2">
            <Input
                bind:value={locationAddress}
                placeholder="Enter address..."
                class="modal-flex-1 modal-text-sm"
                onkeydown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLocationSave();
                    }
                }}
            />
            <Button type="button" size="sm" onclick={handleLocationSave}>Save</Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onclick={() => {
                    showLocationInput = false;
                    isEditingLocation = false;
                    locationAddress = '';
                }}>Cancel</Button
            >
        </div>
    {/if}
{/snippet}

{#snippet milestoneEditHeader()}
    <span class="pill s-note">{PHASE_LABELS[phaseValue as keyof typeof PHASE_LABELS]}</span>
{/snippet}

{#snippet milestoneEditFooter()}
    <Button type="button" variant="ghost" onclick={onClose}>Cancel</Button>
    <Button type="submit" form="milestone-edit-form" class="modal-footer-save">Save changes</Button>
{/snippet}

{#if mode === 'create'}
    <Dialog
        {open}
        {onClose}
        ariaLabel="Create milestone"
        header={milestoneEditHeader}
        footerFormId="milestone-create-form"
        cancelLabel="Cancel"
        submitLabel="Create milestone"
    >
        <form id="milestone-create-form" method="post" {action} use:enhance={submitEnhance!} class="modal-form">
            <div class="modal-title-row">
                <Input name="title" bind:value={titleValue} class="modal-title-input display" placeholder="Milestone title" required />
            </div>

            {@render milestoneInlinePickers()}

            <div class="modal-description-section">
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    class="modal-description-textarea"
                />
            </div>

            <TaskChecklistEditor bind:items={editableSubTasks} />

            {#if error}
                <div class="modal-error">
                    <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
                </div>
            {/if}
            <input type="hidden" name="subTasks" value={subTasksJson} />
            <input type="hidden" name="location" value={currentLocation} />
            <input type="hidden" name="dueDate" value={dueDateValue} />
            <input type="hidden" name="scheduledAt" value={appointmentDateValue} />
        </form>
    </Dialog>
{:else}
    <Dialog {open} {onClose} ariaLabel="Edit milestone" header={milestoneEditHeader} footer={milestoneEditFooter}>
        <form id="milestone-edit-form" method="post" {action} class="modal-form">
            <div class="modal-title-row">
                <Input
                    name="title"
                    bind:value={titleValue}
                    class="modal-title-input display"
                    placeholder="Milestone title"
                />
            </div>

            {@render milestoneInlinePickers()}

            <div class="modal-description-section">
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    class="modal-description-textarea"
                />
            </div>

            <TaskChecklistEditor bind:items={editableSubTasks} />

            {#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
            <input type="hidden" name="subTasks" value={subTasksJson} />
            <input type="hidden" name="id" value={val('id')} />
            <input type="hidden" name="dueDate" value={dueDateValue} bind:this={dueDateInputEl} />
            <input type="hidden" name="scheduledAt" value={appointmentDateValue} bind:this={scheduledAtInputEl} />
            <input type="hidden" name="location" value={currentLocation} />
            <input type="hidden" name="phase" value={phaseValue} />
            <input type="hidden" name="status" value={statusValue} />
            <input type="hidden" name="priority" value={priorityValue} />
        </form>
    </Dialog>
{/if}
