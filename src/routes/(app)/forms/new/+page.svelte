<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FormForm from '$lib/components/forms/FormForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<PageHeader title="New form" description="Track an immigration form. Use the standard code and name." />
<FormForm submitLabel="Create form" error={form?.error} />
