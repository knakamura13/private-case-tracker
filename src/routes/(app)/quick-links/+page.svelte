<script lang="ts">
    import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Label from '$lib/components/ui/Label.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import ThreeDotsMenu from '$lib/components/ui/ThreeDotsMenu.svelte';
    import { Plus, Folder, Link2, Edit, Trash2 } from 'lucide-svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // Replicating logic from QuickLinksWidget to display structure
    const rootLinks = $derived(data.quickLinks.filter((l) => !l.folderId));
    const folders = $derived(data.quickLinkFolders.sort((a, b) => a.order - b.order));

    let modalOpen = $state(false);
    let modalMode = $state<'link' | 'folder'>('link');
    let editing = $state<QuickLink | null>(null);
    let editingFolder = $state<QuickLinkFolder | null>(null);
    let draftUrl = $state('');
    let draftTitle = $state('');
    let draftDescription = $state('');
    let draftFolderName = $state('');
    let deleteModalOpen = $state(false);
    let itemToDelete = $state<{ type: 'link' | 'folder'; id: string; name: string } | null>(null);

    function openAdd() {
        modalMode = 'link';
        editing = null;
        editingFolder = null;
        draftUrl = '';
        draftTitle = '';
        draftDescription = '';
        draftFolderName = '';
        modalOpen = true;
    }

    function openEditLink(link: QuickLink) {
        modalMode = 'link';
        editing = link;
        editingFolder = null;
        draftUrl = link.url;
        draftTitle = link.title ?? '';
        draftDescription = link.description ?? '';
        draftFolderName = '';
        modalOpen = true;
    }

    function openEditFolder(folder: QuickLinkFolder) {
        modalMode = 'folder';
        editing = null;
        editingFolder = folder;
        draftUrl = '';
        draftTitle = '';
        draftDescription = '';
        draftFolderName = folder.name ?? '';
        modalOpen = true;
    }

    function openDelete(type: 'link' | 'folder', id: string, name: string) {
        itemToDelete = { type, id, name };
        deleteModalOpen = true;
    }

    function closeModal() {
        modalOpen = false;
    }

    function closeDeleteModal() {
        deleteModalOpen = false;
        itemToDelete = null;
    }
</script>

<PageHeader title="Quick links" sub="Access your most-used resources and documents." number={getPageNumber('/quick-links')}>
    {#snippet actions()}
        <Button variant="ghost" onclick={() => openAdd()}><Plus style="width: 14px; height: 14px;" /> Add link</Button>
    {/snippet}
</PageHeader>

<div
    style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px; padding: 24px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-lg);"
>
    {#each folders as folder}
        <div
            class="widget-item relative group"
            style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; background: none; border: none; padding: 0; position: relative;"
        >
            <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[1000] pointer-events-none">
                <div class="pointer-events-auto">
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
            <button
                style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; background: none; border: none; padding: 0;"
                onclick={() => console.log('Open folder:', folder.id)}
            >
                <div
                    class="folder-icon"
                    style="width: 64px; height: 64px; background: var(--lilac); border: 1px solid var(--lilac-d); border-radius: 16px; display: flex; align-items: center; justify-content: center;"
                >
                    <Folder style="width: 32px; height: 32px; color: var(--lilac-d);" />
                </div>
                <span style="font-size: 13px; font-weight: 500;">{folder.name}</span>
            </button>
        </div>
    {/each}

    {#each rootLinks as link}
        <div
            class="widget-item relative group"
            style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; background: none; border: none; padding: 0; position: relative;"
        >
            <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[1000] pointer-events-none">
                <div class="pointer-events-auto">
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
            <button
                style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; background: none; border: none; padding: 0;"
                onclick={() => window.open(link.url, '_blank')}
            >
                <div
                    class="link-icon"
                    style="width: 64px; height: 64px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 16px; display: flex; align-items: center; justify-content: center;"
                >
                    <Link2 style="width: 32px; height: 32px; color: var(--ink-3);" />
                </div>
                <span style="font-size: 13px; font-weight: 500;">{link.title ?? 'Link'}</span>
            </button>
        </div>
    {/each}

    <button
        class="widget-item"
        style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; background: none; border: none; padding: 0;"
        onclick={() => openAdd()}
    >
        <div
            class="add-link-icon"
            style="width: 64px; height: 64px; background: var(--surface-3); border: 1px dashed var(--hairline); border-radius: 16px; display: flex; align-items: center; justify-content: center;"
        >
            <Plus style="width: 32px; height: 32px; color: var(--ink-4);" />
        </div>
        <span class="add-link-text" style="font-size: 13px; font-weight: 500; color: var(--ink-3);">Add link</span>
    </button>
</div>

{#if modalOpen && modalMode === 'folder'}
    <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="max-w-md"
        titleLevel="h3"
        title={editingFolder ? 'Edit folder' : 'Add folder'}
        footerFormId="ql-page-folder-form"
        cancelLabel="Cancel"
        submitLabel={editingFolder ? 'Save' : 'Create'}
    >
        <form
            id="ql-page-folder-form"
            method="post"
            action="?/updateFolder"
            class="modal-form"
            use:enhance={() => {
                return async ({ result, update }) => {
                    await update();
                    if (result.type === 'redirect') closeModal();
                };
            }}
        >
            <input type="hidden" name="id" value={editingFolder?.id} />
            <Input name="name" bind:value={draftFolderName} placeholder="Folder name" required />
        </form>
    </Dialog>
{:else if modalOpen}
    <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="max-w-md"
        titleLevel="h3"
        title={editing ? 'Edit link' : 'Add link'}
        footerFormId="ql-page-link-form"
        cancelLabel="Cancel"
        submitLabel={editing ? 'Save' : 'Add'}
    >
        <form
            id="ql-page-link-form"
            method="post"
            action={editing ? '?/update' : '?/create'}
            class="modal-form"
            use:enhance={() => {
                return async ({ result, update }) => {
                    await update();
                    if (result.type === 'redirect') closeModal();
                };
            }}
        >
            {#if editing}
                <input type="hidden" name="id" value={editing.id} />
            {/if}
            <Input name="url" bind:value={draftUrl} placeholder="URL" required />
            <div>
                <Label for="ql-title">Title (optional)</Label>
                <Input id="ql-title" name="title" bind:value={draftTitle} placeholder="Link title" />
            </div>
            <div>
                <Label for="ql-description">Description (optional)</Label>
                <Textarea id="ql-description" name="description" rows={2} bind:value={draftDescription} />
            </div>
        </form>
    </Dialog>
{/if}

{#if deleteModalOpen && itemToDelete}
    <Dialog
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        maxWidth="max-w-md"
        titleLevel="h3"
        title={`Delete ${itemToDelete.type}`}
        footerFormId="ql-page-delete-form"
        cancelLabel="Cancel"
        submitLabel="Delete"
        submitVariant="destructive"
    >
        <form
            id="ql-page-delete-form"
            method="post"
            action={itemToDelete.type === 'folder' ? '?/deleteFolder' : '?/delete'}
            class="modal-form"
            use:enhance={() => {
                return async ({ result, update }) => {
                    await update();
                    if (result.type === 'redirect') closeDeleteModal();
                };
            }}
        >
            <input type="hidden" name="id" value={itemToDelete.id} />
            <p>Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.</p>
            {#if itemToDelete.type === 'folder' && data.quickLinks.some((link) => link.folderId === itemToDelete?.id)}
                <p style="color: var(--destructive); font-weight: 500;">Warning: This folder contains links that will also be deleted.</p>
            {/if}
        </form>
    </Dialog>
{/if}
