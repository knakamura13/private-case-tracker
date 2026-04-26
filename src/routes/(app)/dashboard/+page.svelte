<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Widget from '$lib/components/dashboard/Widget.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { fmtDateTime, fmtRelative, daysUntil } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import { CalendarClock, AlertTriangle } from 'lucide-svelte';
	import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
	import { getPageNumber } from '$lib/constants/navigation';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mounted = $state(true);
</script>

<PageHeader title="Dashboard" number={getPageNumber('/dashboard')} />

<div class="mb-4">
	<Widget title="Quick links">
		<QuickLinksWidget links={data.quickLinks} folders={data.quickLinkFolders} form={form as { error?: string; errorId?: string | null } | undefined} />
	</Widget>
</div>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
	<Widget title="Case progress" href="/timeline">
		<ul class="space-y-1.5 text-xs">
			{#each data.phaseProgress as p}
				<li class="flex items-center gap-2">
					<span class="w-32 truncate text-muted-foreground">{p.label}</span>
					<div class="h-1.5 flex-1 overflow-hidden rounded bg-muted">
						<div class="h-full bg-primary transition-all duration-1000 ease-out" style:width={mounted ? `${p.total === 0 ? 0 : (p.done / p.total) * 100}%` : '0%'}></div>
					</div>
					<span class="w-10 text-right text-[10px] text-muted-foreground">{p.done}/{p.total}</span>
				</li>
			{/each}
		</ul>
	</Widget>

	<Widget title="Countdowns" href="/timeline">
		{#if data.countdowns.length === 0}
			<p class="text-sm text-muted-foreground">No upcoming meetings or due milestones.</p>
		{:else}
			<ul class="space-y-2 text-sm">
				{#each data.countdowns as c}
					{@const d = daysUntil(c.date)}
					<li class="flex items-center justify-between gap-2">
						<a class="truncate hover:underline" href={c.href}>{c.label}</a>
						<Badge variant={d !== null && d < 7 ? 'warning' : 'secondary'}>
							{d === null ? '—' : d === 0 ? 'Today' : d > 0 ? `in ${d}d` : `${-d}d ago`}
						</Badge>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>

	<Widget title="Heads up" href="/evidence">
		{#if data.missingCritical.length === 0}
			<p class="text-sm text-muted-foreground">Nothing flagged. 🎉</p>
		{:else}
			<ul class="space-y-1 text-sm">
				{#each data.missingCritical as m}
					<li class="flex items-start gap-2">
						<AlertTriangle class="mt-0.5 h-3.5 w-3.5 text-warning" />
						<span>{m}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>

	<Widget title="Upcoming meetings" href="/timeline">
		{#if data.upcomingMeetings.length === 0}
			<p class="text-sm text-muted-foreground">Nothing scheduled.</p>
		{:else}
			<ul class="space-y-2 text-sm">
				{#each data.upcomingMeetings as m}
					<li>
						<a class="block hover:underline" href={`/timeline#${m.id}`}>
							<p class="truncate font-medium">{m.title}</p>
							<p class="text-xs text-muted-foreground">{fmtDateTime(m.scheduledAt)}</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>

	<Widget title="Evidence coverage" href="/evidence">
		<ul class="space-y-1.5 text-xs">
			{#each data.evidenceCoverage.slice(0, 8) as c}
				<li class="flex items-center gap-2">
					<span class="w-32 truncate text-muted-foreground">{c.category}</span>
					<div class="h-1.5 flex-1 overflow-hidden rounded bg-muted">
						<div
							class="h-full transition-all duration-1000 ease-out {c.target > 0 && c.total < c.target ? 'bg-warning' : 'bg-primary'}"
							style:width={mounted ? `${Math.min(100, c.target > 0 ? (c.total / c.target) * 100 : c.total > 0 ? 100 : 0)}%` : '0%'}
						></div>
					</div>
					<span class="w-10 text-right text-[10px] text-muted-foreground">
						{c.total}{c.target > 0 ? `/${c.target}` : ''}
					</span>
				</li>
			{/each}
		</ul>
	</Widget>

	<Widget title="Open questions" href="/questions">
		<ul class="space-y-1 text-xs">
			{#each Object.entries(data.openQuestionsCount) as [p, n]}
				<li class="flex items-center justify-between">
					<span class="text-muted-foreground">{titleCase(p)}</span>
					<span class="font-mono text-foreground">{n}</span>
				</li>
			{/each}
		</ul>
	</Widget>

	<Widget title="Recent activity" href="/settings/data/activity">
		{#if data.activity.length === 0}
			<p class="text-sm text-muted-foreground">No activity yet.</p>
		{:else}
			<ul class="space-y-2 text-sm">
				{#each data.activity as a}
					<li class="flex items-start gap-2">
						<CalendarClock class="mt-0.5 h-3 w-3 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="truncate">{a.summary}</p>
							<p class="text-[10px] text-muted-foreground">{fmtRelative(a.createdAt)} · {a.user?.name ?? a.user?.email ?? 'system'}</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>
</div>
