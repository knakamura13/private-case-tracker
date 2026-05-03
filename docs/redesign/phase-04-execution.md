# Phase 4 Execution Prompt: Dashboard Rebuild

## Goal

Redesign the Dashboard to follow the bento-grid pattern with large serif titles and custom Monarch widgets.

## Critical Instructions

- **Do NOT** change any data loading logic in `+page.server.ts`.
- **Maintain** the functionality of existing widgets (Quick Links, Tasks, etc.).
- **Follow the exact markup** for the bento-grid layout.

---

## Step 1: Rewrite `Widget.svelte`

**File:** `src/lib/components/dashboard/Widget.svelte`

Update this component to be a Monarch-style card with a serif title:

```svelte
<script lang="ts">
    let {
        title,
        href,
        class: className,
        children
    }: {
        title: string;
        href?: string;
        class?: string;
        children: import('svelte').Snippet;
    } = $props();
</script>

<div class="card {className}" style="display: flex; flex-direction: column; gap: 16px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
        <h3 class="display" style="font-size: 20px; margin: 0;">{title}</h3>
        {#if href}
            <a {href} class="btn sm ghost">View all</a>
        {/if}
    </div>
    <div style="flex: 1;">{@render children()}</div>
</div>
```

---

## Step 2: Rewrite `dashboard/+page.svelte`

**File:** `src/routes/(app)/dashboard/+page.svelte`

Replace the layout with a Monarch-compliant grid. The "Quick links" should be a prominent top section or a large card.

```svelte
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
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px;">
    <!-- Left Column -->
    <div style="display: flex; flex-direction: column; gap: 28px;">
        <!-- Recent Tasks Widget -->
        <Widget title="Active Tasks" href="/tasks">
            <div style="display: flex; flex-direction: column; gap: 12px;">
                {#each data.tasksPreview as task}
                    <div
                        style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--surface-2); border-radius: var(--r-md);"
                    >
                        <CheckSquare size={18} style="color: var(--ink-3);" />
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 600;">{task.title}</div>
                            <div class="mono" style="font-size: 11px; color: var(--ink-3);">
                                Due {new Date(task.dueDate).toLocaleDateString()}
                            </div>
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
    <div style="display: flex; flex-direction: column; gap: 28px;">
        <!-- Countdown / Upcoming -->
        <Widget title="Upcoming" href="/timeline">
            <div style="display: flex; flex-direction: column; gap: 16px;">
                {#each data.countdowns.slice(0, 3) as c}
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div class="eyebrow">{c.label}</div>
                        <div class="display" style="font-size: 20px;">
                            {Math.abs(Math.floor((new Date(c.date).getTime() - Date.now()) / 86400000))} days
                        </div>
                        <div class="mono" style="font-size: 11px; color: var(--ink-3);">{new Date(c.date).toLocaleDateString()}</div>
                    </div>
                {/each}
            </div>
        </Widget>

        <!-- Heads up -->
        <Widget title="Heads up" class="tinted-blush">
            <div style="display: flex; flex-direction: column; gap: 12px;">
                {#each data.missingCritical as m}
                    <div style="display: flex; gap: 10px; font-size: 13px; line-height: 1.4;">
                        <AlertTriangle size={16} style="flex-shrink: 0; color: var(--blush-fill);" />
                        <span>{m}</span>
                    </div>
                {/each}
            </div>
        </Widget>
    </div>
</div>
```

---

## Step 3: Minimal `QuickLinksWidget.svelte` update

**File:** `src/lib/components/dashboard/QuickLinksWidget.svelte`

Ensure the links use the Monarch pill or simple tile design. For this phase, just update the outer container to be a simple flex-wrap row if it isn't already.

---

## Verification

- Run `npm run dev`.
- Dashboard should show three large tinted cards at the top.
- Layout should be a 2:1 column split on desktop.
- Typography should be predominantly serif for headings.
