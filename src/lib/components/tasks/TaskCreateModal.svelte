<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import RichText from '$lib/components/ui/RichText.svelte';
	import { X, Calendar, User } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { open, onClose, action, members, defaultStatus, error, errorId, onenhance }: {
		open: boolean;
		onClose: () => void | Promise<void>;
		action: string;
		members: { id: string; name: string | null; email: string }[];
		defaultStatus?: string;
		error?: string;
		errorId?: string;
		onenhance?: SubmitFunction;
	} = $props();

	// Button visibility states
	let showDueDatePicker = $state(false);
	let showOwnerDropdown = $state(false);
	let isEditingDescription = $state(false);

	// Input values
	let dueDateValue = $state('');

	// Form values
	let titleValue = $state('');
	let descriptionValue = $state('');
	let statusValue = $state('TODO');
	let priorityValue = $state('MEDIUM');
	let ownerIdValue = $state('');

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			titleValue = '';
			descriptionValue = '';
			statusValue = defaultStatus || 'TODO';
			priorityValue = 'MEDIUM';
			ownerIdValue = '';
			dueDateValue = '';
			showDueDatePicker = false;
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

</script>

<Dialog {open} {onClose}>
	<form method="post" {action} use:enhance={onenhance} class="flex flex-col">
		<input type="hidden" name="checklist" value="[]" />
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
					<Button type="button" variant="outline" size="sm" onclick={() => showDueDatePicker = !showDueDatePicker}>
						{#snippet children()}<Calendar class="h-3.5 w-3.5" /> Due date{/snippet}
					</Button>
				</div>

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
				<div>
					<div class="mb-2 text-sm font-medium">Description</div>
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
							rows={6}
							class="min-h-[120px]"
						/>
					{:else}
						<Card class="p-3 bg-muted/50 min-h-[120px]">
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
									class="text-sm text-muted-foreground italic cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
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
			</div>

			<!-- Right Column - Settings -->
			<div class="w-full space-y-4 md:w-64">
				<div>
					<label for="status" class="mb-1 block text-sm font-medium">Status</label>
					<Select id="status" name="status" bind:value={statusValue}>
						<option value="TODO">To Do</option>
						<option value="IN_PROGRESS">In Progress</option>
						<option value="DONE">Done</option>
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
			<Button type="submit">Create task</Button>
		</div>
	</form>
</Dialog>
