<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import { page } from '$app/state';
    const user = $derived(page.data.user!);
    const workspace = $derived(page.data.workspace!);
</script>

<PageHeader title="Settings" sub="Manage members, case access, and security." number={getPageNumber('/settings')} />

<div class="card" style="max-width: 480px; padding: 24px;">
    <h2 class="display" style="font-size: 24px; margin-bottom: 20px;">Profile</h2>
    <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--ink-3);">Name</span>
            <span style="font-weight: 500;">{user.name ?? '—'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--ink-3);">Email</span>
            <span style="font-weight: 500;">{user.email}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--ink-3);">Workspace</span>
            <span style="font-weight: 500;">{workspace.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--ink-3);">Role</span>
            <span class="pill s-note" style="font-size: 10px;">{workspace.role}</span>
        </div>
    </div>
</div>
