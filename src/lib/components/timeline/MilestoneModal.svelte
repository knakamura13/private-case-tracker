<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import RichText from '$lib/components/ui/RichText.svelte';
    import ByAvatar from '$lib/components/shared/ByAvatar.svelte';
    import TaskChecklistEditor from '$lib/components/tasks/TaskChecklistEditor.svelte';
    import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
    import { fieldFromInitial } from '$lib/utils/initialFields';
    import { confirmAndPostFormAction } from '$lib/utils/confirmFormAction';
    import type { DropdownMenuEntry } from '$lib/components/ui/menuTypes';
    import { createMilestoneAutoSave } from '$lib/timeline/milestoneAutoSave';
    import type { ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';
    import type { TaskChecklistItem } from '$lib/tasks/taskChecklist';
    import { PHASE_LABELS, PHASE_ORDER } from '$lib/constants/phases';
    import { Plus, Calendar, MapPin, User, CheckSquare, MoreHorizontal, Link, FileText } from 'lucide-svelte';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';

    let {
        mode,
        open,
        onClose,
        action,
        members = [],
        defaultPhase,
        initial = {},
        deleteAction,
        error,
        errorId,
        onenhance
    }: {
        mode: 'create' | 'edit';
        open: boolean;
        onClose: () => void | Promise<void>;
        action: string;
        members?: { id: string; name: string | null; email: string }[];
        defaultPhase?: string;
        initial?: Record<string, unknown>;
        deleteAction?: string;
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
        'ownerId',
        'dueDate',
        'scheduledAt',
        'subTasks',
        'owner',
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
    let isEditingDescription = $state(false);
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
    let ownerIdValue = $state('');

    let dueDateInputEl = $state<HTMLInputElement | null>(null);
    let scheduledAtInputEl = $state<HTMLInputElement | null>(null);

    const autoSave = createMilestoneAutoSave({
        getOpen: () => open,
        getAction: () => action,
        getOnEnhance: () => (mode === 'edit' ? (onenhance as ManualEnhanceHandler) : undefined),
        buildFormData: () => {
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
            return formData;
        }
    });

    $effect(() => {
        if (open) {
            if (mode === 'create') {
                titleValue = '';
                descriptionValue = '';
                phaseValue = defaultPhase || 'PREPARATION';
                statusValue = 'PLANNED';
                priorityValue = 'MEDIUM';
                ownerIdValue = '';
                editableSubTasks = [];
                dueDateValue = '';
                appointmentDateValue = '';
                currentLocation = '';
                locationAddress = '';
                showLocationInput = false;
                showDueDatePicker = false;
                showAppointmentDatePicker = false;
                isEditingDescription = false;
            } else {
                titleValue = val('title');
                descriptionValue = val('description');
                phaseValue = val('phase', 'PREPARATION');
                statusValue = val('status', 'PLANNED');
                priorityValue = val('priority', 'MEDIUM');
                ownerIdValue = val('ownerId');
                editableSubTasks = (initial.subTasks as TaskChecklistItem[]) || [];
                dueDateValue = val('dueDate');
                appointmentDateValue = val('scheduledAt');
                currentLocation = val('location', '');
                isEditingDescription = false;
                autoSave.onOpen();
                showLocationInput = false;
                showDueDatePicker = false;
                showAppointmentDatePicker = false;
                isEditingLocation = false;
            }
        } else if (mode === 'edit') {
            autoSave.reset();
            showLocationInput = false;
            showDueDatePicker = false;
            showAppointmentDatePicker = false;
            isEditingDescription = false;
            isEditingLocation = false;
        }
    });

    const ownerMenuItems = $derived.by((): DropdownMenuEntry[] => {
        const rows: DropdownMenuEntry[] = [
            {
                label: 'Unassigned',
                id: 'owner-unassigned',
                action: () => {
                    ownerIdValue = '';
                }
            }
        ];
        for (const m of members) {
            rows.push({
                id: `owner-${m.id}`,
                label: m.name ?? m.email,
                action: () => {
                    ownerIdValue = m.id;
                }
            });
        }
        return rows;
    });

    async function deleteMilestone(confirmMessage: string) {
        if (!deleteAction) return;
        await confirmAndPostFormAction({
            url: deleteAction,
            id: val('id'),
            confirmMessage,
            successMessage: 'Milestone deleted',
            errorMessage: 'Failed to delete milestone',
            onSuccess: () => {
                window.location.href = '/timeline';
            }
        });
    }

    function handleLocationSave() {
        if (!locationAddress.trim()) return;
        currentLocation = locationAddress.trim();
        locationAddress = '';
        showLocationInput = false;
        isEditingLocation = false;
        if (mode === 'edit') void autoSave.triggerAutoSave();
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
        if (mode === 'edit') void autoSave.triggerAutoSave();
    }

    function handleAppointmentDateSave() {
        if (scheduledAtInputEl) {
            scheduledAtInputEl.value = appointmentDateValue;
        }
        showAppointmentDatePicker = false;
        if (mode === 'edit') void autoSave.triggerAutoSave();
    }

    async function onSubtaskMutate(immediate = false) {
        if (mode === 'edit') {
            await autoSave.triggerAutoSave(immediate);
        }
    }
</script>

{#snippet milestoneOwnerTrigger({ toggle }: { toggle: (e?: MouseEvent) => void })}
    <Button type="button" variant="outline" size="sm" onclick={toggle}>
        {#snippet children()}<User class="modal-icon-3-5" /> Owner{/snippet}
    </Button>
{/snippet}

{#snippet milestoneEditOverflowTrigger({ toggle }: { toggle: (e?: MouseEvent) => void })}
    <Button type="button" variant="ghost" size="sm" class="modal-icon-btn" onclick={toggle} aria-label="More options">
        <MoreHorizontal class="modal-icon-sm" />
    </Button>
{/snippet}

{#snippet milestoneActionChips()}
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
{/snippet}

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
                }}>Cancel</Button>
        </div>
    {/if}
{/snippet}

{#snippet milestoneEditHeader()}
    <span class="pill s-note">{PHASE_LABELS[phaseValue as keyof typeof PHASE_LABELS]}</span>
{/snippet}

{#snippet milestoneEditHeaderActions()}
    {#if deleteAction}
        <DropdownMenu
            menuId="milestone-edit-overflow"
            trigger={milestoneEditOverflowTrigger}
            position="bottom-end"
            size="sm"
            items={[
                {
                    label: 'Delete',
                    variant: 'destructive',
                    action: () =>
                        void deleteMilestone(
                            'Are you sure you want to delete this milestone? This action cannot be undone.'
                        )
                }
            ]}
        />
    {/if}
{/snippet}

{#snippet milestoneEditFooter()}
    {#if deleteAction}
        <Button
            type="button"
            variant="ghost"
            class="modal-footer-delete"
            onclick={() => void deleteMilestone('Are you sure you want to delete this milestone?')}
        >
            Delete
        </Button>
    {/if}
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
                <MapPin class="modal-icon-sm" />
                <Input
                    name="title"
                    bind:value={titleValue}
                    class="modal-title-input display"
                    placeholder="Milestone title"
                    required
                />
            </div>

            {@render milestoneActionChips()}

            <div class="modal-metadata-grid">
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Assigned to</span>
                    <div class="modal-metadata-value">
                        <DropdownMenu
                            menuId="milestone-create-owner"
                            trigger={milestoneOwnerTrigger}
                            items={ownerMenuItems}
                            position="bottom-start"
                            menuClass="min-w-[12rem]"
                        />
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
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Phase</span>
                    <div class="modal-metadata-value">
                        <Select id="milestone-create-phase" name="phase" bind:value={phaseValue}>
                            {#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
                        </Select>
                    </div>
                </div>
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Status</span>
                    <div class="modal-metadata-value">
                        <Select id="milestone-create-status" name="status" bind:value={statusValue}>
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="DONE">Done</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="SKIPPED">Skipped</option>
                        </Select>
                    </div>
                </div>
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Priority</span>
                    <div class="modal-metadata-value">
                        <Select id="milestone-create-priority" name="priority" bind:value={priorityValue}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </Select>
                    </div>
                </div>
            </div>

            {@render milestoneInlinePickers()}

            <div class="modal-description-section">
                <input type="hidden" name="description" value={descriptionValue} />
                {#if isEditingDescription}
                    <Textarea
                        bind:value={descriptionValue}
                        onblur={() => {
                            isEditingDescription = false;
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

            <TaskChecklistEditor bind:items={editableSubTasks} />

            {#if error}
                <div class="modal-error">
                    <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
                </div>
            {/if}
            <input type="hidden" name="subTasks" value={subTasksJson} />
            <input type="hidden" name="location" value={currentLocation} />
            <input type="hidden" name="dueDate" value={dueDateValue} />
            <input type="hidden" name="ownerId" value={ownerIdValue} />
            <input type="hidden" name="scheduledAt" value={appointmentDateValue} />
        </form>
    </Dialog>
{:else}
    <Dialog
        {open}
        {onClose}
        ariaLabel="Edit milestone"
        header={milestoneEditHeader}
        headerActions={milestoneEditHeaderActions}
        footer={milestoneEditFooter}
    >
        <form id="milestone-edit-form" method="post" {action} class="modal-form">
            <div class="modal-title-row">
                <MapPin class="modal-icon-sm" />
                <Input
                    name="title"
                    bind:value={titleValue}
                    oninput={() => void autoSave.triggerAutoSave()}
                    class="modal-title-input display"
                    placeholder="Milestone title"
                />
            </div>

            {@render milestoneActionChips()}

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

            {@render milestoneInlinePickers()}

            <div class="modal-description-section">
                <input type="hidden" name="description" value={descriptionValue} />
                {#if isEditingDescription}
                    <Textarea
                        name="description"
                        bind:value={descriptionValue}
                        oninput={() => void autoSave.triggerAutoSave()}
                        onblur={() => {
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

            <TaskChecklistEditor bind:items={editableSubTasks} onMutate={onSubtaskMutate} />

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
{/if}
