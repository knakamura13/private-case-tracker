<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { PHASE_LABELS, PHASE_ORDER } from '$lib/constants/phases';
	import { enhance } from '$app/forms';
	import { X, Plus, Calendar, Paperclip, MapPin, Trash2, CheckSquare } from 'lucide-svelte';

	let {
		open = false,
		onClose,
		initial = {},
		members = [],
		error,
		errorId,
		action,
		onenhance,
		deleteAction
	}: {
		open: boolean;
		onClose: () => void;
		initial?: Record<string, unknown>;
		members?: { id: string; name: string | null; email: string }[];
		error?: string | null;
		errorId?: string | null;
		action?: string;
		onenhance?: (params: { formData: FormData; cancel: () => void }) => void;
		deleteAction?: string;
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
	let showAttachmentInput = $state(false);
	let showLocationInput = $state(false);
	let showDueDatePicker = $state(false);
	let showChecklistInput = $state(false);

	// Input values
	let attachmentUrl = $state('');
	let locationAddress = $state('');
	let dueDateValue = $state('');

	// Auto-save state
	let isSaving = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	// Reactive form values
	let titleValue = $state('');
	let descriptionValue = $state('');
	let phaseValue = $state('PREPARATION');
	let statusValue = $state('PLANNED');
	let priorityValue = $state('MEDIUM');
	let ownerIdValue = $state('');

	const ALLOWED_FIELDS = ['id', 'title', 'description', 'phase', 'status', 'priority', 'ownerId', 'dueDate', 'subTasks', 'owner', 'attachments', 'location'] as const;

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
		triggerAutoSave();
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

	function ownerInitial(owner: unknown) {
		const o = owner as { name?: string; email?: string };
		return o?.name?.[0] || o?.email?.[0] || 'U';
	}

	function openGoogleMaps(address: string) {
		if (!address.trim()) return;
		const query = encodeURIComponent(address.trim());
		window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
	}

	function handleAttachmentAdd() {
		if (!attachmentUrl.trim()) return;
		// Store attachment in a hidden form field
		const existingAttachments = val('attachments', '');
		const newAttachments = existingAttachments ? `${existingAttachments},${attachmentUrl.trim()}` : attachmentUrl.trim();
		const hiddenInput = document.querySelector('input[name="attachments"]') as HTMLInputElement;
		if (hiddenInput) {
			hiddenInput.value = newAttachments;
		}
		attachmentUrl = '';
		showAttachmentInput = false;
		triggerAutoSave();
	}

	function handleLocationSave() {
		if (!locationAddress.trim()) return;
		// Store location in a hidden form field
		const hiddenInput = document.querySelector('input[name="location"]') as HTMLInputElement;
		if (hiddenInput) {
			hiddenInput.value = locationAddress.trim();
		}
		openGoogleMaps(locationAddress);
		locationAddress = '';
		showLocationInput = false;
		triggerAutoSave();
	}

	function handleDueDateSave() {
		// Store due date in a hidden form field
		const hiddenInput = document.querySelector('input[name="dueDate"]') as HTMLInputElement;
		if (hiddenInput) {
			hiddenInput.value = dueDateValue;
		}
		showDueDatePicker = false;
		triggerAutoSave();
	}

	function triggerAutoSave(immediate = false) {
		if (saveTimeout) clearTimeout(saveTimeout);
		// Only trigger if dialog is open and action is valid
		if (!open || !action) return;
		try {
			new URL(action); // Validate action is a valid URL
		} catch {
			return;
		}
		const delay = immediate ? 0 : 1000;
		saveTimeout = setTimeout(() => {
			const form = document.querySelector('form[method="post"]') as HTMLFormElement;
			if (form && onenhance) {
				isSaving = true;
				const formData = new FormData(form);
				onenhance({ formData, cancel: () => { isSaving = false; } });
				// If cancel wasn't called, proceed with fetch
				fetch(action, { method: 'POST', body: formData })
					.then(() => {
						isSaving = false;
					})
					.catch(() => {
						isSaving = false;
					});
			}
		}, delay);
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card shadow-xl"
			role="document"
		>
			<form method="post" {action} use:enhance={onenhance} class="flex flex-col">
				<!-- Header -->
				<div class="flex items-start justify-between border-b border-border p-4">
					<div class="flex flex-1 items-start">
						<Input
							name="title"
							bind:value={titleValue}
							oninput={() => triggerAutoSave()}
							class="flex-1 border-none bg-transparent p-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
							placeholder="Title"
						/>
					</div>
					<Button type="button" variant="ghost" size="sm" onclick={onClose} class="shrink-0">
						{#snippet children()}<X class="h-5 w-5" />{/snippet}
					</Button>
				</div>

				<!-- Main Content -->
				<div class="flex flex-col gap-4 p-4 md:flex-row">
					<!-- Left Column -->
					<div class="flex-1 space-y-4">
						<!-- Actions Bar -->
						<div class="flex flex-wrap gap-2">
							<Button type="button" variant="outline" size="sm" onclick={() => showAttachmentInput = !showAttachmentInput}>
								{#snippet children()}<Paperclip class="h-4 w-4" /> Attachment{/snippet}
							</Button>
							<Button type="button" variant="outline" size="sm" onclick={() => showLocationInput = !showLocationInput}>
								{#snippet children()}<MapPin class="h-4 w-4" /> Location{/snippet}
							</Button>
							<Button type="button" variant="outline" size="sm" onclick={() => showDueDatePicker = !showDueDatePicker}>
								{#snippet children()}<Calendar class="h-4 w-4" /> Due date{/snippet}
							</Button>
						</div>

						<!-- Attachment Input -->
						{#if showAttachmentInput}
							<div class="mt-2 flex gap-2">
								<Input
									bind:value={attachmentUrl}
									placeholder="Enter attachment URL..."
									class="flex-1 text-sm"
								/>
								<Button type="button" size="sm" onclick={handleAttachmentAdd}>Add</Button>
								<Button type="button" variant="ghost" size="sm" onclick={() => showAttachmentInput = false}>Cancel</Button>
							</div>
						{/if}

						<!-- Location Input -->
						{#if showLocationInput}
							<div class="mt-2 flex gap-2">
								<Input
									bind:value={locationAddress}
									placeholder="Enter address..."
									class="flex-1 text-sm"
								/>
								<Button type="button" size="sm" onclick={handleLocationSave}>Open Maps</Button>
								<Button type="button" variant="ghost" size="sm" onclick={() => showLocationInput = false}>Cancel</Button>
							</div>
						{/if}

						<!-- Due Date Picker -->
						{#if showDueDatePicker}
							<div class="mt-2 flex gap-2">
								<Input
									bind:value={dueDateValue}
									type="date"
									class="text-sm"
								/>
								<Button type="button" size="sm" onclick={handleDueDateSave}>Save</Button>
								<Button type="button" variant="ghost" size="sm" onclick={() => showDueDatePicker = false}>Cancel</Button>
							</div>
						{/if}

						<!-- Members -->
						<div class="flex items-center gap-2">
							{#if initial.owner}
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
									{ownerInitial(initial.owner)}
								</div>
							{/if}
						</div>

						<!-- Description -->
						<div>
							<Textarea
								name="description"
								bind:value={descriptionValue}
								oninput={() => triggerAutoSave()}
								placeholder="Add a more detailed description..."
								rows={3}
								class="resize-none"
							/>
						</div>

						<!-- Checklist -->
						<Card class="p-3">
							<div class="mb-2 flex items-center gap-2">
								<CheckSquare class="h-4 w-4 text-muted-foreground" />
								<span class="text-sm font-medium">Sub-tasks</span>
							</div>
							<div class="mb-3 flex items-center gap-2">
								<span class="text-sm text-muted-foreground">{checklistProgress()}%</span>
								<div class="h-1.5 flex-1 rounded-full bg-muted">
									<div class="h-1.5 rounded-full bg-primary transition-all" style="width: {checklistProgress()}%"></div>
								</div>
							</div>
							{#if editableSubTasks.length > 0}
								<div class="mb-3 space-y-2">
									{#each editableSubTasks as st (st.id)}
										<div class="flex items-start gap-2">
											<input
												type="checkbox"
												checked={st.done}
												onchange={() => toggleSubTask(st.id)}
												class="mt-0.5 h-4 w-4 rounded border-border"
											/>
											<span class={st.done ? 'line-through text-muted-foreground' : 'text-sm'}>{st.text}</span>
											<Button type="button" variant="ghost" size="sm" class="ml-auto h-6 w-6 p-0" onclick={() => _removeSubTask(st.id)}>
												{#snippet children()}<Trash2 class="h-3 w-3" />{/snippet}
											</Button>
										</div>
									{/each}
								</div>
							{/if}
							{#if !showChecklistInput}
								<Button type="button" variant="ghost" size="sm" onclick={() => showChecklistInput = true} class="w-full justify-start text-muted-foreground">
									{#snippet children()}<Plus class="h-4 w-4 mr-2" /> Add an item{/snippet}
								</Button>
							{:else}
								<div class="space-y-2">
									<Input
										bind:value={newSubTaskText}
										placeholder="Enter item..."
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addSubTask();
												showChecklistInput = false;
											}
										}}
										class="w-full text-sm"
									/>
									<div class="flex justify-start gap-2">
										<Button type="button" size="sm" onclick={() => {
											addSubTask();
											showChecklistInput = false;
										}}>Add</Button>
										<Button type="button" variant="ghost" size="sm" onclick={() => {
											newSubTaskText = '';
											showChecklistInput = false;
										}}>Cancel</Button>
									</div>
								</div>
							{/if}
						</Card>
					</div>

					<!-- Right Column - Settings -->
					<div class="w-full space-y-4 md:w-64">
						<Card class="p-3 space-y-3">
							<div>
								<label for="phase" class="mb-1 block text-xs font-medium text-muted-foreground">Phase</label>
								<Select id="phase" name="phase" bind:value={phaseValue} onchange={() => triggerAutoSave()} class="text-sm">
									{#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
								</Select>
							</div>
							<div>
								<label for="status" class="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
								<Select id="status" name="status" bind:value={statusValue} onchange={() => triggerAutoSave()} class="text-sm">
									<option value="PLANNED">Planned</option>
									<option value="IN_PROGRESS">In progress</option>
									<option value="DONE">Done</option>
									<option value="BLOCKED">Blocked</option>
									<option value="SKIPPED">Skipped</option>
								</Select>
							</div>
							<div>
								<label for="priority" class="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
								<Select id="priority" name="priority" bind:value={priorityValue} onchange={() => triggerAutoSave()} class="text-sm">
									<option value="LOW">Low</option>
									<option value="MEDIUM">Medium</option>
									<option value="HIGH">High</option>
									<option value="CRITICAL">Critical</option>
								</Select>
							</div>
							<div>
								<label for="ownerId" class="mb-1 block text-xs font-medium text-muted-foreground">Owner</label>
								<Select id="ownerId" name="ownerId" bind:value={ownerIdValue} onchange={() => triggerAutoSave()} class="text-sm">
									<option value="">Unassigned</option>
									{#each members as m (m.id)}<option value={m.id}>{m.name ?? m.email}</option>{/each}
								</Select>
							</div>
						</Card>
					</div>
				</div>

				<!-- Footer -->
				<div class="border-t border-border p-4">
					{#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
					<input type="hidden" name="subTasks" value={subTasksJson} />
					<input type="hidden" name="id" value={val('id')} />
					<input type="hidden" name="dueDate" value={dueDateValue} />
					<input type="hidden" name="attachments" value={val('attachments', '')} />
					<input type="hidden" name="location" value={val('location', '')} />
					<div class="flex justify-between gap-2">
						{#if deleteAction}
							<Button type="button" variant="destructive" onclick={async () => {
								const formData = new FormData();
								formData.append('id', val('id'));
								await fetch(deleteAction, { method: 'POST', body: formData });
								window.location.href = '/timeline';
							}}>
								{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
							</Button>
						{/if}
						{#if isSaving}
							<span class="ml-auto text-sm text-muted-foreground">Saving...</span>
						{/if}
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
