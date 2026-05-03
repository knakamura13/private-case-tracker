<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import { fmtDateTime } from '$lib/utils/dates';
    import { titleCase } from '$lib/utils/format';
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Activity" sub="Internal audit feed for this workspace." />
<Card class="settings-activity-p-0">
    <ul class="settings-activity-list">
        {#each data.items as a (a.id)}
            <li class="settings-activity-item">
                <div class="settings-activity-header">
                    <p class="settings-activity-summary">{a.summary}</p>
                    <span class="settings-activity-text-xs settings-activity-text-muted">{fmtDateTime(a.createdAt)}</span>
                </div>
                <p class="settings-activity-meta">
                    {titleCase(a.action)} on {a.entityType} · {a.user?.name ?? a.user?.email ?? 'system'}
                </p>
            </li>
        {:else}
            <li class="settings-activity-empty">No activity yet.</li>
        {/each}
    </ul>
</Card>
