<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		initial = {},
		submitLabel = 'Save',
		error,
		action,
		onenhance
	}: {
		initial?: Record<string, unknown>;
		submitLabel?: string;
		error?: string | null;
		action?: string;
		onenhance?: SubmitFunction;
	} = $props();

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		if (v instanceof Date) return v.toISOString().slice(0, 10);
		return String(v);
	}
</script>

<form method="post" {action} use:enhance={onenhance} class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div>
		<Label for="code">Code</Label>
		<Input id="code" name="code" required value={val('code')} placeholder="e.g. I-130" />
	</div>
	<div>
		<Label for="name">Name</Label>
		<Input id="name" name="name" required value={val('name')} />
	</div>
	<div class="md:col-span-2">
		<Label for="purpose">Purpose</Label>
		<Input id="purpose" name="purpose" value={val('purpose')} />
	</div>
	<div>
		<Label for="filingStatus">Filing status</Label>
		<Select id="filingStatus" name="filingStatus" value={val('filingStatus', 'NOT_STARTED')}>
			<option value="NOT_STARTED">Not started</option>
			<option value="IN_PROGRESS">In progress</option>
			<option value="READY_FOR_REVIEW">Ready for review</option>
			<option value="FILED">Filed</option>
			<option value="RECEIVED">Received</option>
			<option value="REPLACED">Replaced</option>
			<option value="NOT_NEEDED">Not needed</option>
		</Select>
	</div>
	<div>
		<Label for="plannedFilingDate">Planned filing date</Label>
		<Input id="plannedFilingDate" name="plannedFilingDate" type="date" value={val('plannedFilingDate')} />
	</div>
	<div>
		<Label for="actualFilingDate">Actual filing date</Label>
		<Input id="actualFilingDate" name="actualFilingDate" type="date" value={val('actualFilingDate')} />
	</div>
	<div>
		<Label for="receiptNumber">Receipt number (stored encrypted, displayed masked)</Label>
		<Input id="receiptNumber" name="receiptNumber" placeholder="IOE••••1234" value={val('receiptNumber')} />
	</div>
	<div class="md:col-span-2">
		<Label for="notes">Notes</Label>
		<Textarea id="notes" name="notes" value={val('notes')} />
	</div>
	{#if error}<p class="md:col-span-2 text-sm text-destructive">{error}</p>{/if}
	<div class="md:col-span-2 flex gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
	</div>
</form>
