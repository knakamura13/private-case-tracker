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

<div class="monthcal-rounded-lg monthcal-border monthcal-bg-card">
	<div class="monthcal-flex monthcal-items-center monthcal-justify-between monthcal-border-b monthcal-px-4 monthcal-py-2">
		<Button variant="ghost" size="icon" onclick={() => (cursor = addMonths(cursor, -1))} aria-label="Previous month">
			{#snippet children()}<ChevronLeft class="monthcal-icon-sm" />{/snippet}
		</Button>
		<p class="monthcal-text-sm monthcal-font-semibold">{format(cursor, 'MMMM yyyy')}</p>
		<Button variant="ghost" size="icon" onclick={() => (cursor = addMonths(cursor, 1))} aria-label="Next month">
			{#snippet children()}<ChevronRight class="monthcal-icon-sm" />{/snippet}
		</Button>
	</div>
	<div class="monthcal-grid monthcal-grid-cols-7 monthcal-border-b monthcal-bg-muted-30 monthcal-text-center monthcal-text-xs monthcal-text-muted">
		{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as d}
			<div class="monthcal-py-1">{d}</div>
		{/each}
	</div>
	<div class="monthcal-grid monthcal-grid-cols-7">
		{#each cells as cell (cell.date.toISOString())}
			{@const current = isSameMonth(cell.date, cursor)}
			<div class="monthcal-min-h-90 monthcal-border-b monthcal-border-r monthcal-p-1 monthcal-text-xs {current ? '' : 'monthcal-bg-muted-20 monthcal-text-muted'}">
				<div class="monthcal-mb-1 monthcal-text-right monthcal-text-10">{format(cell.date, 'd')}</div>
				<ul class="monthcal-space-y-1">
					{#each cell.items as it (it.kind + it.id)}
						<li>
							<a
								href={it.href}
								class="monthcal-block monthcal-truncate monthcal-rounded monthcal-bg-primary-10 monthcal-px-1 monthcal-py-0-5 monthcal-text-10 monthcal-text-primary monthcal-hover-bg-primary-15"
								title={it.title}
							>{it.title}</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</div>
