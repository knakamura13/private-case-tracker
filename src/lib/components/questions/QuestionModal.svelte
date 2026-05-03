<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
    import { fieldFromInitial } from '$lib/utils/initialFields';
    import { confirmAndPostFormAction } from '$lib/utils/confirmFormAction';
    import { questionStatusLabel, questionStatusPillClass } from '$lib/questions/questionStatusDisplay';
    import type { ManualEnhanceHandler } from '$lib/utils/enhanceSubmit';
    import { MoreHorizontal, HelpCircle, Plus, FileText, Link, CheckSquare } from 'lucide-svelte';
    import { invalidateAll } from '$app/navigation';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';

    let {
        mode,
        open,
        onClose,
        action,
        members: _members,
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
        initial?: Record<string, unknown>;
        deleteAction?: string;
        error?: string;
        errorId?: string;
        onenhance?: SubmitFunction | ManualEnhanceHandler;
    } = $props();

    const submitEnhance = $derived(mode === 'create' ? (onenhance as SubmitFunction | undefined) : undefined);

    const QUESTION_ALLOWED = [
        'id',
        'question',
        'category',
        'priority',
        'status',
        'sourceType',
        'citationUrl',
        'answer',
        'answeredAt'
    ] as const;

    const questionPriorityOptions = [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'CRITICAL', label: 'Critical' }
    ];
    const questionStatusOptions = [
        { value: 'OPEN', label: 'Open' },
        { value: 'RESEARCHING', label: 'Researching' },
        { value: 'ANSWERED', label: 'Answered' },
        { value: 'WONT_FIX', label: "Won't pursue" }
    ];
    const questionSourceTypeOptions = [
        { value: 'ATTORNEY', label: 'Attorney' },
        { value: 'NONPROFIT', label: 'Nonprofit' },
        { value: 'USCIS_SITE', label: 'USCIS site' },
        { value: 'COUNTY_SITE', label: 'County site' },
        { value: 'COMMUNITY', label: 'Community' },
        { value: 'OTHER', label: 'Other' }
    ];

    function val(name: string, fallback = '') {
        return fieldFromInitial(initial, QUESTION_ALLOWED, name, fallback);
    }

    let questionValue = $state('');
    let categoryValue = $state('');
    let priorityValue = $state('MEDIUM');
    let statusValue = $state('OPEN');
    let sourceTypeValue = $state('OTHER');
    let citationUrlValue = $state('');
    let answerValue = $state('');
    let answeredAtValue = $state('');

    const statusPillClass = $derived(() => questionStatusPillClass(statusValue));
    const statusLabel = $derived(() => questionStatusLabel(statusValue));

    $effect(() => {
        if (open) {
            if (mode === 'create') {
                questionValue = '';
                categoryValue = '';
                priorityValue = 'MEDIUM';
                statusValue = 'OPEN';
                sourceTypeValue = 'OTHER';
                citationUrlValue = '';
                answerValue = '';
                answeredAtValue = '';
            } else {
                questionValue = val('question');
                categoryValue = val('category');
                priorityValue = val('priority', 'MEDIUM');
                statusValue = val('status', 'OPEN');
                sourceTypeValue = val('sourceType', 'OTHER');
                citationUrlValue = val('citationUrl');
                answerValue = val('answer');
                answeredAtValue = val('answeredAt');
            }
        }
    });

    async function deleteQuestion(confirmMessage: string) {
        if (!deleteAction) return;
        await confirmAndPostFormAction({
            url: deleteAction,
            id: val('id'),
            confirmMessage,
            successMessage: 'Question deleted',
            errorMessage: 'Failed to delete question',
            onSuccess: async () => {
                await invalidateAll();
                onClose();
            }
        });
    }
</script>

{#snippet questionEditOverflowTrigger({ toggle }: { toggle: (e?: MouseEvent) => void })}
    <Button type="button" variant="ghost" size="sm" class="modal-icon-btn" onclick={toggle} aria-label="More options">
        <MoreHorizontal class="modal-icon-sm" />
    </Button>
{/snippet}

{#snippet questionEditHeader()}
    <span class="pill {statusPillClass()}">{statusLabel()}</span>
{/snippet}

{#snippet questionEditHeaderActions()}
    {#if deleteAction}
        <DropdownMenu
            menuId="question-edit-overflow"
            trigger={questionEditOverflowTrigger}
            position="bottom-end"
            size="sm"
            items={[
                {
                    label: 'Delete',
                    variant: 'destructive',
                    action: () =>
                        void deleteQuestion(
                            'Are you sure you want to delete this question? This action cannot be undone.'
                        )
                }
            ]}
        />
    {/if}
{/snippet}

{#snippet questionEditFooter()}
    <input type="hidden" name="id" value={val('id')} form="question-edit-form" />
    {#if deleteAction}
        <Button
            type="button"
            variant="ghost"
            class="modal-footer-delete"
            onclick={() => void deleteQuestion('Are you sure you want to delete this question?')}
        >
            Delete
        </Button>
    {/if}
    <Button type="button" variant="ghost" onclick={onClose}>Cancel</Button>
    <Button type="submit" form="question-edit-form" class="modal-footer-save">Save changes</Button>
{/snippet}

{#if mode === 'create'}
    <Dialog
        {open}
        {onClose}
        title="New question"
        footerFormId="question-create-form"
        cancelLabel="Cancel"
        submitLabel="Add question"
    >
        <form id="question-create-form" method="post" {action} use:enhance={submitEnhance!} class="modal-form">
            <div>
                <label for="question" class="modal-label">Question</label>
                <Textarea id="question" name="question" bind:value={questionValue} required rows={3} />
            </div>
            <div class="form-grid">
                <div>
                    <label for="category" class="modal-label">Category</label>
                    <Input id="category" name="category" bind:value={categoryValue} />
                </div>
                <div>
                    <label for="priority" class="modal-label">Priority</label>
                    <Select
                        id="priority"
                        name="priority"
                        bind:value={priorityValue}
                        options={questionPriorityOptions}
                    />
                </div>
                <div>
                    <label for="status" class="modal-label">Status</label>
                    <Select id="status" name="status" bind:value={statusValue} options={questionStatusOptions} />
                </div>
                <div>
                    <label for="sourceType" class="modal-label">Source type</label>
                    <Select
                        id="sourceType"
                        name="sourceType"
                        bind:value={sourceTypeValue}
                        options={questionSourceTypeOptions}
                    />
                </div>
            </div>
            <div>
                <label for="citationUrl" class="modal-label">Citation URL</label>
                <Input id="citationUrl" name="citationUrl" type="url" bind:value={citationUrlValue} />
            </div>
            <div>
                <label for="answer" class="modal-label">Answer</label>
                <Textarea id="answer" name="answer" bind:value={answerValue} rows={5} />
            </div>
            <div>
                <label for="answeredAt" class="modal-label">Answered on</label>
                <Input id="answeredAt" name="answeredAt" type="date" bind:value={answeredAtValue} />
            </div>
            {#if error}
                <div class="modal-error">
                    <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
                </div>
            {/if}
        </form>
    </Dialog>
{:else}
    <Dialog
        {open}
        {onClose}
        ariaLabel="Edit question"
        header={questionEditHeader}
        headerActions={questionEditHeaderActions}
        footer={questionEditFooter}
    >
        <form id="question-edit-form" method="post" {action} use:enhance={onenhance as SubmitFunction} class="modal-form">
            <div class="modal-title-row">
                <HelpCircle class="modal-icon-sm" />
                <Input name="question" bind:value={questionValue} class="modal-title-input display" placeholder="Question" required />
            </div>

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

            <div class="modal-metadata-grid">
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Category</span>
                    <div class="modal-metadata-value">
                        <Input name="category" bind:value={categoryValue} class="modal-text-sm" placeholder="Category" />
                    </div>
                </div>
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Priority</span>
                    <div class="modal-metadata-value">
                        <Select
                            name="priority"
                            bind:value={priorityValue}
                            options={questionPriorityOptions}
                            triggerClass="modal-metadata-btn"
                        />
                    </div>
                </div>
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Status</span>
                    <div class="modal-metadata-value">
                        <Select
                            name="status"
                            bind:value={statusValue}
                            options={questionStatusOptions}
                            triggerClass="modal-metadata-btn"
                        />
                    </div>
                </div>
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">Source type</span>
                    <div class="modal-metadata-value">
                        <Select
                            name="sourceType"
                            bind:value={sourceTypeValue}
                            options={questionSourceTypeOptions}
                            triggerClass="modal-metadata-btn"
                        />
                    </div>
                </div>
            </div>

            <div class="modal-mt-2">
                <span class="modal-metadata-label">Citation URL</span>
                <div class="modal-metadata-value">
                    <Input name="citationUrl" type="url" bind:value={citationUrlValue} placeholder="https://..." />
                </div>
            </div>

            <div class="modal-description-section">
                <span class="modal-metadata-label">Answer</span>
                <Textarea name="answer" bind:value={answerValue} placeholder="Enter answer..." rows={5} class="modal-description-textarea" />
            </div>

            <div class="modal-mt-2">
                <span class="modal-metadata-label">Answered on</span>
                <div class="modal-metadata-value">
                    <Input name="answeredAt" type="date" bind:value={answeredAtValue} class="modal-text-sm" />
                </div>
            </div>

            {#if error}
                <div class="modal-error">
                    <ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
                </div>
            {/if}
        </form>
    </Dialog>
{/if}
