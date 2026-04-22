<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FilterBar from '$lib/components/shared/FilterBar.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { NotebookPen, Plus } from 'lucide-svelte';
	import { fmtDateTime } from '$lib/utils/dates';
	import { truncate } from '$lib/utils/format';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Notes" description="Meeting notes, call logs, and reminders.">
	{#snippet actions()}
		<Button href="/notes/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New note{/snippet}
		</Button>
	{/snippet}
</PageHeader>
<FilterBar />
{#if data.notes.length === 0}
	<EmptyState title="No notes yet" description="Jot down questions for your attorney, meeting notes, or filing-day details.">
		{#snippet icon()}<NotebookPen class="h-8 w-8" />{/snippet}
		{#snippet actions()}<Button href="/notes/new">New note</Button>{/snippet}
	</EmptyState>
{:else}
	<ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
		{#each data.notes as n (n.id)}
			<li>
				<a href={`/notes/${n.id}`}>
					<Card class="p-4 hover:border-primary/40">
						<h3 class="font-semibold">{n.title}</h3>
						<p class="mt-1 line-clamp-3 text-sm text-muted-foreground">{truncate(n.bodyMd.replace(/[#*_`>]/g, ''), 240)}</p>
						<p class="mt-2 text-xs text-muted-foreground">{fmtDateTime(n.updatedAt)} · {n.author.name ?? n.author.email}</p>
					</Card>
				</a>
			</li>
		{/each}
	</ul>
{/if}
