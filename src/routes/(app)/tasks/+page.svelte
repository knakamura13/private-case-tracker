<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TaskCard from '$lib/components/tasks/TaskCard.svelte';
	import { Plus, LayoutGrid, ListTodo, Calendar } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Tasks" description="Board, list, calendar, and filtered views.">
	{#snippet actions()}
		<Button variant="outline" size="sm" href="/tasks/board">
			{#snippet children()}<LayoutGrid class="h-4 w-4" /> Board{/snippet}
		</Button>
		<Button variant="outline" size="sm" href="/tasks/calendar">
			{#snippet children()}<Calendar class="h-4 w-4" /> Calendar{/snippet}
		</Button>
		<Button href="/tasks/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New task{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<FilterBar
	filters={[
		{
			name: 'status',
			label: 'Status',
			options: [
				{ value: 'TODO', label: 'To do' },
				{ value: 'IN_PROGRESS', label: 'In progress' },
				{ value: 'BLOCKED', label: 'Blocked' },
				{ value: 'DONE', label: 'Done' },
				{ value: 'ARCHIVED', label: 'Archived' }
			]
		},
		{
			name: 'owner',
			label: 'Owner',
			options: [{ value: 'me', label: 'Mine only' }]
		},
		{
			name: 'view',
			label: 'View',
			options: [{ value: 'overdue', label: 'Overdue only' }]
		}
	]}
/>

{#if data.tasks.length === 0}
	<EmptyState title="No tasks yet" description="Create your first task to start tracking work.">
		{#snippet icon()}<ListTodo class="h-8 w-8" />{/snippet}
		{#snippet actions()}
			<Button href="/tasks/new">New task</Button>
		{/snippet}
	</EmptyState>
{:else}
	<ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each data.tasks as task (task.id)}
			<li><TaskCard {task} /></li>
		{/each}
	</ul>
{/if}
