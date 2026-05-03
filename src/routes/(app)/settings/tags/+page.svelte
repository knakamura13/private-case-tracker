<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import { Tag } from 'lucide-svelte';
</script>

<PageHeader title="Tags" sub="Organize your tasks and evidence with labels." />

<div style="max-width: 880px;">
    <div class="card" style="padding: 32px; text-align: center;">
        <div
            style="width: 64px; height: 64px; border-radius: 50%; background: var(--surface-2); color: var(--ink-3); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;"
        >
            <Tag style="width: 32px; height: 32px;" />
        </div>
        <h2 class="display" style="font-size: 24px; margin-bottom: 12px;">Coming Soon</h2>
        <p style="font-size: 14px; color: var(--ink-2); max-width: 480px; margin: 0 auto 24px; line-height: 1.5;">
            Use the task, evidence, and note forms to add tags inline. A dedicated tag management dashboard is currently in development.
        </p>
        <div style="display: flex; gap: 8px; justify-content: center;">
            <span class="pill s-active">Priority</span>
            <span class="pill s-done">Finance</span>
            <span class="pill s-waiting">Legal</span>
            <span class="pill s-note">Personal</span>
        </div>
    </div>
</div>
