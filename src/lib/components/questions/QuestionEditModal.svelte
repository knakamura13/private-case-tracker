<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { showSuccessToast, showErrorToast } from '$lib/stores/toast';
	import { X, MoreHorizontal, HelpCircle, Plus, FileText, Paperclip, Link, CheckSquare } from 'lucide-svelte';
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

	// Status pill mapping
	const statusPillClass = $derived(() => {
		switch (statusValue) {
			case 'OPEN': return 's-active';
			case 'RESEARCHING': return 's-note';
			case 'ANSWERED': return 's-done';
			case 'WONT_FIX': return 's-waiting';
			default: return '';
		}
	});

	const statusLabel = $derived(() => {
		switch (statusValue) {
			case 'OPEN': return 'Open';
			case 'RESEARCHING': return 'Researching';
			case 'ANSWERED': return 'Answered';
			case 'WONT_FIX': return "Won't pursue";
			default: return statusValue;
		}
	});

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
			<div class="modal-header-left">
				<span class="pill {statusPillClass()}">{statusLabel()}</span>
			</div>
			<div class="modal-header-right">
				{#if deleteAction}
					<div class="modal-dropdown" use:clickOutside={() => showMenuDropdown = false}>
						<Button type="button" variant="ghost" size="sm" onclick={() => showMenuDropdown = !showMenuDropdown} class="modal-icon-btn">
							<MoreHorizontal class="modal-icon-sm" />
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
				<Button type="button" variant="ghost" size="sm" onclick={onClose} class="modal-icon-btn">
					<X class="modal-icon-sm" />
				</Button>
			</div>
		</div>

		<!-- Title Row -->
		<div class="modal-title-row">
			<HelpCircle class="modal-icon-sm" />
			<Input
				name="question"
				bind:value={questionValue}
				class="modal-title-input display"
				placeholder="Question"
				required
			/>
		</div>

		<!-- Action Chips -->
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
				<Paperclip class="modal-icon-xs" /> Attachment
			</Button>
			<Button type="button" variant="ghost" size="sm" class="modal-action-chip">
				<Link class="modal-icon-xs" /> Link
			</Button>
		</div>

		<!-- Metadata Grid -->
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
					<select name="priority" bind:value={priorityValue} class="modal-select-sm">
						<option value="LOW">Low</option>
						<option value="MEDIUM">Medium</option>
						<option value="HIGH">High</option>
						<option value="CRITICAL">Critical</option>
					</select>
				</div>
			</div>
			<div class="modal-metadata-item">
				<span class="modal-metadata-label">Status</span>
				<div class="modal-metadata-value">
					<select name="status" bind:value={statusValue} class="modal-select-sm">
						<option value="OPEN">Open</option>
						<option value="RESEARCHING">Researching</option>
						<option value="ANSWERED">Answered</option>
						<option value="WONT_FIX">Won't pursue</option>
					</select>
				</div>
			</div>
			<div class="modal-metadata-item">
				<span class="modal-metadata-label">Source type</span>
				<div class="modal-metadata-value">
					<select name="sourceType" bind:value={sourceTypeValue} class="modal-select-sm">
						<option value="ATTORNEY">Attorney</option>
						<option value="NONPROFIT">Nonprofit</option>
						<option value="USCIS_SITE">USCIS site</option>
						<option value="COUNTY_SITE">County site</option>
						<option value="COMMUNITY">Community</option>
						<option value="OTHER">Other</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Citation URL -->
		<div class="modal-mt-2">
			<span class="modal-metadata-label">Citation URL</span>
			<div class="modal-metadata-value">
				<Input name="citationUrl" type="url" bind:value={citationUrlValue} placeholder="https://..." />
			</div>
		</div>

		<!-- Answer -->
		<div class="modal-description-section">
			<span class="modal-metadata-label">Answer</span>
			<Textarea name="answer" bind:value={answerValue} placeholder="Enter answer..." rows={5} class="modal-description-textarea" />
		</div>

		<!-- Answered Date -->
		<div class="modal-mt-2">
			<span class="modal-metadata-label">Answered on</span>
			<div class="modal-metadata-value">
				<Input name="answeredAt" type="date" bind:value={answeredAtValue} class="modal-text-sm" />
			</div>
		</div>

		<!-- Error -->
		{#if error}
			<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />
		{/if}

		<!-- Footer -->
		<div class="modal-footer">
			<input type="hidden" name="id" value={val('id')} />
			{#if deleteAction}
				<Button type="button" variant="ghost" class="modal-footer-delete" onclick={async () => {
					if (confirm('Are you sure you want to delete this question?')) {
						const formData = new FormData();
						formData.append('id', val('id'));
						const response = await fetch(deleteAction, { method: 'POST', body: formData });
						if (response.ok) {
							showSuccessToast('Question deleted');
							await invalidateAll();
							onClose();
						}
					}
				}}>
					Delete
				</Button>
			{/if}
			<Button type="button" variant="ghost" onclick={onClose}>Cancel</Button>
			<Button type="submit" class="modal-footer-save">Save changes</Button>
		</div>
	</form>
</Dialog>
