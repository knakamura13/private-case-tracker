<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { Plus, Folder, Link2 } from 'lucide-svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // Replicating logic from QuickLinksWidget to display structure
    const rootLinks = $derived(data.quickLinks.filter(l => !l.folderId));
    const folders = $derived(data.quickLinkFolders.sort((a, b) => a.order - b.order));
</script>

<PageHeader 
    title="Quick links" 
    sub="Access your most-used resources and documents." 
    number={getPageNumber('/quick-links')} 
>
    {#snippet actions()}
        <Button variant="ghost"><Plus style="width: 14px; height: 14px;" /> Add link</Button>
    {/snippet}
</PageHeader>

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px; padding: 24px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-lg);">
    {#each folders as folder}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;">
            <div style="width: 64px; height: 64px; background: var(--lilac); border: 1px solid var(--lilac-d); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <Folder style="width: 32px; height: 32px; color: var(--lilac-d);" />
            </div>
            <span style="font-size: 13px; font-weight: 500;">{folder.name}</span>
        </div>
    {/each}

    {#each rootLinks as link}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;">
            <div style="width: 64px; height: 64px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <Link2 style="width: 32px; height: 32px; color: var(--ink-3);" />
            </div>
            <span style="font-size: 13px; font-weight: 500;">{link.title ?? 'Link'}</span>
        </div>
    {/each}

    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;">
        <div style="width: 64px; height: 64px; background: var(--surface-3); border: 1px dashed var(--hairline); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            <Plus style="width: 32px; height: 32px; color: var(--ink-4);" />
        </div>
        <span style="font-size: 13px; font-weight: 500; color: var(--ink-3);">Add link</span>
    </div>
</div>
