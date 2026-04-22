<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import AppointmentForm from '$lib/components/appointments/AppointmentForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<PageHeader title="New appointment" />
<AppointmentForm submitLabel="Create appointment" error={form?.error} />
