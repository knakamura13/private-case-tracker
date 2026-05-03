<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import RichText from '$lib/components/ui/RichText.svelte';
    import ByAvatar from '$lib/components/shared/ByAvatar.svelte';
    import { PHASE_LABELS } from '$lib/constants/phases';
    import { showSuccessToast, showErrorToast } from '$lib/stores/toast';
    import { X, Plus, Calendar, MapPin, CheckSquare, User, MoreHorizontal, Image, Paperclip, Link, FileText } from 'lucide-svelte';

    let {
        open,
        onClose,
        action,
        deleteAction,
        onenhance,
        initial,
        error,
        errorId
    }: {
        open: boolean;
        onClose: () => void | Promise<void>;
        action: string;
        deleteAction?: string;
        onenhance?: (params: { formData: FormData; cancel: () => void }) => void | (() => Promise<void>);
        initial: Record<string, unknown>;
        error?: string;
        errorId?: string;
    } = $props();

    interface SubTask {
        id: string;
        text: string;
        done: boolean;
    }

    let editableSubTasks = $state<SubTask[]>([]);
    let newSubTaskText = $state('');
    let subTasksJson = $derived(JSON.stringify(editableSubTasks));

    // Button visibility states
    let showLocationInput = $state(false);
    let showDueDatePicker = $state(false);
    let showAppointmentDatePicker = $state(false);
    let showChecklistInput = $state(false);
    let showMenuDropdown = $state(false);
    let isEditingDescription = $state(false);
    let editingSubTaskId = $state<string | null>(null);
    let editingSubTaskText = $state('');
    let newSubTaskInputEl = $state<HTMLInputElement | null>(null);
    let dueDateInputEl = $state<HTMLInputElement | null>(null);
    let scheduledAtInputEl = $state<HTMLInputElement | null>(null);

    // Focus new sub-task input when shown
    $effect(() => {
        if (showChecklistInput && newSubTaskInputEl) {
            newSubTaskInputEl.focus();
        }
    });

    // Click outside handler for dropdowns
    function clickOutside(node: HTMLElement, callback: () => void) {
        const handleClick = (event: MouseEvent) => {
            if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
                callback();
            }
        };

        document.addEventListener('click', handleClick, true);

        return {
            destroy() {
                document.removeEventListener('click', handleClick, true);
            }
        };
    }

    // Input values
    let locationAddress = $state('');
    let dueDateValue = $state('');
    let appointmentDateValue = $state('');
    let isEditingLocation = $state(false);
    let currentLocation = $state('');

    // Auto-save state
    let isSaving = $state(false);
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingSavePromise: Promise<void> | null = null;

    // Reactive form values
    let titleValue = $state('');
    let descriptionValue = $state('');
    let phaseValue = $state('PREPARATION');
    let statusValue = $state('PLANNED');
    let priorityValue = $state('MEDIUM');
    let ownerIdValue = $state('');

    const ALLOWED_FIELDS = [
        'id',
        'title',
        'description',
        'phase',
        'status',
        'priority',
        'ownerId',
        'dueDate',
        'scheduledAt',
        'subTasks',
        'owner',
        'location'
    ] as const;

    // Initialize reactive values from initial props when modal opens
    $effect(() => {
        if (open) {
            titleValue = val('title');
            descriptionValue = val('description');
            phaseValue = val('phase', 'PREPARATION');
            statusValue = val('status', 'PLANNED');
            priorityValue = val('priority', 'MEDIUM');
            ownerIdValue = val('ownerId');
            editableSubTasks = (initial.subTasks as SubTask[]) || [];
            dueDateValue = val('dueDate');
            appointmentDateValue = val('scheduledAt');
            currentLocation = val('location', '');
            isEditingDescription = false;
            isSaving = false;
            if (saveTimeout) clearTimeout(saveTimeout);
            pendingSavePromise = null;
        }
    });

    function val(name: string, fallback = '') {
        if (!ALLOWED_FIELDS.includes(name as (typeof ALLOWED_FIELDS)[number])) {
            return fallback;
        }
        const v = initial[name as keyof typeof initial];
        if (v == null) return fallback;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return String(v);
    }

    function addSubTask() {
        if (!newSubTaskText.trim()) return;
        editableSubTasks = [...editableSubTasks, { id: crypto.randomUUID(), text: newSubTaskText.trim(), done: false }];
        newSubTaskText = '';
        triggerAutoSave();
    }

    function _removeSubTask(id: string) {
        editableSubTasks = editableSubTasks.filter((st) => st.id !== id);
        triggerAutoSave(true);
    }

    function updateSubTaskText(id: string, newText: string) {
        editableSubTasks = editableSubTasks.map((st) => (st.id === id ? { ...st, text: newText } : st));
        triggerAutoSave(true);
    }

    function toggleSubTask(id: string) {
        editableSubTasks = editableSubTasks.map((st) => (st.id === id ? { ...st, done: !st.done } : st));
        triggerAutoSave();
    }

    function checklistProgress() {
        if (editableSubTasks.length === 0) return 0;
        const done = editableSubTasks.filter((st) => st.done).length;
        return Math.round((done / editableSubTasks.length) * 100);
    }

    function handleLocationSave() {
        if (!locationAddress.trim()) return;
        currentLocation = locationAddress.trim();
        locationAddress = '';
        showLocationInput = false;
        isEditingLocation = false;
        triggerAutoSave();
    }

    function generateGoogleMapsUrl(address: string | null | undefined) {
        if (!address?.trim()) return '#';
        const query = encodeURIComponent(address.trim());
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    function handleDueDateSave() {
        if (dueDateInputEl) {
            dueDateInputEl.value = dueDateValue;
        }
        showDueDatePicker = false;
        triggerAutoSave();
    }

    function handleAppointmentDateSave() {
        if (scheduledAtInputEl) {
            scheduledAtInputEl.value = appointmentDateValue;
        }
        showAppointmentDatePicker = false;
        triggerAutoSave();
    }

    async function triggerAutoSave(immediate = false) {
        if (isSaving) return;
        if (saveTimeout) clearTimeout(saveTimeout);
        // Only trigger if dialog is open and action is valid
        if (!open || !action) return;
        const delay = immediate ? 0 : 2000;
        saveTimeout = setTimeout(async () => {
            if (onenhance) {
                isSaving = true;
                // Manually construct FormData from reactive state to ensure values are current
                const formData = new FormData();
                formData.append('id', val('id'));
                formData.append('title', titleValue);
                formData.append('description', descriptionValue);
                formData.append('phase', phaseValue);
                formData.append('status', statusValue);
                formData.append('priority', priorityValue);
                formData.append('ownerId', ownerIdValue);
                formData.append('dueDate', dueDateValue);
                formData.append('scheduledAt', appointmentDateValue);
                formData.append('subTasks', subTasksJson);
                formData.append('location', currentLocation);

                const cancel = () => {
                    isSaving = false;
                };

                pendingSavePromise = (async () => {
                    try {
                        // Call onenhance - it may return a function (timeline pattern) or be void
                        const result = onenhance({ formData, cancel });
                        if (result && typeof result === 'function') {
                            await result();
                        }
                    } catch {
                        showErrorToast('Failed to auto-save milestone');
                        cancel();
                    }
                    isSaving = false;
                    pendingSavePromise = null;
                })();

                await pendingSavePromise;
            }
        }, delay);
    }
</script>

<Dialog {open} {onClose}>
    <form method="post" {action} class="modal-form">
        <!-- Header -->
        <div class="modal-header">
            <div class="modal-header-left">
                <span class="pill s-note">{PHASE_LABELS[phaseValue as keyof typeof PHASE_LABELS]}</span>
            </div>
            <div class="modal-header-right">
                <Button type="button" variant="ghost" size="sm" class="modal-icon-btn">
                    <Image class="modal-icon-sm" />
                </Button>
                <Button type="button" variant="ghost" size="sm" class="modal-icon-btn">
                    <Paperclip class="modal-icon-sm" />
                </Button>
                {#if deleteAction}
                    <div class="modal-dropdown" use:clickOutside={() => (showMenuDropdown = false)}>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onclick={() => (showMenuDropdown = !showMenuDropdown)}
                            class="modal-icon-btn"
                        >
                            <MoreHorizontal class="modal-icon-sm" />
                        </Button>
                        {#if showMenuDropdown}
                            <div class="modal-dropdown-menu">
                                <button
                                    type="button"
                                    class="modal-dropdown-button"
                                    onclick={async () => {
                                        if (confirm('Are you sure you want to delete this milestone? This action cannot be undone.')) {
                                            const formData = new FormData();
                                            formData.append('id', val('id'));
                                            const response = await fetch(deleteAction, { method: 'POST', body: formData });
                                            if (response.ok) {
                                                showSuccessToast('Milestone deleted successfully');
                                                window.location.href = '/timeline';
                                            } else {
                                                showErrorToast('Failed to delete milestone');
                                            }
                                        }
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        {/if}
                    </div>
                {/if}
                <Button type="button" variant="ghost" size="sm" onclick={onClose} class="modal-icon-btn">
                    <X class="modal-icon-sm" />
                </Button>
            </div>
        </div>

        <!-- Title Row -->
        <div class="modal-title-row">
            <MapPin class="modal-icon-sm" />
            <Input
                name="title"
                bind:value={titleValue}
                oninput={() => triggerAutoSave()}
                class="modal-title-input display"
                placeholder="Milestone title"
            />
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
                <Paperclip class="modal-icon-xs" /> Attachment
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
                    {#if initial.owner}
                        <ByAvatar owner={initial.owner as { id: string; name: string | null; email: string }} size="sm" />
                        <span
                            >{(initial.owner as { name?: string; email?: string }).name ??
                                (initial.owner as { email?: string }).email}</span
                        >
                    {:else}
                        <Button type="button" variant="ghost" size="sm" class="modal-metadata-btn">
                            <User class="modal-icon-xs" /> Assign
                        </Button>
                    {/if}
                </div>
            </div>
            <div class="modal-metadata-item">
                <span class="modal-metadata-label">Due date</span>
                <div class="modal-metadata-value">
                    {#if dueDateValue}
                        <Calendar class="modal-icon-xs" />
                        <span>{dueDateValue}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="modal-icon-btn-sm"
                            onclick={() => (showDueDatePicker = true)}
                        >
                            <MoreHorizontal class="modal-icon-xs" />
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
            <div class="modal-metadata-item">
                <span class="modal-metadata-label">Appointment date</span>
                <div class="modal-metadata-value">
                    {#if appointmentDateValue}
                        <Calendar class="modal-icon-xs" />
                        <span>{appointmentDateValue}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="modal-icon-btn-sm"
                            onclick={() => (showAppointmentDatePicker = true)}
                        >
                            <MoreHorizontal class="modal-icon-xs" />
                        </Button>
                    {:else}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="modal-metadata-btn"
                            onclick={() => (showAppointmentDatePicker = true)}
                        >
                            <Calendar class="modal-icon-xs" /> Set appointment
                        </Button>
                    {/if}
                </div>
            </div>
            <div class="modal-metadata-item">
                <span class="modal-metadata-label">Location</span>
                <div class="modal-metadata-value">
                    {#if currentLocation}
                        <a
                            href={generateGoogleMapsUrl(currentLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="modal-metadata-link"
                        >
                            <MapPin class="modal-icon-xs" />
                            <span>{currentLocation}</span>
                        </a>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="modal-icon-btn-sm"
                            onclick={() => {
                                locationAddress = currentLocation;
                                isEditingLocation = true;
                            }}
                        >
                            <MoreHorizontal class="modal-icon-xs" />
                        </Button>
                    {:else}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="modal-metadata-btn"
                            onclick={() => (showLocationInput = true)}
                        >
                            <MapPin class="modal-icon-xs" /> Set location
                        </Button>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Date Pickers -->
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

        <!-- Description -->
        <div class="modal-description-section">
            <input type="hidden" name="description" value={descriptionValue} />
            {#if isEditingDescription}
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    oninput={() => triggerAutoSave()}
                    onblur={() => {
                        isEditingDescription = false;
                        triggerAutoSave(true);
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

        <!-- Sub-tasks -->
        <div class="modal-checklist-section">
            <div class="modal-checklist-header">
                <CheckSquare class="modal-icon-sm" />
                <span>Sub-tasks</span>
                {#if editableSubTasks.length > 0}
                    <span class="modal-checklist-progress-text">{checklistProgress()}%</span>
                {/if}
            </div>
            {#if editableSubTasks.length > 0}
                <div class="modal-checklist-progress-bar">
                    <div class="modal-checklist-progress-fill" style="width: {checklistProgress()}%"></div>
                </div>
            {/if}
            {#if editableSubTasks.length > 0}
                <div class="modal-checklist-items">
                    {#each editableSubTasks as st (st.id)}
                        <div class="modal-checklist-item">
                            <input
                                type="checkbox"
                                checked={st.done}
                                onchange={() => toggleSubTask(st.id)}
                                class="modal-checklist-checkbox"
                            />
                            {#if editingSubTaskId === st.id}
                                <Input
                                    bind:value={editingSubTaskText}
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            updateSubTaskText(st.id, editingSubTaskText);
                                            editingSubTaskId = null;
                                        } else if (e.key === 'Escape') {
                                            editingSubTaskId = null;
                                        }
                                    }}
                                    onblur={() => {
                                        if (editingSubTaskText !== st.text) {
                                            updateSubTaskText(st.id, editingSubTaskText);
                                        }
                                        editingSubTaskId = null;
                                    }}
                                    class="modal-checklist-input"
                                />
                            {:else}
                                <span class={st.done ? 'modal-checklist-text-done' : 'modal-checklist-text'}>{st.text}</span>
                            {/if}
                            <Button type="button" variant="ghost" size="sm" class="modal-icon-btn-sm" onclick={() => _removeSubTask(st.id)}>
                                <X class="modal-icon-xs" />
                            </Button>
                        </div>
                    {/each}
                </div>
            {/if}
            {#if !showChecklistInput}
                <Button type="button" variant="ghost" size="sm" onclick={() => (showChecklistInput = true)} class="modal-add-checklist-btn">
                    <Plus class="modal-icon-xs" /> Add sub-task
                </Button>
            {:else}
                <div class="modal-checklist-add">
                    <Input
                        bind:value={newSubTaskText}
                        placeholder="Enter sub-task..."
                        onkeydown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addSubTask();
                            }
                        }}
                        class="modal-checklist-add-input"
                    />
                    <Button type="button" size="sm" onclick={addSubTask}>Add</Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onclick={() => {
                            newSubTaskText = '';
                            showChecklistInput = false;
                        }}>Cancel</Button
                    >
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
            {#if deleteAction}
                <Button
                    type="button"
                    variant="ghost"
                    class="modal-footer-delete"
                    onclick={async () => {
                        if (confirm('Are you sure you want to delete this milestone?')) {
                            const formData = new FormData();
                            formData.append('id', val('id'));
                            const response = await fetch(deleteAction, { method: 'POST', body: formData });
                            if (response.ok) {
                                showSuccessToast('Milestone deleted');
                                window.location.href = '/timeline';
                            }
                        }
                    }}
                >
                    Delete
                </Button>
            {/if}
            <Button type="button" variant="ghost" onclick={onClose}>Cancel</Button>
            <Button type="submit" class="modal-footer-save">Save changes</Button>
        </div>

        <!-- Hidden Inputs -->
        {#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
        <input type="hidden" name="subTasks" value={subTasksJson} />
        <input type="hidden" name="id" value={val('id')} />
        <input type="hidden" name="ownerId" value={ownerIdValue} />
        <input type="hidden" name="dueDate" value={dueDateValue} bind:this={dueDateInputEl} />
        <input type="hidden" name="scheduledAt" value={appointmentDateValue} bind:this={scheduledAtInputEl} />
        <input type="hidden" name="location" value={currentLocation} />
        <input type="hidden" name="phase" value={phaseValue} />
        <input type="hidden" name="status" value={statusValue} />
        <input type="hidden" name="priority" value={priorityValue} />
    </form>
</Dialog>
