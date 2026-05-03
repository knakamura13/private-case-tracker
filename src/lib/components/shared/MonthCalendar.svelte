<script lang="ts">
    import { addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
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

<div class="month-cal">
    <div class="month-cal__toolbar">
        <Button variant="ghost" size="icon" onclick={() => (cursor = addMonths(cursor, -1))} aria-label="Previous month">
            {#snippet children()}<ChevronLeft />{/snippet}
        </Button>
        <p class="month-cal__title">{format(cursor, 'MMMM yyyy')}</p>
        <Button variant="ghost" size="icon" onclick={() => (cursor = addMonths(cursor, 1))} aria-label="Next month">
            {#snippet children()}<ChevronRight />{/snippet}
        </Button>
    </div>
    <div class="month-cal__weekdays">
        {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as d}
            <div class="month-cal__weekday">{d}</div>
        {/each}
    </div>
    <div class="month-cal__grid">
        {#each cells as cell (cell.date.toISOString())}
            {@const current = isSameMonth(cell.date, cursor)}
            <div class="month-cal__cell" class:month-cal__cell--muted={!current}>
                <div class="month-cal__day-num">{format(cell.date, 'd')}</div>
                <ul class="month-cal__items">
                    {#each cell.items as it (it.kind + it.id)}
                        <li>
                            <a href={it.href} class="month-cal__item" title={it.title}>{it.title}</a>
                        </li>
                    {/each}
                </ul>
            </div>
        {/each}
    </div>
</div>

<style>
    .month-cal {
        border-radius: var(--r-md);
        border: 1px solid var(--hairline);
        background: var(--surface);
        overflow: hidden;
    }

    .month-cal__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        border-bottom: 1px solid var(--hairline);
    }

    .month-cal__title {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--ink);
    }

    .month-cal__toolbar :global(svg) {
        width: 18px;
        height: 18px;
    }

    .month-cal__weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--hairline);
        background: color-mix(in srgb, var(--surface-3) 30%, var(--surface));
        text-align: center;
        font-size: 11px;
        color: var(--ink-3);
    }

    .month-cal__weekday {
        padding: 4px 0;
    }

    .month-cal__grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
    }

    .month-cal__cell {
        min-height: 90px;
        border-bottom: 1px solid var(--hairline);
        border-right: 1px solid var(--hairline);
        padding: 4px;
        font-size: 11px;
    }

    .month-cal__cell--muted {
        background: color-mix(in srgb, var(--surface-3) 20%, var(--surface));
        color: var(--ink-3);
    }

    .month-cal__day-num {
        margin-bottom: 4px;
        text-align: right;
        font-size: 10px;
    }

    .month-cal__items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .month-cal__item {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-radius: 4px;
        background: color-mix(in srgb, var(--ink) 8%, transparent);
        padding: 2px 4px;
        font-size: 10px;
        color: var(--ink);
        text-decoration: none;
    }

    .month-cal__item:hover {
        background: color-mix(in srgb, var(--ink) 14%, transparent);
    }
</style>
