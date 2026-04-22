<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import MonthCalendar from '$lib/components/shared/MonthCalendar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { List } from 'lucide-svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Task calendar" description="Tasks with a due date and all appointments.">
	{#snippet actions()}
		<Button variant="outline" href="/tasks">
			{#snippet children()}<List class="h-4 w-4" /> List{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<MonthCalendar items={data.items} />
