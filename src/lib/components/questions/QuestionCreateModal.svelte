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
	<form method="post" {action} use:enhance={onenhance} class="flex flex-col">
		<!-- Header -->
		<div class="flex items-start justify-between border-b border-border p-4">
			<h2 class="text-lg font-semibold">New question</h2>
			<Button type="button" variant="ghost" size="sm" onclick={onClose} class="shrink-0">
				{#snippet children()}<X class="h-5 w-5" />{/snippet}
			</Button>
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
			<Button type="button" variant="outline" onclick={onClose}>Cancel</Button>
			<Button type="submit">Add question</Button>
		</div>
	</form>
</Dialog>
