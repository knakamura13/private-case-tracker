<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import RichText from '$lib/components/ui/RichText.svelte';
	import { showSuccessToast, showErrorToast } from '$lib/stores/toast';
	import { X, Plus, Calendar, CheckSquare, User, MoreHorizontal } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { open, onClose, action, deleteAction, onenhance, members, initial, error, errorId }: {
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
	let showOwnerDropdown = $state(false);
	let showMenuDropdown = $state(false);
	let isEditingDescription = $state(false);
	let openChecklistMenuId = $state<string | null>(null);
	let editingChecklistId = $state<string | null>(null);
	let editingChecklistText = $state('');
	let newChecklistInputEl = $state<HTMLInputElement | null>(null);
	let dueDateInputEl = $state<HTMLInputElement | null>(null);

	// Focus new checklist item input when shown
	$effect(() => {
		if (showChecklistInput && newChecklistInputEl) {
			newChecklistInputEl.focus();
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
			showOwnerDropdown = false;
			showMenuDropdown = false;
			isEditingDescription = false;
			openChecklistMenuId = null;
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
		editableChecklist = [...editableChecklist, { id: crypto.randomUUID(), text: newChecklistText.trim(), done: false, order: editableChecklist.length }];
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

	function ownerInitial(owner: unknown) {
		const o = owner as { name?: string; email?: string };
		return o?.name?.[0] || o?.email?.[0] || 'U';
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
			<div class="flex flex-1 items-start">
				<Input
					name="title"
					bind:value={titleValue}
					oninput={() => triggerAutoSave()}
					onfocus={() => markFocused('title')}
					onblur={() => {
						markBlurred('title');
						triggerAutoSave(true);
					}}
					class="modal-title-input"
					placeholder="Title"
				/>
			</div>
			<div class="flex items-center gap-1">
				{#if deleteAction}
					<div class="modal-dropdown" use:clickOutside={() => showMenuDropdown = false}>
						<Button type="button" variant="ghost" size="sm" onclick={() => showMenuDropdown = !showMenuDropdown} class="shrink-0">
							{#snippet children()}<MoreHorizontal class="h-5 w-5" />{/snippet}
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
				<Button type="button" variant="ghost" size="sm" onclick={saveBeforeClose} class="shrink-0">
					{#snippet children()}<X class="h-5 w-5" />{/snippet}
				</Button>
			</div>
		</div>

		<!-- Main Content -->
		<div class="modal-content-two-col">
			<!-- Left Column -->
			<div class="modal-content-left">
				<!-- Actions Bar -->
				<div class="modal-actions-bar">
					<div class="modal-dropdown" use:clickOutside={() => showOwnerDropdown = false}>
						<Button type="button" variant="outline" size="sm" onclick={() => showOwnerDropdown = !showOwnerDropdown}>
							{#snippet children()}<User class="h-3.5 w-3.5" /> {selectedOwner ? selectedOwner.name ?? selectedOwner.email : 'Owner'}{/snippet}
						</Button>
						{#if showOwnerDropdown}
							<div class="modal-dropdown-menu" style="left: 0; right: auto; width: 12rem;">
								<button
									type="button"
									class="modal-dropdown-item"
									onclick={() => {
										ownerIdValue = '';
										showOwnerDropdown = false;
										triggerAutoSave(true);
									}}
								>
									Unassigned
								</button>
								{#each members as m (m.id)}
									<button
										type="button"
										class="modal-dropdown-item"
										onclick={() => {
											ownerIdValue = m.id;
											showOwnerDropdown = false;
											triggerAutoSave(true);
										}}
									>
										{m.name ?? m.email}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					<Button type="button" variant="outline" size="sm" onclick={() => showDueDatePicker = !showDueDatePicker}>
						{#snippet children()}<Calendar class="h-3.5 w-3.5" /> Due date{/snippet}
					</Button>
				</div>

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
				{:else if dueDateValue}
					<div class="mt-2 flex items-center gap-2 text-sm">
						<span>Due: {dueDateValue}</span>
						<Button type="button" variant="ghost" size="sm" class="modal-icon-btn-sm" onclick={() => {
							showDueDatePicker = true;
						}}>
							{#snippet children()}<MoreHorizontal class="h-4 w-4" />{/snippet}
						</Button>
					</div>
				{/if}

				<!-- Members -->
				<div class="flex items-center gap-2">
					{#if selectedOwner}
						<div class="modal-avatar">
							{ownerInitial(selectedOwner)}
						</div>
						<span class="modal-text-muted">{selectedOwner.name ?? selectedOwner.email}</span>
					{/if}
				</div>

				<!-- Description -->
				<div>
					<div class="modal-label">Description</div>
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
							placeholder="Add a more detailed description... URLs and phone numbers will be clickable."
							rows={4}
						/>
					{:else}
						<Card class="modal-editable-card">
							{#if descriptionValue}
								<RichText
									text={descriptionValue}
									editable={true}
									onClick={() => {
										isEditingDescription = true;
									}}
								/>
							{:else}
								<div
									class="modal-editable-placeholder"
									onclick={() => {
										isEditingDescription = true;
									}}
									role="button"
									tabindex={0}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											isEditingDescription = true;
										}
									}}
								>
									Add a more detailed description...
								</div>
							{/if}
						</Card>
					{/if}
				</div>

				<!-- Checklist -->
				<Card class="modal-checklist-card">
					<div class="modal-checklist-header">
						<CheckSquare class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm font-medium">Checklist</span>
					</div>
					{#if editableChecklist.length > 0}
						<div class="modal-checklist-progress">
							<span>{checklistProgress()}%</span>
							<div class="modal-checklist-progress-bar">
								<div class="modal-checklist-progress-fill" style="width: {checklistProgress()}%"></div>
							</div>
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
									<div class="relative ml-auto">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="modal-icon-btn-sm"
											onclick={() => openChecklistMenuId = openChecklistMenuId === ci.id ? null : ci.id}
										>
											{#snippet children()}<MoreHorizontal class="h-4 w-4" />{/snippet}
										</Button>
										{#if openChecklistMenuId === ci.id}
											<div class="modal-dropdown-menu" style="width: 6rem;" use:clickOutside={() => openChecklistMenuId = null}>
												<button
													type="button"
													class="modal-dropdown-item"
													onclick={() => {
														editingChecklistId = ci.id;
														editingChecklistText = ci.text;
														openChecklistMenuId = null;
													}}
												>
													Edit
												</button>
												<button
													type="button"
													class="modal-dropdown-button"
													onclick={() => {
														removeChecklistItem(ci.id);
														openChecklistMenuId = null;
													}}
												>
													Delete
												</button>
											</div>
										{/if}
									</div>
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
							<input
								type="text"
								bind:value={newChecklistText}
								bind:this={newChecklistInputEl}
								placeholder="Enter item..."
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addChecklistItem();
									}
								}}
								class="modal-checklist-add-input"
							/>
							<div class="flex justify-start gap-2">
								<Button type="button" size="sm" onclick={() => {
									addChecklistItem();
								}}>Add</Button>
								<Button type="button" variant="ghost" size="sm" onclick={() => {
									newChecklistText = '';
									showChecklistInput = false;
								}}>Cancel</Button>
							</div>
						</div>
					{/if}
				</Card>
			</div>

			<!-- Right Column - Settings -->
			<div class="modal-content-right">
				<Card class="modal-settings-card">
					<div>
						<label for="status" class="modal-settings-label">Status</label>
						<Select id="status" name="status" bind:value={statusValue} onchange={() => triggerAutoSave()} class="text-sm">
							<option value="TODO">To Do</option>
							<option value="IN_PROGRESS">In Progress</option>
							<option value="DONE">Done</option>
						</Select>
					</div>
					<div>
						<label for="priority" class="modal-settings-label">Priority</label>
						<Select id="priority" name="priority" bind:value={priorityValue} onchange={() => triggerAutoSave()} class="text-sm">
							<option value="LOW">Low</option>
							<option value="MEDIUM">Medium</option>
							<option value="HIGH">High</option>
							<option value="CRITICAL">Critical</option>
						</Select>
					</div>
				</Card>
			</div>
		</div>

		<!-- Footer -->
		<div class="p-4">
			{#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
			<input type="hidden" name="checklist" value={checklistJson} />
			<input type="hidden" name="id" value={val('id')} />
			<input type="hidden" name="ownerId" value={ownerIdValue} />
			<input type="hidden" name="dueDate" value={dueDateValue} bind:this={dueDateInputEl} />
		</div>
	</form>
</Dialog>
