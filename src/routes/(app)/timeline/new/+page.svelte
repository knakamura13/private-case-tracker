<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import MilestoneForm from '$lib/components/timeline/MilestoneForm.svelte';
	import { showSuccessToast } from '$lib/stores/toast';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<PageHeader title="New milestone" />
<MilestoneForm
	members={data.members}
	initial={{ phase: data.defaultPhase }}
	submitLabel="Add milestone"
	error={form?.error}
	errorId={form?.errorId}
	onenhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				showSuccessToast('Milestone created successfully');
			}
		};
	}}
/>
