<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import RichText from '$lib/components/ui/RichText.svelte';
    import { X, Calendar, User, CheckSquare, Plus, FileText, Link } from 'lucide-svelte';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';

    let {
        open,
        onClose,
        action,
        defaultStatus,
        error,
        errorId,
        onenhance
    }: {
        open: boolean;
        onClose: () => void | Promise<void>;
        action: string;
        defaultStatus?: string;
        error?: string;
        errorId?: string;
        onenhance?: SubmitFunction;
    } = $props();

    // Button visibility states
    let showDueDatePicker = $state(false);
    let isEditingDescription = $state(false);

    // Input values
    let dueDateValue = $state('');

    // Form values
    let titleValue = $state('');
    let descriptionValue = $state('');
    let statusValue = $state('TODO');
    let priorityValue = $state('MEDIUM');
    let ownerIdValue = $state('');

    // Status pill mapping
    const statusPillClass = $derived(() => {
        switch (statusValue) {
            case 'TODO':
                return 's-active';
            case 'IN_PROGRESS':
                return 's-note';
            case 'WAITING':
                return 's-waiting';
            case 'DONE':
                return 's-done';
            default:
                return '';
        }
    });

    const statusLabel = $derived(() => {
        switch (statusValue) {
            case 'TODO':
                return 'This week';
            case 'IN_PROGRESS':
                return 'Soon';
            case 'WAITING':
                return 'Waiting';
            case 'DONE':
                return 'Done';
            default:
                return statusValue;
        }
    });

    // Reset form when modal opens
    $effect(() => {
        if (open) {
            titleValue = '';
            descriptionValue = '';
            statusValue = defaultStatus || 'TODO';
            priorityValue = 'MEDIUM';
            ownerIdValue = '';
            dueDateValue = '';
            showDueDatePicker = false;
            isEditingDescription = false;
        }
    });
</script>

{#snippet taskCreateHeader()}
    <span class="pill {statusPillClass()}">{statusLabel()}</span>
{/snippet}

<Dialog
    {open}
    {onClose}
    ariaLabel="Create task"
    header={taskCreateHeader}
    footerFormId="task-create-form"
    cancelLabel="Cancel"
    cancelVariant="ghost"
    submitLabel="Create task"
    submitClass="modal-footer-save"
>
    <form id="task-create-form" method="post" {action} use:enhance={onenhance} class="modal-form">
        <input type="hidden" name="checklist" value="[]" />

        <!-- Title Row -->
        <div class="modal-title-row">
            <input
                type="checkbox"
                checked={statusValue === 'DONE'}
                onchange={() => {
                    statusValue = statusValue === 'DONE' ? 'TODO' : 'DONE';
                }}
                class="modal-title-checkbox"
            />
            <Input name="title" bind:value={titleValue} class="modal-title-input display" placeholder="Task title" required />
        </div>

        <!-- Action Chips -->
        <div class="modal-action-chips">
            <Button type="button" variant="ghost" size="sm" class="modal-action-chip">
                <Plus class="modal-icon-xs" /> Add
            </Button>
            <Button type="button" variant="ghost" size="sm" class="modal-action-chip">
                <FileText class="modal-icon-xs" /> Labels
            </Button>
            <Button type="button" variant="ghost" size="sm" class="modal-action-chip">
                <CheckSquare class="modal-icon-xs" /> Sub-tasks
            </Button>
            <Button type="button" variant="ghost" size="sm" class="modal-action-chip">
                <Link class="modal-icon-xs" /> Link
            </Button>
        </div>

        <!-- Metadata Grid -->
        <div class="modal-metadata-grid">
            <div class="modal-metadata-item">
                <span class="modal-metadata-label">Assigned to</span>
                <div class="modal-metadata-value">
                    <Button type="button" variant="ghost" size="sm" class="modal-metadata-btn">
                        <User class="modal-icon-xs" /> Assign
                    </Button>
                </div>
            </div>
            <div class="modal-metadata-item">
                <span class="modal-metadata-label">Due date</span>
                <div class="modal-metadata-value">
                    {#if dueDateValue}
                        <Calendar class="modal-icon-xs" />
                        <span>{dueDateValue}</span>
                        <Button type="button" variant="ghost" size="sm" class="modal-icon-btn-sm" onclick={() => (dueDateValue = '')}>
                            <X class="modal-icon-xs" />
                        </Button>
                    {:else}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="modal-metadata-btn"
                            onclick={() => (showDueDatePicker = true)}
                        >
                            <Calendar class="modal-icon-xs" /> Set due date
                        </Button>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Due Date Picker -->
        {#if showDueDatePicker}
            <div class="modal-mt-2 modal-flex modal-gap-2">
                <Input type="date" bind:value={dueDateValue} class="modal-text-sm" />
                <Button type="button" size="sm" onclick={() => (showDueDatePicker = false)}>Done</Button>
            </div>
        {/if}

        <!-- Description -->
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

        <!-- Hidden fields -->
        <input type="hidden" name="status" value={statusValue} />
        <input type="hidden" name="priority" value={priorityValue} />
        <input type="hidden" name="dueDate" value={dueDateValue} />
        <input type="hidden" name="ownerId" value={ownerIdValue} />

        <!-- Error -->
        {#if error}
            <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
        {/if}
    </form>
</Dialog>
