<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
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
	let isSaving = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let pendingSavePromise: Promise<void> | null = null;

	// Reactive form values
	let titleValue = $state('');
	let descriptionValue = $state('');
	let statusValue = $state('TODO');
	let priorityValue = $state('MEDIUM');
	let ownerIdValue = $state('');

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
		} else {
			// Reset state when modal closes
			showDueDatePicker = false;
			showChecklistInput = false;
			showOwnerDropdown = false;
			showMenuDropdown = false;
			openChecklistMenuId = null;
			editingChecklistId = null;
			editingChecklistText = '';
			isSaving = false;
			if (saveTimeout) clearTimeout(saveTimeout);
			pendingSavePromise = null;
			// Cancel any in-flight save to prevent state updates after unmount
			if (pendingSavePromise) {
				// The promise will resolve but isSaving is already false
			}
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

	async function triggerAutoSave(immediate = false) {
		if (isSaving) return;
		if (saveTimeout) clearTimeout(saveTimeout);
		if (!open || !action) return;
		const delay = immediate ? 0 : 2000;
		saveTimeout = setTimeout(async () => {
			if (onenhance) {
				isSaving = true;
				const formData = new FormData();
				formData.append('id', val('id'));
				formData.append('title', titleValue);
				formData.append('description', descriptionValue);
				formData.append('status', statusValue);
				formData.append('priority', priorityValue);
				formData.append('ownerId', ownerIdValue);
				formData.append('dueDate', dueDateValue);
				formData.append('checklist', checklistJson);

				const cancel = () => {
					isSaving = false;
				};

				pendingSavePromise = (async () => {
					try {
						const result = onenhance({ formData, cancel });
						if (result && typeof result === 'function') {
							await result();
						}
					} catch {
						showErrorToast('Failed to auto-save task');
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
	<form method="post" {action} class="flex flex-col">
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
			<div class="flex items-center gap-1">
				{#if deleteAction}
					<div class="relative" use:clickOutside={() => showMenuDropdown = false}>
						<Button type="button" variant="ghost" size="sm" onclick={() => showMenuDropdown = !showMenuDropdown} class="shrink-0">
							{#snippet children()}<MoreHorizontal class="h-5 w-5" />{/snippet}
						</Button>
						{#if showMenuDropdown}
							<div class="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-border bg-card p-1 shadow-md">
								<button
									type="button"
									class="w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
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
				<Button type="button" variant="ghost" size="sm" onclick={onClose} class="shrink-0">
					{#snippet children()}<X class="h-5 w-5" />{/snippet}
				</Button>
			</div>
		</div>

		<!-- Main Content -->
		<div class="flex flex-col gap-4 p-4 md:flex-row">
			<!-- Left Column -->
			<div class="flex-1 space-y-4">
				<!-- Actions Bar -->
				<div class="flex flex-wrap gap-2">
					<div class="relative" use:clickOutside={() => showOwnerDropdown = false}>
						<Button type="button" variant="outline" size="sm" onclick={() => showOwnerDropdown = !showOwnerDropdown}>
							{#snippet children()}<User class="h-3.5 w-3.5" /> Owner{/snippet}
						</Button>
						{#if showOwnerDropdown}
							<div class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-card p-1 shadow-md">
								<button
									type="button"
									class="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
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
										class="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
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
						<Button type="button" variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => {
							showDueDatePicker = true;
						}}>
							{#snippet children()}<MoreHorizontal class="h-4 w-4" />{/snippet}
						</Button>
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
					/>
				</div>

				<!-- Checklist -->
				<Card class="p-3">
					<div class="mb-2 flex items-center gap-2">
						<CheckSquare class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm font-medium">Checklist</span>
					</div>
					{#if editableChecklist.length > 0}
						<div class="mb-3 flex items-center gap-2">
							<span class="text-sm text-muted-foreground">{checklistProgress()}%</span>
							<div class="h-1.5 flex-1 rounded-full bg-muted">
								<div class="h-1.5 rounded-full bg-primary transition-all duration-300 ease-out" style="width: {checklistProgress()}%"></div>
							</div>
						</div>
					{/if}
					{#if editableChecklist.length > 0}
						<div class="mb-3 space-y-2">
							{#each editableChecklist as ci (ci.id)}
								<div class="flex items-start gap-2">
									<input
										type="checkbox"
										checked={ci.done}
										onchange={() => toggleChecklistItem(ci.id)}
										class="mt-0.5 h-4 w-4 rounded border-border"
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
											class="flex-1 h-7 text-sm"
										/>
									{:else}
										<span class={ci.done ? 'line-through text-muted-foreground' : 'text-sm'}>{ci.text}</span>
									{/if}
									<div class="relative ml-auto">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="h-6 w-6 p-0"
											onclick={() => openChecklistMenuId = openChecklistMenuId === ci.id ? null : ci.id}
										>
											{#snippet children()}<MoreHorizontal class="h-4 w-4" />{/snippet}
										</Button>
										{#if openChecklistMenuId === ci.id}
											<div class="absolute right-0 top-full z-10 mt-1 w-24 rounded-md border border-border bg-card p-1 shadow-md" use:clickOutside={() => openChecklistMenuId = null}>
												<button
													type="button"
													class="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
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
													class="w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
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
								class="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
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
			<div class="w-full space-y-4 md:w-64">
				<Card class="p-3 space-y-3">
					<div>
						<label for="status" class="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
						<Select id="status" name="status" bind:value={statusValue} onchange={() => triggerAutoSave()} class="text-sm">
							<option value="TODO">To Do</option>
							<option value="IN_PROGRESS">In Progress</option>
							<option value="DONE">Done</option>
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
