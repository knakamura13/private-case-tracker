<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
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
	<form method="post" {action} use:enhance={onenhance} class="flex flex-col">
				<input type="hidden" name="subTasks" value={subTasksJson} />
				<input type="hidden" name="location" value={currentLocation} />
				<!-- Header -->
				<div class="flex items-start justify-between border-b border-border p-4">
					<div class="flex flex-1 items-start">
						<Input
							name="title"
							bind:value={titleValue}
							class="flex-1 border-none bg-transparent p-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
							placeholder="Title"
							required
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
							<Button type="button" variant="outline" size="sm" onclick={() => showLocationInput = !showLocationInput}>
								{#snippet children()}<MapPin class="h-3.5 w-3.5" /> Location{/snippet}
							</Button>
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
												}}
											>
												{m.name ?? m.email}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>
						<div class="flex flex-wrap gap-2">
							<Button type="button" variant="outline" size="sm" onclick={() => showDueDatePicker = !showDueDatePicker}>
								{#snippet children()}<Calendar class="h-3.5 w-3.5" /> Due date{/snippet}
							</Button>
						</div>

						<!-- Location Input -->
						{#if showLocationInput}
							<div class="flex items-center gap-2">
								<Input
									bind:value={locationAddress}
									placeholder="Enter address..."
									class="flex-1"
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
							<div class="flex items-center gap-2 text-sm">
								<a
									href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentLocation)}`}
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary hover:underline"
								>
									{currentLocation}
								</a>
								<Button type="button" variant="ghost" size="sm" onclick={() => (currentLocation = '')}>
									{#snippet children()}<X class="h-3 w-3" />{/snippet}
								</Button>
							</div>
						{/if}

						<!-- Due Date Picker -->
						{#if showDueDatePicker}
							<div class="flex items-center gap-2">
								<Input type="date" bind:value={dueDateValue} class="flex-1" />
								<Button type="button" variant="default" size="sm" onclick={() => showDueDatePicker = false}>Done</Button>
							</div>
						{:else if dueDateValue}
							<div class="flex items-center gap-2 text-sm">
								<span>Due: {dueDateValue}</span>
								<Button type="button" variant="ghost" size="sm" onclick={() => (dueDateValue = '')}>
									{#snippet children()}<X class="h-3 w-3" />{/snippet}
								</Button>
							</div>
						{/if}

						<!-- Description -->
						<Textarea
							name="description"
							bind:value={descriptionValue}
							placeholder="Add description..."
							rows={4}
							class="resize-none"
						/>

						<!-- Checklist -->
						<div>
							<Button type="button" variant="outline" size="sm" onclick={() => showChecklistInput = !showChecklistInput}>
								{#snippet children()}<Plus class="h-3.5 w-3.5" /> Add checklist{/snippet}
							</Button>
							{#if showChecklistInput || editableSubTasks.length > 0}
								<div class="mt-2 space-y-2">
									{#each editableSubTasks as st (st.id)}
										<div class="flex items-center gap-2">
											<input
												type="checkbox"
												checked={st.done}
												onchange={() => toggleSubTask(st.id)}
												class="h-4 w-4 rounded border-border"
											/>
											<Input
												value={st.text}
												oninput={(e) => {
													editableSubTasks = editableSubTasks.map((s) =>
														s.id === st.id ? { ...s, text: e.currentTarget.value } : s
													);
												}}
												class="flex-1"
											/>
											<Button type="button" variant="ghost" size="sm" onclick={() => removeSubTask(st.id)}>
												{#snippet children()}<X class="h-4 w-4" />{/snippet}
											</Button>
										</div>
									{/each}
									<div class="flex items-center gap-2">
										<Input
											bind:value={newSubTaskText}
											placeholder="Add an item..."
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addSubTask();
												}
											}}
											class="flex-1"
										/>
										<Button type="button" variant="outline" size="sm" onclick={addSubTask}>
											{#snippet children()}<Plus class="h-4 w-4" /> Add{/snippet}
										</Button>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Right Column - Settings -->
					<div class="w-full space-y-4 md:w-64">
						<div>
							<label for="phase" class="mb-1 block text-sm font-medium">Phase</label>
							<Select id="phase" name="phase" bind:value={phaseValue}>
								{#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
							</Select>
						</div>
						<div>
							<label for="status" class="mb-1 block text-sm font-medium">Status</label>
							<Select id="status" name="status" bind:value={statusValue}>
								<option value="PLANNED">Planned</option>
								<option value="IN_PROGRESS">In progress</option>
								<option value="DONE">Done</option>
								<option value="BLOCKED">Blocked</option>
								<option value="SKIPPED">Skipped</option>
							</Select>
						</div>
						<div>
							<label for="priority" class="mb-1 block text-sm font-medium">Priority</label>
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
					<div class="px-4">
						<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
					</div>
				{/if}

				<!-- Footer -->
				<div class="flex justify-end gap-2 border-t border-border p-4">
					<Button type="button" variant="outline" onclick={onClose}>Cancel</Button>
					<Button type="submit">Create milestone</Button>
				</div>
			</form>
</Dialog>
