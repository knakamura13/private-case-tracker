<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		initial = {},
		submitLabel = 'Save',
		error
	}: { initial?: Record<string, unknown>; submitLabel?: string; error?: string | null } = $props();

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		if (v instanceof Date) {
			// YYYY-MM-DDTHH:mm for datetime-local
			const pad = (n: number) => n.toString().padStart(2, '0');
			return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}T${pad(v.getHours())}:${pad(v.getMinutes())}`;
		}
		if (Array.isArray(v)) return v.join(', ');
		return String(v);
	}
</script>

<form method="post" class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="md:col-span-2">
		<Label for="title">Title</Label>
		<Input id="title" name="title" required value={val('title')} />
	</div>
	<div>
		<Label for="type">Type</Label>
		<Select id="type" name="type" value={val('type', 'OTHER')}>
			<option value="CIVIL_MARRIAGE">Civil marriage</option>
			<option value="BIOMETRICS">Biometrics</option>
			<option value="ATTORNEY_CONSULT">Attorney consult</option>
			<option value="MEDICAL_EXAM">Medical exam</option>
			<option value="INTERVIEW">Interview</option>
			<option value="TRANSLATION_OR_NOTARY">Translation / notary</option>
			<option value="DOCUMENT_PICKUP">Document pickup</option>
			<option value="OTHER">Other</option>
		</Select>
	</div>
	<div>
		<Label for="status">Status</Label>
		<Select id="status" name="status" value={val('status', 'SCHEDULED')}>
			<option value="SCHEDULED">Scheduled</option>
			<option value="CONFIRMED">Confirmed</option>
			<option value="COMPLETED">Completed</option>
			<option value="CANCELED">Canceled</option>
			<option value="RESCHEDULED">Rescheduled</option>
			<option value="MISSED">Missed</option>
		</Select>
	</div>
	<div>
		<Label for="scheduledAt">When</Label>
		<Input id="scheduledAt" name="scheduledAt" type="datetime-local" required value={val('scheduledAt')} />
	</div>
	<div>
		<Label for="durationMin">Duration (minutes)</Label>
		<Input id="durationMin" name="durationMin" type="number" min="1" value={val('durationMin')} />
	</div>
	<div class="md:col-span-2">
		<Label for="location">Location</Label>
		<Input id="location" name="location" value={val('location')} />
	</div>
	<div class="md:col-span-2">
		<Label for="confirmationDetails">Confirmation / reference</Label>
		<Input id="confirmationDetails" name="confirmationDetails" value={val('confirmationDetails')} />
	</div>
	<div class="md:col-span-2">
		<Label for="attendees">Attendees (comma-separated)</Label>
		<Input id="attendees" name="attendees" value={val('attendees')} />
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
