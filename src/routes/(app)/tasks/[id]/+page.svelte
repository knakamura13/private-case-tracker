<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import TaskForm from '$lib/components/tasks/TaskForm.svelte';
	import { showSuccessToast } from '$lib/stores/toast';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<PageHeader title="Edit task" />
<TaskForm
	members={data.members}
	initial={data.task}
	submitLabel="Save changes"
	error={form?.error}
	errorId={form?.errorId}
	action="?/update"
	onenhance={() => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				showSuccessToast('Task updated successfully');
			}
		};
	}}
/>
<form method="post" action="?/delete" class="mt-4">
	<button type="submit" class="text-destructive hover:underline">Delete task</button>
</form>
