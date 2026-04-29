<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import RichText from '$lib/components/ui/RichText.svelte';
	import { PHASE_LABELS, PHASE_ORDER } from '$lib/constants/phases';
	import { showSuccessToast, showErrorToast } from '$lib/stores/toast';
	import { X, Plus, Calendar, MapPin, CheckSquare, User, MoreHorizontal } from 'lucide-svelte';

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
	let showOwnerDropdown = $state(false);
	let showMenuDropdown = $state(false);
	let isEditingDescription = $state(false);
	let openSubTaskMenuId = $state<string | null>(null);
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

	const ALLOWED_FIELDS = ['id', 'title', 'description', 'phase', 'status', 'priority', 'ownerId', 'dueDate', 'scheduledAt', 'subTasks', 'owner', 'location'] as const;

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

	function ownerInitial(owner: unknown) {
		const o = owner as { name?: string; email?: string };
		return o?.name?.[0] || o?.email?.[0] || 'U';
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
			<div class="flex flex-1 items-start">
				<Input
					name="title"
					bind:value={titleValue}
					oninput={() => triggerAutoSave()}
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
				<Button type="button" variant="ghost" size="sm" onclick={onClose} class="shrink-0">
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
					<Button type="button" variant="outline" size="sm" onclick={() => showLocationInput = !showLocationInput}>
						{#snippet children()}<MapPin class="h-3.5 w-3.5" /> Location{/snippet}
					</Button>
					<div class="modal-dropdown" use:clickOutside={() => showOwnerDropdown = false}>
						<Button type="button" variant="outline" size="sm" onclick={() => showOwnerDropdown = !showOwnerDropdown}>
							{#snippet children()}<User class="h-3.5 w-3.5" /> Owner{/snippet}
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
				</div>
				<div class="modal-actions-bar">
					<Button type="button" variant="outline" size="sm" onclick={() => showDueDatePicker = !showDueDatePicker}>
						{#snippet children()}<Calendar class="h-3.5 w-3.5" /> Due date{/snippet}
					</Button>
					<Button type="button" variant="outline" size="sm" onclick={() => showAppointmentDatePicker = !showAppointmentDatePicker}>
						{#snippet children()}<Calendar class="h-3.5 w-3.5" /> Appointment date{/snippet}
					</Button>
				</div>

				<!-- Location Input -->
				{#if showLocationInput || isEditingLocation}
					<div class="mt-2 flex gap-2">
						<Input
							bind:value={locationAddress}
							placeholder="Enter business name, address, or coordinates..."
							class="flex-1 text-sm"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleLocationSave();
								}
							}}
						/>
						<Button type="button" size="sm" onclick={handleLocationSave}>Save</Button>
						<Button type="button" variant="ghost" size="sm" onclick={() => {
							showLocationInput = false;
							isEditingLocation = false;
							locationAddress = '';
						}}>Cancel</Button>
					</div>
				{:else if currentLocation}
					<div class="mt-2 flex items-center gap-2">
						<a
							href={generateGoogleMapsUrl(currentLocation)}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-1 text-sm modal-link"
						>
							<MapPin class="h-3.5 w-3.5" />
							<span class="line-clamp-1">{currentLocation}</span>
						</a>
						<Button type="button" variant="ghost" size="sm" class="modal-icon-btn-sm" onclick={() => {
							locationAddress = currentLocation;
							isEditingLocation = true;
						}}>
							{#snippet children()}<MoreHorizontal class="h-4 w-4" />{/snippet}
						</Button>
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

				<!-- Appointment Date Picker -->
				{#if showAppointmentDatePicker}
					<div class="mt-2 flex gap-2">
						<Input
							bind:value={appointmentDateValue}
							type="date"
							class="text-sm"
						/>
						<Button type="button" size="sm" onclick={handleAppointmentDateSave}>Save</Button>
						<Button type="button" variant="ghost" size="sm" onclick={() => showAppointmentDatePicker = false}>Cancel</Button>
					</div>
				{/if}

				<!-- Members -->
				<div class="flex items-center gap-2">
					{#if initial.owner}
						<div class="modal-avatar">
							{ownerInitial(initial.owner)}
						</div>
					{/if}
				</div>

				<!-- Description -->
				<div>
					<div class="modal-label">Description</div>
					<!-- Hidden input ensures description is always submitted even when textarea is unmounted -->
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
							placeholder="Add a more detailed description... URLs and phone numbers will be clickable."
							rows={3}
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
						<span class="text-sm font-medium">Sub-tasks</span>
					</div>
					{#if editableSubTasks.length > 0}
						<div class="modal-checklist-progress">
							<span>{checklistProgress()}%</span>
							<div class="modal-checklist-progress-bar">
								<div class="modal-checklist-progress-fill" style="width: {checklistProgress()}%"></div>
							</div>
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
									<div class="relative ml-auto">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="modal-icon-btn-sm"
											onclick={() => openSubTaskMenuId = openSubTaskMenuId === st.id ? null : st.id}
										>
											{#snippet children()}<MoreHorizontal class="h-4 w-4" />{/snippet}
										</Button>
										{#if openSubTaskMenuId === st.id}
											<div class="modal-dropdown-menu" style="width: 6rem;" use:clickOutside={() => openSubTaskMenuId = null}>
												<button
													type="button"
													class="modal-dropdown-item"
													onclick={() => {
														editingSubTaskId = st.id;
														editingSubTaskText = st.text;
														openSubTaskMenuId = null;
													}}
												>
													Edit
												</button>
												<button
													type="button"
													class="modal-dropdown-button"
													onclick={() => {
														_removeSubTask(st.id);
														openSubTaskMenuId = null;
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
								bind:value={newSubTaskText}
								bind:this={newSubTaskInputEl}
								placeholder="Enter item..."
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addSubTask();
									}
								}}
								class="modal-checklist-add-input"
							/>
							<div class="flex justify-start gap-2">
								<Button type="button" size="sm" onclick={() => {
									addSubTask();
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
			<div class="modal-content-right">
				<Card class="modal-settings-card">
					<div>
						<label for="phase" class="modal-settings-label">Phase</label>
						<Select id="phase" name="phase" bind:value={phaseValue} onchange={() => triggerAutoSave()} class="text-sm">
							<!-- eslint-disable-next-line security/detect-object-injection -->
							{#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
						</Select>
					</div>
					<div>
						<label for="status" class="modal-settings-label">Status</label>
						<Select id="status" name="status" bind:value={statusValue} onchange={() => triggerAutoSave()} class="text-sm">
							<option value="PLANNED">Planned</option>
							<option value="IN_PROGRESS">In progress</option>
							<option value="DONE">Done</option>
							<option value="BLOCKED">Blocked</option>
							<option value="SKIPPED">Skipped</option>
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
			<input type="hidden" name="subTasks" value={subTasksJson} />
			<input type="hidden" name="id" value={val('id')} />
			<input type="hidden" name="ownerId" value={ownerIdValue} />
			<input type="hidden" name="dueDate" value={dueDateValue} bind:this={dueDateInputEl} />
			<input type="hidden" name="scheduledAt" value={appointmentDateValue} bind:this={scheduledAtInputEl} />
			<input type="hidden" name="location" value={val('location', '')} />
		</div>
	</form>
</Dialog>
