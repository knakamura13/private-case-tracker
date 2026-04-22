<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import QuestionForm from '$lib/components/questions/QuestionForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<PageHeader title="New question" description="Separate official answers from community anecdotes by choosing a source." />
<QuestionForm submitLabel="Add question" error={form?.error} />
