<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import EvidenceForm from '$lib/components/evidence/EvidenceForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<PageHeader title="New evidence item" description="Capture metadata. You can attach a file or external link from the detail page." />
<EvidenceForm submitLabel="Add evidence" error={form?.error} />
