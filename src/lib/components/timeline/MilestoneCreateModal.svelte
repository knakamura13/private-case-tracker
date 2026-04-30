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
	import { X, Plus, Calendar, MapPin, User } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { open, onClose, action, members, defaultPhase, error, errorId, onenhance }: {
		open: boolean;
		onClose: () => void | Promise<void>;
		action: string;
		members: { id: string; name: string | null; email: string }[];
		defaultPhase?: string;
		error?: string;
		errorId?: string;
		onenhance?: SubmitFunction;
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
	let showChecklistInput = $state(false);
	let showOwnerDropdown = $state(false);
	let isEditingDescription = $state(false);

	// Input values
	let locationAddress = $state('');
	let dueDateValue = $state('');
	let currentLocation = $state('');

	// Form values
	let titleValue = $state('');
	let descriptionValue = $state('');
	let phaseValue = $state('PREPARATION');
	let statusValue = $state('PLANNED');
	let priorityValue = $state('MEDIUM');
	let ownerIdValue = $state('');

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			titleValue = '';
			descriptionValue = '';
			phaseValue = defaultPhase || 'PREPARATION';
			statusValue = 'PLANNED';
			priorityValue = 'MEDIUM';
			ownerIdValue = '';
			editableSubTasks = [];
			dueDateValue = '';
			currentLocation = '';
			locationAddress = '';
			newSubTaskText = '';
			showLocationInput = false;
			showDueDatePicker = false;
			showChecklistInput = false;
			showOwnerDropdown = false;
			isEditingDescription = false;
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

	function addSubTask() {
		if (!newSubTaskText.trim()) return;
		editableSubTasks = [...editableSubTasks, { id: crypto.randomUUID(), text: newSubTaskText.trim(), done: false }];
		newSubTaskText = '';
	}

	function removeSubTask(id: string) {
		editableSubTasks = editableSubTasks.filter((st) => st.id !== id);
	}

	function toggleSubTask(id: string) {
		editableSubTasks = editableSubTasks.map((st) => (st.id === id ? { ...st, done: !st.done } : st));
	}

	function handleLocationSave() {
		if (!locationAddress.trim()) return;
		currentLocation = locationAddress.trim();
		locationAddress = '';
		showLocationInput = false;
	}
</script>

<Dialog {open} {onClose}>
	<form method="post" {action} use:enhance={onenhance} class="modal-form">
		<input type="hidden" name="subTasks" value={subTasksJson} />
		<input type="hidden" name="location" value={currentLocation} />
		<!-- Header -->
		<div class="modal-header">
			<div class="modal-flex modal-flex-1 modal-items-start">
				<Input
					name="title"
					bind:value={titleValue}
					class="modal-title-input"
					placeholder="Title"
					required
				/>
			</div>
			<Button type="button" variant="ghost" size="sm" onclick={onClose} class="modal-shrink-0">
				{#snippet children()}<X class="modal-icon-md" />{/snippet}
			</Button>
		</div>

		<!-- Main Content -->
		<div class="modal-content-two-col">
			<!-- Left Column -->
			<div class="modal-content-left">
				<!-- Actions Bar -->
				<div class="modal-actions-bar">
					<Button type="button" variant="outline" size="sm" onclick={() => showLocationInput = !showLocationInput}>
						{#snippet children()}<MapPin class="modal-icon-3-5" /> Location{/snippet}
					</Button>
					<div class="modal-dropdown" use:clickOutside={() => showOwnerDropdown = false}>
						<Button type="button" variant="outline" size="sm" onclick={() => showOwnerDropdown = !showOwnerDropdown}>
							{#snippet children()}<User class="modal-icon-3-5" /> Owner{/snippet}
						</Button>
						{#if showOwnerDropdown}
							<div class="modal-dropdown-menu" style="left: 0; right: auto; width: 12rem;">
								<button
									type="button"
									class="modal-dropdown-item"
									onclick={() => {
										ownerIdValue = '';
										showOwnerDropdown = false;
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
						{#snippet children()}<Calendar class="modal-icon-3-5" /> Due date{/snippet}
					</Button>
				</div>

				<!-- Location Input -->
				{#if showLocationInput}
					<div class="modal-flex modal-items-center modal-gap-2">
						<Input
							bind:value={locationAddress}
							placeholder="Enter address..."
							class="modal-flex-1"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleLocationSave();
								}
							}}
						/>
						<Button type="button" variant="default" size="sm" onclick={handleLocationSave}>Save</Button>
					</div>
				{:else if currentLocation}
					<div class="modal-flex modal-items-center modal-gap-2 modal-text-sm">
						<a
							href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentLocation)}`}
							target="_blank"
							rel="noopener noreferrer"
							class="modal-link"
						>
							{currentLocation}
						</a>
						<Button type="button" variant="ghost" size="sm" onclick={() => (currentLocation = '')}>
							{#snippet children()}<X class="modal-icon-xs" />{/snippet}
						</Button>
					</div>
				{/if}

				<!-- Due Date Picker -->
				{#if showDueDatePicker}
					<div class="modal-flex modal-items-center modal-gap-2">
						<Input type="date" bind:value={dueDateValue} class="modal-flex-1" />
						<Button type="button" variant="default" size="sm" onclick={() => showDueDatePicker = false}>Done</Button>
					</div>
				{:else if dueDateValue}
					<div class="modal-flex modal-items-center modal-gap-2 modal-text-sm">
						<span>Due: {dueDateValue}</span>
						<Button type="button" variant="ghost" size="sm" onclick={() => (dueDateValue = '')}>
							{#snippet children()}<X class="modal-icon-xs" />{/snippet}
						</Button>
					</div>
				{/if}

				<!-- Description -->
				<div>
					<div class="modal-label">Description</div>
					<!-- Hidden input ensures description is always submitted even when textarea is unmounted -->
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
				<div>
					<Button type="button" variant="outline" size="sm" onclick={() => showChecklistInput = !showChecklistInput}>
						{#snippet children()}<Plus class="modal-icon-3-5" /> Add checklist{/snippet}
					</Button>
					{#if showChecklistInput || editableSubTasks.length > 0}
						<div class="modal-simple-checklist">
							{#each editableSubTasks as st (st.id)}
								<div class="modal-simple-checklist-item">
									<input
										type="checkbox"
										checked={st.done}
										onchange={() => toggleSubTask(st.id)}
										class="modal-simple-checklist-checkbox"
									/>
									<Input
										value={st.text}
										oninput={(e) => {
											editableSubTasks = editableSubTasks.map((s) =>
												s.id === st.id ? { ...s, text: e.currentTarget.value } : s
											);
										}}
										class="modal-flex-1"
									/>
									<Button type="button" variant="ghost" size="sm" onclick={() => removeSubTask(st.id)}>
										{#snippet children()}<X class="modal-icon-sm" />{/snippet}
									</Button>
								</div>
							{/each}
							<div class="modal-simple-checklist-add">
								<Input
									bind:value={newSubTaskText}
									placeholder="Add an item..."
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addSubTask();
										}
									}}
									class="modal-flex-1"
								/>
								<Button type="button" variant="outline" size="sm" onclick={addSubTask}>
									{#snippet children()}<Plus class="modal-icon-sm" /> Add{/snippet}
								</Button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Column - Settings -->
			<div class="modal-content-right">
				<div>
					<label for="phase" class="modal-label">Phase</label>
					<Select id="phase" name="phase" bind:value={phaseValue}>
						<!-- eslint-disable-next-line security/detect-object-injection -->
						{#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
					</Select>
				</div>
				<div>
					<label for="status" class="modal-label">Status</label>
					<Select id="status" name="status" bind:value={statusValue}>
						<option value="PLANNED">Planned</option>
						<option value="IN_PROGRESS">In progress</option>
						<option value="DONE">Done</option>
						<option value="BLOCKED">Blocked</option>
						<option value="SKIPPED">Skipped</option>
					</Select>
				</div>
				<div>
					<label for="priority" class="modal-label">Priority</label>
					<Select id="priority" name="priority" bind:value={priorityValue}>
						<option value="LOW">Low</option>
						<option value="MEDIUM">Medium</option>
						<option value="HIGH">High</option>
						<option value="CRITICAL">Critical</option>
					</Select>
				</div>
			</div>
		</div>

		<!-- Hidden fields -->
		<input type="hidden" name="dueDate" value={dueDateValue} />
		<input type="hidden" name="ownerId" value={ownerIdValue} />

		<!-- Error -->
		{#if error}
			<div class="modal-error">
				<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
			</div>
		{/if}

		<!-- Footer -->
		<div class="modal-footer">
			<Button type="button" variant="outline" onclick={onClose}>Cancel</Button>
			<Button type="submit">Create milestone</Button>
		</div>
	</form>
</Dialog>
