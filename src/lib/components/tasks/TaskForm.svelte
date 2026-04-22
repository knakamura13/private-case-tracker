<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Option {
		id: string;
		label: string;
	}

	let {
		initial = {},
		forms,
		evidence,
		appointments,
		milestones,
		members,
		submitLabel = 'Save',
		error
	}: {
		initial?: Record<string, unknown>;
		forms: Option[];
		evidence: Option[];
		appointments: Option[];
		milestones: Option[];
		members: { id: string; name: string | null; email: string }[];
		submitLabel?: string;
		error?: string | null;
	} = $props();

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		if (v instanceof Date) return v.toISOString().slice(0, 10);
		return String(v);
	}
</script>

<form method="post" class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="md:col-span-2">
		<Label for="title">Title</Label>
		<Input id="title" name="title" required value={val('title')} />
	</div>
	<div class="md:col-span-2">
		<Label for="description">Description</Label>
		<Textarea id="description" name="description" value={val('description')} />
	</div>
	<div>
		<Label for="dueDate">Due date</Label>
		<Input id="dueDate" name="dueDate" type="date" value={val('dueDate')} />
	</div>
	<div>
		<Label for="priority">Priority</Label>
		<Select id="priority" name="priority" value={val('priority', 'MEDIUM')}>
			<option value="LOW">Low</option>
			<option value="MEDIUM">Medium</option>
			<option value="HIGH">High</option>
			<option value="CRITICAL">Critical</option>
		</Select>
	</div>
	<div>
		<Label for="status">Status</Label>
		<Select id="status" name="status" value={val('status', 'TODO')}>
			<option value="TODO">To do</option>
			<option value="IN_PROGRESS">In progress</option>
			<option value="BLOCKED">Blocked</option>
			<option value="DONE">Done</option>
			<option value="ARCHIVED">Archived</option>
		</Select>
	</div>
	<div>
		<Label for="ownerId">Owner</Label>
		<Select id="ownerId" name="ownerId" value={val('ownerId')}>
			<option value="">Unassigned</option>
			{#each members as m (m.id)}
				<option value={m.id}>{m.name ?? m.email}</option>
			{/each}
		</Select>
	</div>
	<div>
		<Label for="linkedFormId">Linked form</Label>
		<Select id="linkedFormId" name="linkedFormId" value={val('linkedFormId')}>
			<option value="">None</option>
			{#each forms as f (f.id)}<option value={f.id}>{f.label}</option>{/each}
		</Select>
	</div>
	<div>
		<Label for="linkedEvidenceId">Linked evidence</Label>
		<Select id="linkedEvidenceId" name="linkedEvidenceId" value={val('linkedEvidenceId')}>
			<option value="">None</option>
			{#each evidence as e (e.id)}<option value={e.id}>{e.label}</option>{/each}
		</Select>
	</div>
	<div>
		<Label for="linkedAppointmentId">Linked appointment</Label>
		<Select id="linkedAppointmentId" name="linkedAppointmentId" value={val('linkedAppointmentId')}>
			<option value="">None</option>
			{#each appointments as a (a.id)}<option value={a.id}>{a.label}</option>{/each}
		</Select>
	</div>
	<div>
		<Label for="linkedMilestoneId">Linked milestone</Label>
		<Select id="linkedMilestoneId" name="linkedMilestoneId" value={val('linkedMilestoneId')}>
			<option value="">None</option>
			{#each milestones as m (m.id)}<option value={m.id}>{m.label}</option>{/each}
		</Select>
	</div>
	{#if error}
		<p class="md:col-span-2 text-sm text-destructive">{error}</p>
	{/if}
	<div class="md:col-span-2 flex gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
	</div>
</form>
