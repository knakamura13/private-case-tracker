<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import RichText from '$lib/components/ui/RichText.svelte';
    import ByAvatar from '$lib/components/shared/ByAvatar.svelte';
    import { showSuccessToast, showErrorToast } from '$lib/stores/toast';
    import { X, Plus, Calendar, CheckSquare, User, MoreHorizontal, Image, Paperclip, Link, FileText } from 'lucide-svelte';
    import { invalidateAll } from '$app/navigation';

    let {
        open,
        onClose,
        action,
        deleteAction,
        onenhance,
        members,
        initial,
        error,
        errorId
    }: {
        open: boolean;
        onClose: () => void | Promise<void>;
        action: string;
        deleteAction?: string;
        onenhance?: (params: { formData: FormData; cancel: () => void }) => void | (() => Promise<void>);
        members: { id: string; name: string | null; email: string }[];
        initial: Record<string, unknown>;
        error?: string;
        errorId?: string;
    } = $props();

    interface ChecklistItem {
        id: string;
        taskId?: string;
        text: string;
        done: boolean;
        order?: number;
    }

    let editableChecklist = $state<ChecklistItem[]>([]);
    let newChecklistText = $state('');
    let checklistJson = $derived(JSON.stringify(editableChecklist));

    // Button visibility states
    let showDueDatePicker = $state(false);
    let showChecklistInput = $state(false);
    let showMenuDropdown = $state(false);
    let isEditingDescription = $state(false);
    let editingChecklistId = $state<string | null>(null);
    let editingChecklistText = $state('');
    let dueDateInputEl = $state<HTMLInputElement | null>(null);

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
    let dueDateValue = $state('');

    // Auto-save state
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingSavePromise: Promise<void> | null = null;
    let focusedField = $state<string | null>(null);
    let hasPendingChanges = $state(false);
    let saveVersion = 0;
    let lastSavedVersion = 0;

    // Reactive form values
    let titleValue = $state('');
    let descriptionValue = $state('');
    let statusValue = $state('TODO');
    let priorityValue = $state('MEDIUM');
    let ownerIdValue = $state('');
    let selectedOwner = $derived(members.find((m) => m.id === ownerIdValue) ?? null);

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

    // Overdue calculation
    const isOverdue = $derived(() => {
        if (!dueDateValue || statusValue === 'DONE') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDateValue);
        return due < today;
    });

    const ALLOWED_FIELDS = ['id', 'title', 'description', 'status', 'priority', 'ownerId', 'dueDate', 'checklist'] as const;

    // Initialize reactive values from initial props when modal opens
    $effect(() => {
        if (open) {
            titleValue = val('title');
            descriptionValue = val('description');
            statusValue = val('status', 'TODO');
            priorityValue = val('priority', 'MEDIUM');
            ownerIdValue = val('ownerId');
            editableChecklist = parseChecklist(initial.checklist);
            dueDateValue = val('dueDate');
            isEditingDescription = false;
            focusedField = null;
            hasPendingChanges = false;
            saveVersion = 0;
            lastSavedVersion = 0;
        } else {
            // Reset state when modal closes
            showDueDatePicker = false;
            showChecklistInput = false;
            showMenuDropdown = false;
            isEditingDescription = false;
            editingChecklistId = null;
            editingChecklistText = '';
            focusedField = null;
            hasPendingChanges = false;
            saveVersion = 0;
            lastSavedVersion = 0;
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

    function parseChecklist(checklist: unknown): ChecklistItem[] {
        if (!checklist) return [];
        try {
            const parsed = checklist as ChecklistItem[];
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => item && typeof item === 'object' && 'id' in item && 'text' in item);
            }
            return [];
        } catch {
            return [];
        }
    }

    function addChecklistItem() {
        if (!newChecklistText.trim()) return;
        editableChecklist = [
            ...editableChecklist,
            { id: crypto.randomUUID(), text: newChecklistText.trim(), done: false, order: editableChecklist.length }
        ];
        newChecklistText = '';
        triggerAutoSave();
    }

    function removeChecklistItem(id: string) {
        editableChecklist = editableChecklist.filter((ci) => ci.id !== id);
        triggerAutoSave(true);
    }

    function updateChecklistItemText(id: string, newText: string) {
        editableChecklist = editableChecklist.map((ci) => (ci.id === id ? { ...ci, text: newText } : ci));
        triggerAutoSave(true);
    }

    function toggleChecklistItem(id: string) {
        editableChecklist = editableChecklist.map((ci) => (ci.id === id ? { ...ci, done: !ci.done } : ci));
        triggerAutoSave();
    }

    function checklistProgress() {
        if (editableChecklist.length === 0) return 0;
        const done = editableChecklist.filter((ci) => ci.done).length;
        return Math.round((done / editableChecklist.length) * 100);
    }

    function handleDueDateSave() {
        if (dueDateInputEl) {
            dueDateInputEl.value = dueDateValue;
        }
        showDueDatePicker = false;
        triggerAutoSave();
    }

    function markFocused(field: string) {
        focusedField = field;
    }

    function markBlurred(field: string) {
        if (focusedField === field) {
            focusedField = null;
        }
    }

    async function performAutoSave() {
        if (!onenhance || !open || !action) return;
        if (pendingSavePromise) {
            await pendingSavePromise;
            if (saveVersion > lastSavedVersion) {
                await performAutoSave();
            }
            return;
        }

        const versionToSave = saveVersion;
        const formData = new FormData();
        formData.append('id', val('id'));
        formData.append('title', titleValue);
        formData.append('description', descriptionValue);
        formData.append('status', statusValue);
        formData.append('priority', priorityValue);
        formData.append('ownerId', ownerIdValue);
        formData.append('dueDate', dueDateValue);
        formData.append('checklist', checklistJson);

        const cancel = () => undefined;

        pendingSavePromise = (async () => {
            try {
                const result = onenhance({ formData, cancel });
                if (result && typeof result === 'function') {
                    await result();
                }
                lastSavedVersion = Math.max(lastSavedVersion, versionToSave);
                hasPendingChanges = saveVersion > lastSavedVersion;
            } catch {
                showErrorToast('Failed to auto-save task');
                cancel();
            }
            pendingSavePromise = null;
        })();

        await pendingSavePromise;
    }

    async function triggerAutoSave(immediate = false, force = false) {
        saveVersion += 1;
        hasPendingChanges = true;
        if (saveTimeout) clearTimeout(saveTimeout);
        if (!open || !action) return;
        if (focusedField && !force) return;

        if (immediate) {
            await performAutoSave();
            return;
        }

        saveTimeout = setTimeout(() => {
            saveTimeout = null;
            if (focusedField && !force) return;
            void performAutoSave();
        }, 2000);
    }

    async function saveBeforeClose() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        if (hasPendingChanges || pendingSavePromise) {
            focusedField = null;
            await triggerAutoSave(true, true);
        }
        await onClose();
    }
</script>

<Dialog {open} onClose={saveBeforeClose}>
    <form method="post" {action} class="modal-form">
        <!-- Header -->
        <div class="modal-header">
            <div class="modal-header-left">
                <span class="pill {statusPillClass()}">{statusLabel()}</span>
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
                                        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                                            const formData = new FormData();
                                            formData.append('id', val('id'));
                                            const response = await fetch(deleteAction, { method: 'POST', body: formData });
                                            if (response.ok) {
                                                showSuccessToast('Task deleted successfully');
                                                await invalidateAll();
                                                onClose();
                                            } else {
                                                showErrorToast('Failed to delete task');
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
                <Button type="button" variant="ghost" size="sm" onclick={saveBeforeClose} class="modal-icon-btn">
                    <X class="modal-icon-sm" />
                </Button>
            </div>
        </div>

        <!-- Title Row -->
        <div class="modal-title-row">
            <input
                type="checkbox"
                checked={statusValue === 'DONE'}
                onchange={() => {
                    statusValue = statusValue === 'DONE' ? 'TODO' : 'DONE';
                    triggerAutoSave(true);
                }}
                class="modal-title-checkbox"
            />
            <Input
                name="title"
                bind:value={titleValue}
                oninput={() => triggerAutoSave()}
                onfocus={() => markFocused('title')}
                onblur={() => {
                    markBlurred('title');
                    triggerAutoSave(true);
                }}
                class="modal-title-input display"
                placeholder="Task title"
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
                    {#if selectedOwner}
                        <ByAvatar owner={selectedOwner} size="sm" />
                        <span>{selectedOwner.name ?? selectedOwner.email}</span>
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
                        {#if isOverdue()}
                            <span class="pill s-urgent">Overdue</span>
                        {/if}
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
                <Input bind:value={dueDateValue} type="date" class="modal-text-sm" />
                <Button type="button" size="sm" onclick={handleDueDateSave}>Save</Button>
                <Button type="button" variant="ghost" size="sm" onclick={() => (showDueDatePicker = false)}>Cancel</Button>
            </div>
        {/if}

        <!-- Description -->
        <div class="modal-description-section">
            {#if isEditingDescription}
                <Textarea
                    name="description"
                    bind:value={descriptionValue}
                    oninput={() => triggerAutoSave()}
                    onfocus={() => markFocused('description')}
                    onblur={() => {
                        markBlurred('description');
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

        <!-- Checklist -->
        <div class="modal-checklist-section">
            <div class="modal-checklist-header">
                <CheckSquare class="modal-icon-sm" />
                <span>Sub-tasks</span>
                {#if editableChecklist.length > 0}
                    <span class="modal-checklist-progress-text">{checklistProgress()}%</span>
                {/if}
            </div>
            {#if editableChecklist.length > 0}
                <div class="modal-checklist-progress-bar">
                    <div class="modal-checklist-progress-fill" style="width: {checklistProgress()}%"></div>
                </div>
            {/if}
            {#if editableChecklist.length > 0}
                <div class="modal-checklist-items">
                    {#each editableChecklist as ci (ci.id)}
                        <div class="modal-checklist-item">
                            <input
                                type="checkbox"
                                checked={ci.done}
                                onchange={() => toggleChecklistItem(ci.id)}
                                class="modal-checklist-checkbox"
                            />
                            {#if editingChecklistId === ci.id}
                                <Input
                                    bind:value={editingChecklistText}
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            updateChecklistItemText(ci.id, editingChecklistText);
                                            editingChecklistId = null;
                                        } else if (e.key === 'Escape') {
                                            editingChecklistId = null;
                                        }
                                    }}
                                    onblur={() => {
                                        if (editingChecklistText !== ci.text) {
                                            updateChecklistItemText(ci.id, editingChecklistText);
                                        }
                                        editingChecklistId = null;
                                    }}
                                    class="modal-checklist-input"
                                />
                            {:else}
                                <span class={ci.done ? 'modal-checklist-text-done' : 'modal-checklist-text'}>{ci.text}</span>
                            {/if}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                class="modal-icon-btn-sm"
                                onclick={() => removeChecklistItem(ci.id)}
                            >
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
                        bind:value={newChecklistText}
                        placeholder="Enter sub-task..."
                        onkeydown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addChecklistItem();
                            }
                        }}
                        class="modal-checklist-add-input"
                    />
                    <Button type="button" size="sm" onclick={addChecklistItem}>Add</Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onclick={() => {
                            newChecklistText = '';
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
                        if (confirm('Are you sure you want to delete this task?')) {
                            const formData = new FormData();
                            formData.append('id', val('id'));
                            const response = await fetch(deleteAction, { method: 'POST', body: formData });
                            if (response.ok) {
                                showSuccessToast('Task deleted');
                                await invalidateAll();
                                onClose();
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
        <input type="hidden" name="checklist" value={checklistJson} />
        <input type="hidden" name="id" value={val('id')} />
        <input type="hidden" name="ownerId" value={ownerIdValue} />
        <input type="hidden" name="dueDate" value={dueDateValue} bind:this={dueDateInputEl} />
    </form>
</Dialog>
