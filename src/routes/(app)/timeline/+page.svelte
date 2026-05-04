<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Button from '$lib/components/ui/Button.svelte';
        import MilestoneModal from '$lib/components/timeline/MilestoneModal.svelte';
    import { Plus, MapPin, Check, Clock } from 'lucide-svelte';
    import { fmtDate } from '$lib/utils/dates';
    import { PHASE_ORDER, PHASE_LABELS, PHASE_DESCRIPTIONS } from '$lib/constants/phases';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import { invalidateAll, goto } from '$app/navigation';
    import { showSuccessToast } from '$lib/stores/toast';
    import type { PageData } from './$types';
    import type { MilestoneItem } from '$lib/server/dynamo/types';

    interface TimelinePageData extends PageData {
        members: { id: string; name: string | null; email: string }[];
    }

    let { data, form }: { data: TimelinePageData; form: { error?: string; errorId?: string } } = $props();

    let showCreateModal = $state(false);
    let defaultPhase = $state<string | undefined>(undefined);

    const editParam = $derived(page.url.searchParams.get('edit'));
    const editingMilestone = $derived(editParam && data.milestones.some((m) => m.id === editParam) ? { id: editParam } : null);

    async function updateUrl(id: string | null) {
        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set('edit', id);
        } else {
            url.searchParams.delete('edit');
        }
        await goto(url.toString(), { replaceState: true, noScroll: true });
    }

    const grouped = $derived(
        PHASE_ORDER.map((p) => ({
            phase: p,
            items: data.milestones.filter((m) => m.phase === p)
        }))
    );

    function phaseProgress(items: { status: string }[]) {
        if (items.length === 0) return 0;
        const done = items.filter((i) => i.status === 'DONE' || i.status === 'SKIPPED').length;
        return Math.round((done / items.length) * 100);
    }

    function phaseStatus(items: { status: string }[]) {
        if (items.length === 0) return 'future';
        const hasActive = items.some((i) => i.status === 'IN_PROGRESS' || i.status === 'PLANNED');
        const allDone = items.every((i) => i.status === 'DONE' || i.status === 'SKIPPED');
        if (allDone) return 'done';
        if (hasActive) return 'active';
        return 'future';
    }

    function milestoneNodeStatus(status: string) {
        if (status === 'DONE' || status === 'SKIPPED') return 'done';
        if (status === 'IN_PROGRESS' || status === 'PLANNED') return 'active';
        return 'future';
    }

    function statusPillClass(status: string) {
        if (status === 'DONE' || status === 'SKIPPED') return 's-done';
        if (status === 'IN_PROGRESS' || status === 'PLANNED') return 's-active';
        if (status === 'BLOCKED') return 's-urgent';
        return 's-note';
    }

    function statusLabel(status: string) {
        if (status === 'DONE') return 'Done';
        if (status === 'SKIPPED') return 'Skipped';
        if (status === 'IN_PROGRESS') return 'In progress';
        if (status === 'PLANNED') return 'Planned';
        if (status === 'BLOCKED') return 'Blocked';
        return status;
    }

    function generateGoogleMapsUrl(address: string | null | undefined) {
        if (!address?.trim()) return '#';
        const query = encodeURIComponent(address.trim());
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    const totalPhases = $derived(PHASE_ORDER.length);
    const completedPhases = $derived(grouped.filter((g) => phaseStatus(g.items) === 'done').length);
    const currentPhaseIndex = $derived(grouped.findIndex((g) => phaseStatus(g.items) === 'active'));
    const currentPhase = $derived(grouped.at(currentPhaseIndex) ?? null);

    onMount(() => {
        // Handle scrolling to milestone when URL contains hash fragment
        if (window.location.hash) {
            const milestoneId = window.location.hash.slice(1); // Remove #
            const element = document.getElementById(milestoneId);
            if (element) {
                // Small delay to ensure page is fully rendered
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    });
</script>

<PageHeader title="Timeline" sub="Case phases from preparation through final outcome." number={getPageNumber('/timeline')} />

<div class="timeline-page">
    <!-- Left: Phase Rail -->
    <div class="timeline-phase-rail">
        {#each grouped as g, i (g.phase)}
            {@const status = phaseStatus(g.items)}
            {@const progress = phaseProgress(g.items)}
            <section>
                <!-- Phase Header -->
                <div
                    class="timeline-phase-header {status === 'done' ? 'timeline-phase-header-done' : ''} {status === 'active'
                        ? 'timeline-phase-header-active'
                        : ''}"
                >
                    <div class="timeline-phase-number">0{i + 1}</div>
                    <h2 class="timeline-phase-title">{PHASE_LABELS[g.phase]}</h2>
                    <p class="timeline-phase-subtitle">{PHASE_DESCRIPTIONS[g.phase]}</p>
                    <div class="timeline-phase-meta">
                        {#if g.items.length > 0}
                            <span class="pill {statusPillClass(g.items[0]?.status ?? 'PLANNED')}">{progress}% complete</span>
                            <span class="mono" style="font-size: 11px; color: var(--ink-3);">{g.items.length} milestones</span>
                        {/if}
                    </div>
                </div>

                <!-- Milestone Rail -->
                {#if g.items.length > 0}
                    <div class="timeline-milestone-rail">
                        <div class="timeline-rail-line"></div>
                        {#each g.items as m, _mi (m.id)}
                            {@const nodeStatus = milestoneNodeStatus(m.status)}
                            <div style="position: relative; margin-bottom: 12px;">
                                <div
                                    class="timeline-milestone-node {nodeStatus === 'done'
                                        ? 'timeline-milestone-node-done'
                                        : ''} {nodeStatus === 'active' ? 'timeline-milestone-node-active' : ''} {nodeStatus === 'future'
                                        ? 'timeline-milestone-node-future'
                                        : ''}"
                                >
                                    {#if nodeStatus === 'done'}
                                        <Check style="width: 14px; height: 14px; color: var(--surface);" />
                                    {:else if nodeStatus === 'active'}
                                        <Clock style="width: 14px; height: 14px; color: var(--surface);" />
                                    {/if}
                                </div>
                                <button
                                    type="button"
                                    id={m.id}
                                    onclick={async (e) => {
                                        e.currentTarget.blur();
                                        await updateUrl(m.id);
                                    }}
                                    style="background: none; border: none; cursor: pointer; width: 100%; text-align: left; padding: 0;"
                                >
                                    <div class="timeline-milestone-card {nodeStatus === 'active' ? 'timeline-milestone-card-active' : ''}">
                                        {#if m.dueDate}
                                            <div class="timeline-milestone-date">{fmtDate(m.dueDate)}</div>
                                        {/if}
                                        <h3 class="timeline-milestone-title">{m.title}</h3>
                                        {#if m.description}
                                            <div class="timeline-milestone-body">
                                                <div class="timeline-milestone-description">{m.description}</div>
                                            </div>
                                        {/if}
                                        <div class="timeline-milestone-footer">
                                            <span class="pill {statusPillClass(m.status)}">{statusLabel(m.status)}</span>
                                            {#if m.subTasks && m.subTasks.length > 0}
                                                <span style="font-size: 11px; color: var(--ink-3);">
                                                    {m.subTasks.filter((st) => st.done).length}/{m.subTasks.length} subtasks
                                                </span>
                                            {/if}
                                            {#if (m as MilestoneItem).location}
                                                <a
                                                    href={generateGoogleMapsUrl((m as MilestoneItem).location)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--ink-2); text-decoration: none;"
                                                >
                                                    <MapPin style="width: 12px; height: 12px;" />
                                                    {(m as MilestoneItem).location}
                                                </a>
                                            {/if}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Add Milestone Button -->
                <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => {
                        defaultPhase = g.phase;
                        showCreateModal = true;
                    }}
                    class="timeline-add-milestone-btn"
                >
                    <Plus style="width: 14px; height: 14px;" /> Add milestone to {PHASE_LABELS[g.phase]}
                </Button>
            </section>
        {/each}
    </div>

    <!-- Right: Sticky Sidebar -->
    <div class="timeline-sidebar">
        <!-- Phases Complete Card -->
        <div class="timeline-sidebar-card timeline-sidebar-card-tinted-sage">
            <div class="timeline-sidebar-number">{completedPhases}/{totalPhases}</div>
            <div class="timeline-sidebar-label">Phases complete</div>
        </div>

        <!-- Phase Progress Card -->
        <div class="timeline-sidebar-card">
            <div class="timeline-phase-list">
                {#each grouped as g (g.phase)}
                    {@const status = phaseStatus(g.items)}
                    <div class="timeline-phase-list-item {status === 'active' ? 'timeline-phase-list-item-active' : ''}">
                        <div
                            class="timeline-phase-dot {status === 'done' ? 'timeline-phase-dot-done' : ''} {status === 'active'
                                ? 'timeline-phase-dot-active'
                                : ''}"
                        ></div>
                        <span class="timeline-phase-name">{PHASE_LABELS[g.phase]}</span>
                        <span class="timeline-phase-count">{g.items.length}</span>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Now Card -->
        {#if currentPhase}
            <div class="timeline-sidebar-card timeline-sidebar-card-tinted-peri">
                <div style="font-family: var(--font-display); font-size: 22px; font-weight: 500; margin-bottom: 4px;">Now</div>
                <div class="timeline-sidebar-label">{PHASE_LABELS[currentPhase.phase]}</div>
                <p style="font-size: 12px; color: var(--ink-2); margin-top: 8px;">{PHASE_DESCRIPTIONS[currentPhase.phase]}</p>
            </div>
        {/if}
    </div>
</div>

{#if editingMilestone}
    {@const milestone = data.milestones.find((m) => m.id === editingMilestone?.id)}
    {#if milestone}
        <MilestoneModal
            mode="edit"
            open={true}
            onClose={async () => {
                await updateUrl(null);
            }}
            action="?/update"
            onenhance={({ formData, cancel }: { formData: FormData; cancel: () => void }) => {
                return async () => {
                    const response = await fetch('?/update', { method: 'POST', body: formData });
                    if (response.ok) {
                        await invalidateAll();
                        showSuccessToast('Milestone updated successfully');
                    } else {
                        cancel();
                    }
                };
            }}
            initial={{
                id: milestone.id,
                title: milestone.title,
                description: milestone.description,
                phase: milestone.phase,
                status: milestone.status,
                priority: milestone.priority,
                dueDate: milestone.dueDate,
                scheduledAt: milestone.scheduledAt,
                notes: (milestone as { notes?: string }).notes,
                subTasks: milestone.subTasks,
                location: (milestone as MilestoneItem).location
            }}
            error={form?.error}
            errorId={form?.errorId}
        />
    {/if}
{/if}

{#if showCreateModal}
    <MilestoneModal
        mode="create"
        open={true}
        onClose={() => {
            showCreateModal = false;
            defaultPhase = undefined;
        }}
        action="?/create"
        {defaultPhase}
        error={form?.error}
        errorId={form?.errorId}
        onenhance={() => {
            return async ({ result }: { result: { type: string } }) => {
                if (result.type === 'success') {
                    showCreateModal = false;
                    defaultPhase = undefined;
                }
            };
        }}
    />
{/if}
