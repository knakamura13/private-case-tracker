<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { showSuccessToast, showErrorToast } from '$lib/stores/toast';
	import { X, MoreHorizontal } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { open, onClose, action, deleteAction, onenhance, initial, error, errorId }: {
		open: boolean;
		onClose: () => void | Promise<void>;
		action: string;
		deleteAction?: string;
		onenhance?: (params: { formData: FormData; cancel: () => void }) => void | (() => Promise<void>);
		initial: Record<string, unknown>;
		error?: string;
		errorId?: string;
	} = $props();

	// Button visibility states
	let showMenuDropdown = $state(false);

	// Form values
	let questionValue = $state('');
	let categoryValue = $state('');
	let priorityValue = $state('MEDIUM');
	let statusValue = $state('OPEN');
	let sourceTypeValue = $state('OTHER');
	let citationUrlValue = $state('');
	let answerValue = $state('');
	let answeredAtValue = $state('');

	const ALLOWED_FIELDS = [
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

	// Initialize reactive values from initial props when modal opens
	$effect(() => {
		if (open) {
			questionValue = val('question');
			categoryValue = val('category');
			priorityValue = val('priority', 'MEDIUM');
			statusValue = val('status', 'OPEN');
			sourceTypeValue = val('sourceType', 'OTHER');
			citationUrlValue = val('citationUrl');
			answerValue = val('answer');
			answeredAtValue = val('answeredAt');
		} else {
			// Reset state when modal closes
			showMenuDropdown = false;
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
		<!-- Header -->
		<div class="flex items-start justify-between border-b border-border p-4">
			<h2 class="text-lg font-semibold">Edit question</h2>
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
										if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
											const formData = new FormData();
											formData.append('id', val('id'));
											const response = await fetch(deleteAction, { method: 'POST', body: formData });
											if (response.ok) {
												showSuccessToast('Question deleted successfully');
												await invalidateAll();
												onClose();
											} else {
												showErrorToast('Failed to delete question');
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
		<div class="flex flex-col gap-4 p-4">
			<div>
				<label for="question" class="mb-1 block text-sm font-medium">Question</label>
				<Textarea id="question" name="question" bind:value={questionValue} required rows={3} />
			</div>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="category" class="mb-1 block text-sm font-medium">Category</label>
					<Input id="category" name="category" bind:value={categoryValue} />
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
				<div>
					<label for="status" class="mb-1 block text-sm font-medium">Status</label>
					<Select id="status" name="status" bind:value={statusValue}>
						<option value="OPEN">Open</option>
						<option value="RESEARCHING">Researching</option>
						<option value="ANSWERED">Answered</option>
						<option value="WONT_FIX">Won't pursue</option>
					</Select>
				</div>
				<div>
					<label for="sourceType" class="mb-1 block text-sm font-medium">Source type</label>
					<Select id="sourceType" name="sourceType" bind:value={sourceTypeValue}>
						<option value="ATTORNEY">Attorney</option>
						<option value="NONPROFIT">Nonprofit</option>
						<option value="USCIS_SITE">USCIS site</option>
						<option value="COUNTY_SITE">County site</option>
						<option value="COMMUNITY">Community</option>
						<option value="OTHER">Other</option>
					</Select>
				</div>
			</div>
			<div>
				<label for="citationUrl" class="mb-1 block text-sm font-medium">Citation URL</label>
				<Input id="citationUrl" name="citationUrl" type="url" bind:value={citationUrlValue} />
			</div>
			<div>
				<label for="answer" class="mb-1 block text-sm font-medium">Answer</label>
				<Textarea id="answer" name="answer" bind:value={answerValue} rows={5} />
			</div>
			<div>
				<label for="answeredAt" class="mb-1 block text-sm font-medium">Answered on</label>
				<Input id="answeredAt" name="answeredAt" type="date" bind:value={answeredAtValue} />
			</div>
		</div>

		<!-- Error -->
		{#if error}
			<div class="px-4">
				<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
			</div>
		{/if}

		<!-- Footer -->
		<div class="flex justify-end gap-2 border-t border-border p-4">
			<input type="hidden" name="id" value={val('id')} />
			<input type="hidden" name="question" value={questionValue} />
			<input type="hidden" name="category" value={categoryValue} />
			<input type="hidden" name="priority" value={priorityValue} />
			<input type="hidden" name="status" value={statusValue} />
			<input type="hidden" name="sourceType" value={sourceTypeValue} />
			<input type="hidden" name="citationUrl" value={citationUrlValue} />
			<input type="hidden" name="answer" value={answerValue} />
			<input type="hidden" name="answeredAt" value={answeredAtValue} />
			<Button type="button" variant="outline" onclick={onClose}>Cancel</Button>
			<Button type="submit">Save changes</Button>
		</div>
	</form>
</Dialog>
