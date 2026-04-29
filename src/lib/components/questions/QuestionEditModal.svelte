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
	<form method="post" {action} use:enhance={onenhance} class="modal-form">
		<!-- Header -->
		<div class="modal-header">
			<h2 class="modal-title">Edit question</h2>
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
		<div class="modal-content">
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
					<Select id="priority" name="priority" bind:value={priorityValue}>
						<option value="LOW">Low</option>
						<option value="MEDIUM">Medium</option>
						<option value="HIGH">High</option>
						<option value="CRITICAL">Critical</option>
					</Select>
				</div>
				<div>
					<label for="status" class="modal-label">Status</label>
					<Select id="status" name="status" bind:value={statusValue}>
						<option value="OPEN">Open</option>
						<option value="RESEARCHING">Researching</option>
						<option value="ANSWERED">Answered</option>
						<option value="WONT_FIX">Won't pursue</option>
					</Select>
				</div>
				<div>
					<label for="sourceType" class="modal-label">Source type</label>
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
		</div>

		<!-- Error -->
		{#if error}
			<div class="modal-error">
				<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
			</div>
		{/if}

		<!-- Footer -->
		<div class="modal-footer">
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
