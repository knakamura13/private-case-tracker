<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Widget from '$lib/components/dashboard/Widget.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { fmtDate, fmtDateTime, fmtRelative, daysUntil } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import { CalendarClock, AlertTriangle, CheckSquare } from 'lucide-svelte';
	import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
	import { getPageNumber } from '$lib/constants/navigation';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mounted = $state(true);

	function taskStatusTone(status: string) {
		if (status === 'IN_PROGRESS') return 'warning';
		return 'secondary';
	}

	function taskStatusLabel(status: string) {
		if (status === 'IN_PROGRESS') return 'In progress';
		if (status === 'DONE') return 'Completed';
		return 'Pending';
	}
</script>

<PageHeader title="Dashboard" number={getPageNumber('/dashboard')} />

<div class="dashboard-section">
	<Widget title="Quick links">
		<QuickLinksWidget links={data.quickLinks} folders={data.quickLinkFolders} form={form as { error?: string; errorId?: string | null } | undefined} />
	</Widget>
</div>

<div class="dashboard-grid">
	<Widget title="Tasks" href="/tasks">
		<div class="dashboard-space-y-4">
			<div class="stats-grid">
				<div class="stat-card">
					<p class="stat-label">Pending</p>
					<p class="stat-value">{data.taskSummary.pending}</p>
				</div>
				<div class="stat-card stat-card-warning">
					<p class="stat-label">In Progress</p>
					<p class="stat-value">{data.taskSummary.inProgress}</p>
				</div>
				<div class="stat-card stat-card-success">
					<p class="stat-label">Completed</p>
					<p class="stat-value">{data.taskSummary.completed}</p>
				</div>
			</div>

			{#if data.tasksPreview.length === 0}
				<p class="dashboard-text-sm dashboard-text-muted">No open tasks right now.</p>
			{:else}
				<ul class="dashboard-space-y-2 dashboard-text-sm">
					{#each data.tasksPreview as task (task.id)}
						<li class="task-list-item">
							<CheckSquare class="dashboard-mt-0-5 dashboard-icon-sm dashboard-text-muted" />
							<div class="dashboard-min-w-0 dashboard-flex-1">
								<p class="dashboard-truncate dashboard-font-medium">{task.title}</p>
								<div class="dashboard-mt-1 dashboard-flex dashboard-items-center dashboard-gap-2 dashboard-text-xs dashboard-text-muted">
									<Badge variant={taskStatusTone(task.status)}>{taskStatusLabel(task.status)}</Badge>
									{#if task.dueDate}
										<span>Due {fmtDate(task.dueDate)}</span>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Widget>

	<Widget title="Case progress" href="/timeline">
		<ul class="dashboard-space-y-1-5 dashboard-text-xs">
			{#each data.phaseProgress as p (p.label)}
				<li class="phase-progress-item">
					<span class="phase-label">{p.label}</span>
					<div class="progress-bar-container">
						<div class="progress-bar-fill" style:width={mounted ? `${p.total === 0 ? 0 : (p.done / p.total) * 100}%` : '0%'}></div>
					</div>
					<span class="phase-count">{p.done}/{p.total}</span>
				</li>
			{/each}
		</ul>
	</Widget>

	<Widget title="Countdowns" href="/timeline">
		{#if data.countdowns.length === 0}
			<p class="dashboard-text-sm dashboard-text-muted">No upcoming meetings or due milestones.</p>
		{:else}
			<ul class="dashboard-space-y-2 dashboard-text-sm">
				{#each data.countdowns as c (c.href)}
					{@const d = daysUntil(c.date)}
					<li class="countdown-item">
						<a class="dashboard-truncate dashboard-hover-underline" href={c.href}>{c.label}</a>
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
			<p class="dashboard-text-sm dashboard-text-muted">Nothing flagged. 🎉</p>
		{:else}
			<ul class="dashboard-space-y-1 dashboard-text-sm">
				{#each data.missingCritical as m (m)}
					<li class="activity-item">
						<AlertTriangle class="dashboard-mt-0-5 dashboard-icon-sm text-warning" />
						<span>{m}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>

	<Widget title="Upcoming meetings" href="/timeline">
		{#if data.upcomingMeetings.length === 0}
			<p class="dashboard-text-sm dashboard-text-muted">Nothing scheduled.</p>
		{:else}
			<ul class="dashboard-space-y-2 dashboard-text-sm">
				{#each data.upcomingMeetings as m (m.id)}
					<li>
						<a class="dashboard-block dashboard-hover-underline" href={`/timeline#${m.id}`}>
							<p class="dashboard-truncate dashboard-font-medium">{m.title}</p>
							<p class="dashboard-text-xs dashboard-text-muted">{fmtDateTime(m.scheduledAt)}</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>

	<Widget title="Evidence coverage" href="/evidence">
		<ul class="dashboard-space-y-1-5 dashboard-text-xs">
			{#each data.evidenceCoverage.slice(0, 8) as c (c.category)}
				<li class="dashboard-flex dashboard-items-center dashboard-gap-2">
					<span class="dashboard-w-32 dashboard-truncate dashboard-text-muted">{c.category}</span>
					<div class="progress-bar-container">
					<div
						class="progress-bar-fill {c.target > 0 && c.total < c.target ? 'progress-bar-fill-warning' : ''}"
						style:width={mounted ? `${Math.min(100, c.target > 0 ? (c.total / c.target) * 100 : c.total > 0 ? 100 : 0)}%` : '0%'}
					></div>
				</div>
				<span class="phase-count">
						{c.total}{c.target > 0 ? `/${c.target}` : ''}
					</span>
				</li>
			{/each}
		</ul>
	</Widget>

	<Widget title="Open questions" href="/questions">
		<ul class="dashboard-space-y-1 dashboard-text-xs">
			{#each Object.entries(data.openQuestionsCount) as [p, n] (p)}
				<li class="dashboard-flex dashboard-items-center dashboard-justify-between">
					<span class="dashboard-text-muted">{titleCase(p)}</span>
					<span class="dashboard-font-mono">{n}</span>
				</li>
			{/each}
		</ul>
	</Widget>

	<Widget title="Recent activity" href="/settings/data/activity">
		{#if data.activity.length === 0}
			<p class="dashboard-text-sm dashboard-text-muted">No activity yet.</p>
		{:else}
			<ul class="dashboard-space-y-2 dashboard-text-sm">
				{#each data.activity as a (a.id)}
					<li class="activity-item">
						<CalendarClock class="dashboard-mt-0-5 dashboard-icon-xs dashboard-text-muted" />
						<div class="activity-content">
							<p class="dashboard-truncate">{a.summary}</p>
							<p class="dashboard-text-10px dashboard-text-muted">{fmtRelative(a.createdAt)} · {a.user?.name ?? a.user?.email ?? 'system'}</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Widget>
</div>
