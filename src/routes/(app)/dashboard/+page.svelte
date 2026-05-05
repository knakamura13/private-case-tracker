<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Widget from '$lib/components/dashboard/Widget.svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import { CheckSquare, Clock, AlertTriangle } from 'lucide-svelte';
    import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // Pre-fetch tasks data for instant navigation
    $effect(() => {
        if (data.tasksPreview && data.tasksPreview.length > 0) {
            // Store timestamp to indicate pre-fetched data is available
            sessionStorage.setItem('prefetched-tasks-timestamp', Date.now().toString());
        }
    });
</script>

<PageHeader title="Overview" number={getPageNumber('/dashboard')} sub="Welcome back. Here is what is happening with your case today." />

<!-- Top Stats Row -->
<div class="stats-row">
    <div class="card tinted-sage">
        <div class="eyebrow">Pending tasks</div>
        <div class="display stat-display">{data.taskSummary.pending}</div>
    </div>
    <div class="card tinted-butter">
        <div class="eyebrow">In progress</div>
        <div class="display stat-display">{data.taskSummary.inProgress}</div>
    </div>
    <div class="card tinted-peri">
        <div class="eyebrow">Total evidence</div>
        <div class="display stat-display">{data.evidenceCoverage.reduce((a, b) => a + b.total, 0)}</div>
    </div>
</div>

<!-- Main Bento Grid -->
<div class="bento-grid">
    <!-- Left Column -->
    <div class="bento-col-left">
        <!-- Quick Links -->
        <Widget title="Quick Links" href="/quick-links">
            {#snippet children()}
                <QuickLinksWidget links={data.quickLinks} folders={data.quickLinkFolders} />
            {/snippet}
        </Widget>

        <!-- Recent Tasks Widget -->
        <Widget title="Active Tasks" href="/tasks">
            {#snippet children()}
                <div class="task-list">
                    {#each data.tasksPreview as task}
                        <div 
                            class="task-item"
                            role="button"
                            tabindex="0"
                            aria-label={`Task: ${task.title}`}
                            onclick={() => window.location.href = `/tasks?edit=${task.id}`}
                            onkeydown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    window.location.href = `/tasks?edit=${task.id}`;
                                }
                            }}
                        >
                            <CheckSquare size={18} style="color: var(--ink-3);" />
                            <div class="task-info">
                                <div class="task-title">{task.title}</div>
                                <div class="mono task-due-date">
                                    Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                </div>
                            </div>
                            <div class="pill s-active">In progress</div>
                        </div>
                    {/each}
                </div>
            {/snippet}
        </Widget>
    </div>

    <!-- Right Column -->
    <div class="bento-col-right">
        <!-- Countdown / Upcoming -->
        <Widget title="Milestones" href="/timeline">
            {#snippet children()}
                <div class="countdown-list">
                    {#each data.countdowns.slice(0, 3) as c}
                        <div class="countdown-item">
                            <div class="countdown-header">
                                <Clock size={14} style="color: var(--ink-3);" />
                                <div class="eyebrow countdown-eyebrow">{c.label}</div>
                            </div>
                            <div class="display countdown-display">
                                {Math.abs(Math.floor((new Date(c.date).getTime() - Date.now()) / 86400000))} days
                            </div>
                            <div class="mono countdown-date">{new Date(c.date).toLocaleDateString()}</div>
                        </div>
                    {/each}
                </div>
            {/snippet}
        </Widget>

        <!-- Heads up -->
        <Widget title="Heads up" class="tinted-blush">
            {#snippet children()}
                <div class="heads-up-list">
                    {#each data.missingCritical as m}
                        <div class="heads-up-item">
                            <AlertTriangle size={16} style="flex-shrink: 0; color: var(--blush-fill);" />
                            <span>{m}</span>
                        </div>
                    {/each}
                </div>
            {/snippet}
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
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    .task-item:hover {
        background: var(--surface-3);
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
    .stats-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 24px;
    }
    @media (min-width: 640px) {
        .stats-row {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }
    }
    .stat-display {
        font-size: 32px;
    }
    .task-info {
        flex: 1;
    }
    .task-title {
        font-size: 14px;
        font-weight: 600;
    }
    .task-due-date {
        font-size: 11px;
        color: var(--ink-3);
    }
    .countdown-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }
    .countdown-eyebrow {
        margin: 0;
    }
    .countdown-display {
        font-size: 20px;
    }
    .countdown-date {
        font-size: 11px;
        color: var(--ink-3);
    }
</style>
