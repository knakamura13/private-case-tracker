<script lang="ts">
    import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import QuickLinksManageDialog from '$lib/components/dashboard/QuickLinksManageDialog.svelte';
    import ThreeDotsMenu from '$lib/components/ui/ThreeDotsMenu.svelte';
    import { Plus, Folder, Link2, Edit, Trash2 } from 'lucide-svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import type { PageData } from './$types';

    let { data, form }: { data: PageData; form?: { error?: string; errorId?: string | null } } = $props();

    let qlDialog = $state<QuickLinksManageDialog | null>(null);

    const rootLinks = $derived(data.quickLinks.filter((l) => !l.folderId));
    const folders = $derived(data.quickLinkFolders.sort((a, b) => a.order - b.order));

    function openAdd() {
        qlDialog?.openAddLink();
    }

    function openEditLink(link: QuickLink) {
        qlDialog?.openEditLink(link);
    }

    function openEditFolder(folder: QuickLinkFolder) {
        qlDialog?.openEditFolder(folder);
    }

    function openDelete(type: 'link' | 'folder', id: string, name: string) {
        qlDialog?.openDelete(type, id, name);
    }
</script>

<PageHeader title="Quick links" sub="Access your most-used resources and documents." number={getPageNumber('/quick-links')} />

<div class="links-grid">
    {#each folders as folder}
        <div class="widget-item">
            <div class="widget-item-menu-wrap">
                <div class="widget-item-menu-inner">
                    <ThreeDotsMenu
                        menuId="folder-{folder.id}"
                        items={[
                            {
                                label: 'Edit',
                                icon: Edit,
                                action: () => openEditFolder(folder)
                            },
                            {
                                label: 'Delete',
                                icon: Trash2,
                                action: () => openDelete('folder', folder.id, folder.name || 'Untitled folder'),
                                variant: 'destructive'
                            }
                        ]}
                    />
                </div>
            </div>
            <button class="widget-item-btn" onclick={() => console.log('Open folder:', folder.id)}>
                <div class="folder-icon">
                    <Folder style="width: 32px; height: 32px; color: var(--lilac-d);" />
                </div>
                <span class="item-label">{folder.name}</span>
            </button>
        </div>
    {/each}

    {#each rootLinks as link}
        <div class="widget-item">
            <div class="widget-item-menu-wrap">
                <div class="widget-item-menu-inner">
                    <ThreeDotsMenu
                        menuId="link-{link.id}"
                        items={[
                            {
                                label: 'Edit',
                                icon: Edit,
                                action: () => openEditLink(link)
                            },
                            {
                                label: 'Delete',
                                icon: Trash2,
                                action: () => openDelete('link', link.id, link.title || 'Link'),
                                variant: 'destructive'
                            }
                        ]}
                    />
                </div>
            </div>
            <button class="widget-item-btn" onclick={() => window.open(link.url, '_blank')}>
                <div class="link-icon">
                    <Link2 style="width: 32px; height: 32px; color: var(--ink-3);" />
                </div>
                <span class="item-label">{link.title ?? 'Link'}</span>
            </button>
        </div>
    {/each}

    <button class="widget-item widget-item-btn" onclick={() => openAdd()}>
        <div class="add-link-icon">
            <Plus style="width: 32px; height: 32px; color: var(--ink-4);" />
        </div>
        <span class="add-link-text">Add link</span>
    </button>

    <button class="widget-item widget-item-btn" onclick={() => qlDialog?.openAddFolder()}>
        <div class="add-folder-icon">
            <Folder style="width: 32px; height: 32px; color: var(--lilac-d);" />
        </div>
        <span class="add-folder-text">Add folder</span>
    </button>
</div>

<QuickLinksManageDialog bind:this={qlDialog} links={data.quickLinks} {form} />

<style>
    .links-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 24px;
        padding: 24px;
        background: var(--surface);
        border: 1px solid var(--hairline);
        border-radius: var(--r-lg);
    }
    .widget-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }
    .widget-item-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
    }
    .folder-icon {
        width: 64px;
        height: 64px;
        background: var(--lilac);
        border: 1px solid var(--lilac-d);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .link-icon {
        width: 64px;
        height: 64px;
        background: var(--surface-2);
        border: 1px solid var(--hairline);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .add-link-icon {
        width: 64px;
        height: 64px;
        background: var(--surface-3);
        border: 1px dashed var(--hairline);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .add-folder-icon {
        width: 64px;
        height: 64px;
        background: var(--lilac);
        border: 1px dashed var(--lilac-d);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .item-label {
        font-size: 13px;
        font-weight: 500;
    }
    .add-link-text {
        font-size: 13px;
        font-weight: 500;
        color: var(--ink-3);
    }
    .add-folder-text {
        font-size: 13px;
        font-weight: 500;
        color: var(--lilac-d);
    }
</style>
