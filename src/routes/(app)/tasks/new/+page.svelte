<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import TaskForm from '$lib/components/tasks/TaskForm.svelte';
	import { showSuccessToast } from '$lib/stores/toast';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<PageHeader title="New task" />
<TaskForm
	members={data.members}
	initial={{ status: data.initialStatus }}
	submitLabel="Add task"
	error={form?.error}
	errorId={form?.errorId}
	onenhance={() => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				showSuccessToast('Task created successfully');
			}
		};
	}}
/>
