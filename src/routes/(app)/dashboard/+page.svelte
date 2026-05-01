<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Widget from '$lib/components/dashboard/Widget.svelte';
	import { getPageNumber } from '$lib/constants/navigation';
	import { CheckSquare, Clock, AlertTriangle } from 'lucide-svelte';
	import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Overview" number={getPageNumber('/dashboard')} sub="Welcome back. Here is what is happening with your case today." />

<!-- Top Stats Row -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px;">
	<div class="card tinted-sage">
		<div class="eyebrow">Pending tasks</div>
		<div class="display" style="font-size: 32px;">{data.taskSummary.pending}</div>
	</div>
	<div class="card tinted-butter">
		<div class="eyebrow">In progress</div>
		<div class="display" style="font-size: 32px;">{data.taskSummary.inProgress}</div>
	</div>
	<div class="card tinted-peri">
		<div class="eyebrow">Total evidence</div>
		<div class="display" style="font-size: 32px;">{data.evidenceCoverage.reduce((a, b) => a + b.total, 0)}</div>
	</div>
</div>

<!-- Main Bento Grid -->
<div class="bento-grid">
	<!-- Left Column -->
	<div class="bento-col-left">
		<!-- Recent Tasks Widget -->
		<Widget title="Active Tasks" href="/tasks">
			<div class="task-list">
				{#each data.tasksPreview as task}
					<div class="task-item">
						<CheckSquare size={18} style="color: var(--ink-3);" />
						<div style="flex: 1;">
							<div style="font-size: 14px; font-weight: 600;">{task.title}</div>
							<div class="mono" style="font-size: 11px; color: var(--ink-3);">Due {new Date(task.dueDate).toLocaleDateString()}</div>
						</div>
						<div class="pill s-active">In progress</div>
					</div>
				{/each}
			</div>
		</Widget>

		<!-- Quick Links -->
		<Widget title="Quick Links" href="/quick-links">
			<QuickLinksWidget links={data.quickLinks} folders={data.quickLinkFolders} />
		</Widget>
	</div>

	<!-- Right Column -->
	<div class="bento-col-right">
		<!-- Countdown / Upcoming -->
		<Widget title="Upcoming" href="/timeline">
			<div class="countdown-list">
				{#each data.countdowns.slice(0, 3) as c}
					<div class="countdown-item">
						<div class="eyebrow">{c.label}</div>
						<div class="display" style="font-size: 20px;">{Math.abs(Math.floor((new Date(c.date).getTime() - Date.now()) / 86400000))} days</div>
						<div class="mono" style="font-size: 11px; color: var(--ink-3);">{new Date(c.date).toLocaleDateString()}</div>
					</div>
				{/each}
			</div>
		</Widget>

		<!-- Heads up -->
		<Widget title="Heads up" class="tinted-blush">
			<div class="heads-up-list">
				{#each data.missingCritical as m}
					<div class="heads-up-item">
						<AlertTriangle size={16} style="flex-shrink: 0; color: var(--blush-fill);" />
						<span>{m}</span>
					</div>
				{/each}
			</div>
		</Widget>
	</div>
</div>

<style>
	.bento-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 28px;
	}
	@media (max-width: 1024px) {
		.bento-grid {
			grid-template-columns: 1fr;
		}
	}
	.bento-col-left,
	.bento-col-right {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.task-list,
	.countdown-list,
	.heads-up-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.task-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: var(--surface-2);
		border-radius: var(--r-md);
	}
	.countdown-list {
		gap: 16px;
	}
	.countdown-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.heads-up-item {
		display: flex;
		gap: 10px;
		font-size: 13px;
		line-height: 1.4;
	}
</style>
