<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import TaskForm from '$lib/components/tasks/TaskForm.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const formOptions = $derived(data.forms.map((f) => ({ id: f.id, label: `${f.code} — ${f.name}` })));
	const evidenceOptions = $derived(data.evidence.map((e) => ({ id: e.id, label: e.title })));
	const appointmentOptions = $derived(data.appointments.map((a) => ({ id: a.id, label: a.title })));
	const milestoneOptions = $derived(
		data.milestones.map((m) => ({ id: m.id, label: `${m.phase.replaceAll('_', ' ')} — ${m.title}` }))
	);
</script>

<PageHeader title="New task" description="Create a task, optionally linked to forms, evidence, appointments, or milestones." />

<TaskForm
	forms={formOptions}
	evidence={evidenceOptions}
	appointments={appointmentOptions}
	milestones={milestoneOptions}
	members={data.members}
	submitLabel="Create task"
	error={form?.error}
/>
