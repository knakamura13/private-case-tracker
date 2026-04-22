<script lang="ts">
	import {
		addMonths,
		endOfMonth,
		format,
		isSameDay,
		isSameMonth,
		startOfMonth,
		startOfWeek,
		endOfWeek,
		addDays
	} from 'date-fns';
	import Button from '$lib/components/ui/Button.svelte';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Item {
		id: string;
		kind: string;
		date: Date | string;
		title: string;
		href: string;
	}

	let { items }: { items: Item[] } = $props();
	let cursor = $state(new Date());

	const cells = $derived.by(() => {
		const start = startOfWeek(startOfMonth(cursor));
		const end = endOfWeek(endOfMonth(cursor));
		const out: { date: Date; items: Item[] }[] = [];
		for (let d = start; d <= end; d = addDays(d, 1)) {
			out.push({
				date: d,
				items: items.filter((i) => isSameDay(new Date(i.date), d))
			});
		}
		return out;
	});
</script>

<div class="rounded-lg border border-border bg-card">
	<div class="flex items-center justify-between border-b border-border px-4 py-2">
		<Button variant="ghost" size="icon" onclick={() => (cursor = addMonths(cursor, -1))} aria-label="Previous month">
			{#snippet children()}<ChevronLeft class="h-4 w-4" />{/snippet}
		</Button>
		<p class="text-sm font-semibold">{format(cursor, 'MMMM yyyy')}</p>
		<Button variant="ghost" size="icon" onclick={() => (cursor = addMonths(cursor, 1))} aria-label="Next month">
			{#snippet children()}<ChevronRight class="h-4 w-4" />{/snippet}
		</Button>
	</div>
	<div class="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs text-muted-foreground">
		{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as d}
			<div class="py-1">{d}</div>
		{/each}
	</div>
	<div class="grid grid-cols-7">
		{#each cells as cell (cell.date.toISOString())}
			{@const current = isSameMonth(cell.date, cursor)}
			<div class="min-h-[90px] border-b border-r border-border p-1 text-xs {current ? '' : 'bg-muted/20 text-muted-foreground'}">
				<div class="mb-1 text-right text-[10px]">{format(cell.date, 'd')}</div>
				<ul class="space-y-1">
					{#each cell.items as it (it.kind + it.id)}
						<li>
							<a
								href={it.href}
								class="block truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary hover:bg-primary/15"
								title={it.title}
							>{it.title}</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</div>
