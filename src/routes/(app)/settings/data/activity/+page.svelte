<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { fmtDateTime } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Activity" description="Internal audit feed for this workspace." />
<Card class="p-0">
	<ul class="divide-y divide-border text-sm">
		{#each data.items as a (a.id)}
			<li class="px-4 py-3">
				<div class="flex items-center justify-between gap-2">
					<p class="truncate">{a.summary}</p>
					<span class="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
				</div>
				<p class="text-[11px] text-muted-foreground">
					{titleCase(a.action)} on {a.entityType} · {a.user?.name ?? a.user?.email ?? 'system'}
				</p>
			</li>
		{:else}
			<li class="px-4 py-6 text-center text-sm text-muted-foreground">No activity yet.</li>
		{/each}
	</ul>
</Card>
