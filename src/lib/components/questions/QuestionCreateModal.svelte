<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { X } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { open, onClose, action, members: _members, error, errorId, onenhance }: {
		open: boolean;
		onClose: () => void | Promise<void>;
		action: string;
		members?: { id: string; name: string | null; email: string }[];
		error?: string;
		errorId?: string;
		onenhance?: SubmitFunction;
	} = $props();

	// Form values
	let questionValue = $state('');
	let categoryValue = $state('');
	let priorityValue = $state('MEDIUM');
	let statusValue = $state('OPEN');
	let sourceTypeValue = $state('OTHER');
	let citationUrlValue = $state('');
	let answerValue = $state('');
	let answeredAtValue = $state('');

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			questionValue = '';
			categoryValue = '';
			priorityValue = 'MEDIUM';
			statusValue = 'OPEN';
			sourceTypeValue = 'OTHER';
			citationUrlValue = '';
			answerValue = '';
			answeredAtValue = '';
		}
	});
</script>

<Dialog {open} {onClose}>
	<form method="post" {action} use:enhance={onenhance} class="modal-form">
		<!-- Header -->
		<div class="modal-header">
			<h2 class="modal-title">New question</h2>
			<Button type="button" variant="ghost" size="sm" onclick={onClose} class="modal-shrink-0">
				{#snippet children()}<X class="modal-icon-md" />{/snippet}
			</Button>
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
			<Button type="button" variant="outline" onclick={onClose}>Cancel</Button>
			<Button type="submit">Add question</Button>
		</div>
	</form>
</Dialog>
