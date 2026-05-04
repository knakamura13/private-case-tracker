<script lang="ts">
    import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
    import { invalidateAll } from '$app/navigation';
    import { Plus, Link2, Folder, Edit, Trash2, CornerUpLeft } from 'lucide-svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import QuickLinksManageDialog from '$lib/components/dashboard/QuickLinksManageDialog.svelte';
    import ThreeDotsMenu from '$lib/components/ui/ThreeDotsMenu.svelte';

    type ActionForm = { error?: string; errorId?: string | null } | undefined;

    let { links, folders = [], form }: { links: QuickLink[]; folders: QuickLinkFolder[]; form?: ActionForm } = $props();

    let qlDialog = $state<QuickLinksManageDialog | null>(null);
    let folderPopoverId = $state<string | null>(null);
    let brokenFavicons = $state<Set<string>>(new Set());
    let preloadedFavicons = $state<Set<string>>(new Set());
    let draggingId = $state<string | null>(null);
    let dragEnterCount = $state(0);
    let isDragging = $state(false);
    let optimisticFolders = $state<QuickLinkFolder[]>([]);
    let liveRegionMessage = $state<string>('');

    let visibleFolders = $derived([...folders, ...optimisticFolders].sort((a, b) => a.order - b.order));

    // Separate root links and folder links
    let rootLinks = $derived(links.filter((l) => !l.folderId));
    let folderLinksMap = $derived(
        visibleFolders.reduce(
            (acc, f) => {
                acc[f.id] = links.filter((l) => l.folderId === f.id);
                return acc;
            },
            {} as Record<string, QuickLink[]>
        )
    );

    // Combine folders and root links for drag context
    let allItems = $derived([...visibleFolders, ...rootLinks]);
    let itemIds = $derived(allItems.map((item) => item.id));

    const faviconCache = new Map<string, string>();
    const fallbackFaviconCache = new Map<string, string>();

    function prettyHostname(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Link';
        }
    }

    function faviconForLink(link: QuickLink): string {
        // Use cached faviconUrl from database if available
        if (link.faviconUrl) return link.faviconUrl;

        // Check cache first
        if (faviconCache.has(link.url)) {
            return faviconCache.get(link.url) || '';
        }

        // Fallback to direct domain favicon (no placeholders)
        try {
            const h = new URL(link.url).hostname;
            // Skip localhost and internal domains
            if (/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(h)) {
                faviconCache.set(link.url, ''); // Cache empty string for internal domains
                return '';
            }
            const faviconUrl = `https://${h}/favicon.ico`;
            faviconCache.set(link.url, faviconUrl); // Cache the URL
            return faviconUrl;
        } catch {
            faviconCache.set(link.url, ''); // Cache empty string on error
            return '';
        }
    }

    function getFallbackFavicon(link: QuickLink): string {
        // Check fallback cache
        if (fallbackFaviconCache.has(link.url)) {
            return fallbackFaviconCache.get(link.url) || '';
        }

        try {
            const h = new URL(link.url).hostname;
            if (/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(h)) {
                fallbackFaviconCache.set(link.url, '');
                return '';
            }
            const fallbackUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=128`;
            fallbackFaviconCache.set(link.url, fallbackUrl);
            return fallbackUrl;
        } catch {
            fallbackFaviconCache.set(link.url, '');
            return '';
        }
    }

    // Preload all favicons to prevent flickering
    $effect(() => {
        const allLinks = [...links];
        const imageElements: HTMLImageElement[] = [];

        const preloadPromises = allLinks.map((link) => {
            // Skip if already processed
            if (preloadedFavicons.has(link.id) || brokenFavicons.has(link.id)) {
                return Promise.resolve();
            }

            const url = faviconForLink(link);
            if (!url) return Promise.resolve();

            return new Promise<void>((resolve) => {
                const img = new Image();
                imageElements.push(img);
                img.onload = () => {
                    const next = new Set(preloadedFavicons);
                    next.add(link.id);
                    preloadedFavicons = next;
                    resolve();
                };
                img.onerror = () => {
                    // Try fallback favicon if direct fails
                    const fallbackUrl = getFallbackFavicon(link);
                    if (fallbackUrl) {
                        const fallbackImg = new Image();
                        imageElements.push(fallbackImg);
                        fallbackImg.onload = () => {
                            const next = new Set(preloadedFavicons);
                            next.add(link.id);
                            preloadedFavicons = next;
                            resolve();
                        };
                        fallbackImg.onerror = () => {
                            const next = new Set(brokenFavicons);
                            next.add(link.id);
                            brokenFavicons = next;
                            resolve();
                        };
                        fallbackImg.src = fallbackUrl;
                    } else {
                        const next = new Set(brokenFavicons);
                        next.add(link.id);
                        brokenFavicons = next;
                        resolve();
                    }
                };
                img.src = url;
            });
        });
        // Don't await - let preloading happen in background
        void Promise.all(preloadPromises);

        // Cleanup: abort image loading on effect rerun or unmount
        return () => {
            imageElements.forEach((img) => {
                img.src = '';
                img.onload = null;
                img.onerror = null;
            });
        };
    });

    function labelFor(link: QuickLink) {
        return link.title?.trim() ? link.title : prettyHostname(link.url);
    }

    function openLink(url: string) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function openAdd(folder?: QuickLinkFolder) {
        qlDialog?.openAddLink(folder ?? null);
    }

    function openEdit(link: QuickLink) {
        qlDialog?.openEditLink(link);
    }

    function openEditFolder(folder: QuickLinkFolder) {
        qlDialog?.openEditFolder(folder);
    }

    function closeFolderDialog() {
        folderPopoverId = null;
    }

    function toggleFolderPopover(folderId: string, e: Event) {
        e.preventDefault();
        e.stopPropagation();
        if (folderPopoverId === folderId) {
            closeFolderDialog();
        } else {
            folderPopoverId = folderId;
        }
    }

    function handleDragStart(event: DragEvent, id: string) {
        if (isDragging) return; // Prevent concurrent drag operations
        isDragging = true; // Set immediately to prevent race condition
        dragEnterCount = 0;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', id);
            event.dataTransfer.setData('application/x-quicklink-id', id);
        }
        // Hide element after browser captures drag ghost image
        setTimeout(() => {
            draggingId = id;
        }, 0);
    }

    function handleDragEnd() {
        draggingId = null;
        dragEnterCount = 0;
        isDragging = false;
    }

    function handleDragEnter(event: DragEvent, _id: string) {
        event.preventDefault();
        dragEnterCount++;
    }

    function handleDragLeave() {
        dragEnterCount--;
        if (dragEnterCount <= 0) {
            dragEnterCount = 0;
        }
    }

    function handleDragOver(event: DragEvent, _id: string) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    async function handleDrop(event: DragEvent, targetId: string) {
        event.preventDefault();
        const activeId = draggingId;
        // Reset immediately so UI clears
        draggingId = null;
        dragEnterCount = 0;
        isDragging = false;
        if (!activeId || activeId === targetId) return;

        const activeLink = links.find((l) => l.id === activeId);
        const targetLink = links.find((l) => l.id === targetId);
        const targetFolder = visibleFolders.find((f) => f.id === targetId);

        try {
            // 1. Drop a root link onto another root link → create folder with both
            if (activeLink && targetLink && !activeLink.folderId && !targetLink.folderId) {
                const response = await fetch('/dashboard/api/quick-link-folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: '' })
                });
                if (!response.ok) {
                    console.error('Failed to create folder:', response.statusText);
                    return;
                }
                const folder = await response.json();

                if (folder?.id) {
                    try {
                        await Promise.all([moveLinkToFolderAction(activeId, folder.id), moveLinkToFolderAction(targetId, folder.id)]);
                        await invalidateAll();
                    } catch (error) {
                        console.error('Failed to move links to folder:', error);
                        throw error; // Re-throw to be caught by outer try/catch
                    }
                }
                return;
            }

            // 2. Drop a link onto a folder → move link into that folder
            if (activeLink && targetFolder) {
                await moveLinkToFolderAction(activeId, targetFolder.id);
                await invalidateAll();
                return;
            }

            // 3. Reorder (folders and root links share the same order)
            const oldIndex = itemIds.indexOf(activeId);
            const newIndex = itemIds.indexOf(targetId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newOrder = [...itemIds];
                newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, activeId);

                const isFolderDrag = visibleFolders.some((f) => f.id === activeId);
                const formData = new FormData();
                if (isFolderDrag) {
                    newOrder.filter((id) => visibleFolders.some((f) => f.id === id)).forEach((id) => formData.append('folderIds', id));
                    const response = await fetch('?/reorderFolders', { method: 'POST', body: formData });
                    if (!response.ok) {
                        console.error('Failed to reorder folders:', response.statusText);
                        return;
                    }
                } else {
                    newOrder.filter((id) => rootLinks.some((l) => l.id === id)).forEach((id) => formData.append('linkIds', id));
                    const response = await fetch('?/reorderLinks', { method: 'POST', body: formData });
                    if (!response.ok) {
                        console.error('Failed to reorder links:', response.statusText);
                        return;
                    }
                }
                await invalidateAll();
            }
        } catch (error) {
            console.error('Drag operation failed:', error);
        }
    }

    async function moveLinkToFolderAction(linkId: string, folderId: string | null) {
        const formData = new FormData();
        formData.append('linkId', linkId);
        if (folderId) formData.append('folderId', folderId);
        const response = await fetch('?/moveToFolder', { method: 'POST', body: formData });
        if (!response.ok) {
            console.error('Failed to move link to folder:', response.statusText);
            throw new Error('Failed to move link');
        }
    }

    async function moveLinkToRoot(linkId: string) {
        try {
            await moveLinkToFolderAction(linkId, null);
            await invalidateAll();
        } catch (error) {
            console.error('Failed to move link to root:', error);
        }
    }

    async function handleItemKeydown(event: KeyboardEvent, itemId: string) {
        if (!event.altKey) return;

        const currentIndex = itemIds.indexOf(itemId);
        if (currentIndex === -1) return;

        const itemsPerRow = Math.max(1, Math.floor(window.innerWidth / 96)); // 80px + 16px gap
        const maxIndex = itemIds.length - 1;
        let nextIndex = currentIndex;

        switch (event.key) {
            case 'ArrowRight': {
                event.preventDefault();
                nextIndex = Math.min(currentIndex + 1, maxIndex);
                break;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                nextIndex = Math.max(currentIndex - 1, 0);
                break;
            }
            case 'ArrowDown': {
                event.preventDefault();
                nextIndex = Math.min(currentIndex + itemsPerRow, maxIndex);
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                nextIndex = Math.max(currentIndex - itemsPerRow, 0);
                break;
            }
            default:
                return;
        }

        if (nextIndex === currentIndex) return;

        const isFolder = visibleFolders.some((f) => f.id === itemId);
        const itemLabel = isFolder
            ? visibleFolders.find((f) => f.id === itemId)?.name || 'Folder'
            : labelFor(links.find((l) => l.id === itemId)!) || 'Link';

        try {
            const oldIndex = itemIds.indexOf(itemId);
            const newOrder = [...itemIds];
            newOrder.splice(oldIndex, 1);
            newOrder.splice(nextIndex, 0, itemId);

            const isFolderDrag = visibleFolders.some((f) => f.id === itemId);
            const formData = new FormData();
            if (isFolderDrag) {
                newOrder.filter((id) => visibleFolders.some((f) => f.id === id)).forEach((id) => formData.append('folderIds', id));
                const response = await fetch('?/reorderFolders', { method: 'POST', body: formData });
                if (!response.ok) {
                    console.error('Failed to reorder folders:', response.statusText);
                    return;
                }
            } else {
                newOrder.filter((id) => rootLinks.some((l) => l.id === id)).forEach((id) => formData.append('linkIds', id));
                const response = await fetch('?/reorderLinks', { method: 'POST', body: formData });
                if (!response.ok) {
                    console.error('Failed to reorder links:', response.statusText);
                    return;
                }
            }

            liveRegionMessage = `Moved "${itemLabel}" to new position`;
            await invalidateAll();
        } catch (error) {
            console.error('Keyboard operation failed:', error);
        }
    }
</script>

<div aria-live="polite" aria-atomic="true" class="sr-only">{liveRegionMessage}</div>

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 16px; padding: 12px 0;">
    {#each visibleFolders as folder (folder.id)}
        {@const folderLinks = folderLinksMap[folder.id] ?? []}
        <div
            class="widget-item widget-item--dash-ql"
            role="group"
            aria-label={folder.name ? `Folder: ${folder.name}` : 'Folder'}
            style="display: flex; flex-direction: column; align-items: center; gap: 8px;"
            draggable={true}
            ondragstart={(e) => handleDragStart(e, folder.id)}
            ondragenter={(e) => handleDragEnter(e, folder.id)}
            ondragover={(e) => handleDragOver(e, folder.id)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, folder.id)}
            ondragend={handleDragEnd}
            onkeydown={(e) => handleItemKeydown(e, folder.id)}
            tabindex="0"
        >
            <div class="widget-item-menu-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
                <div class="widget-item-menu-inner">
                    <ThreeDotsMenu
                        menuId={`qlw-grid-folder-${folder.id}`}
                        items={[
                            {
                                label: 'Edit',
                                icon: Edit,
                                action: () => openEditFolder(folder)
                            },
                            {
                                label: 'Delete',
                                icon: Trash2,
                                variant: 'destructive',
                                action: () => qlDialog?.openDelete('folder', folder.id, folder.name || 'Untitled folder')
                            }
                        ]}
                    />
                </div>
            </div>
            <button
                type="button"
                style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; background: none; border: none; padding: 0;"
                onclick={(e) => toggleFolderPopover(folder.id, e)}
                onkeydown={(e) => e.key === 'Enter' && toggleFolderPopover(folder.id, e)}
            >
                <div
                    style="width: 48px; height: 48px; background: var(--lilac); border: 1px solid var(--lilac-d); border-radius: 12px; display: flex; align-items: center; justify-content: center; position: relative;"
                >
                    <Folder style="width: 24px; height: 24px; color: var(--lilac-d);" />
                    {#if folderLinks.length > 0}
                        <div
                            style="position: absolute; top: -4px; right: -4px; background: var(--lilac-d); color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--surface);"
                        >
                            {folderLinks.length}
                        </div>
                    {/if}
                </div>
                <span style="font-size: 11px; font-weight: 500; text-align: center;">{folder.name || 'Untitled'}</span>
            </button>
        </div>
    {/each}

    {#each rootLinks as link (link.id)}
        <div
            class="widget-item widget-item--dash-ql"
            role="group"
            aria-label={`Link: ${labelFor(link)}`}
            style="display: flex; flex-direction: column; align-items: center; gap: 8px;"
            draggable={true}
            ondragstart={(e) => handleDragStart(e, link.id)}
            ondragenter={(e) => handleDragEnter(e, link.id)}
            ondragover={(e) => handleDragOver(e, link.id)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, link.id)}
            ondragend={handleDragEnd}
            onkeydown={(e) => handleItemKeydown(e, link.id)}
            tabindex="0"
        >
            <div class="widget-item-menu-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
                <div class="widget-item-menu-inner">
                    <ThreeDotsMenu
                        menuId={`qlw-grid-link-${link.id}`}
                        items={[
                            {
                                label: 'Edit',
                                icon: Edit,
                                action: () => openEdit(link)
                            },
                            {
                                label: 'Delete',
                                icon: Trash2,
                                variant: 'destructive',
                                action: () => qlDialog?.openDelete('link', link.id, labelFor(link))
                            }
                        ]}
                    />
                </div>
            </div>
            <button
                type="button"
                style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; background: none; border: none; padding: 0;"
                onclick={() => openLink(link.url)}
            >
                <div
                    style="width: 48px; height: 48px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 12px; display: flex; align-items: center; justify-content: center;"
                >
                    {#if brokenFavicons.has(link.id) || !(link.faviconUrl || preloadedFavicons.has(link.id))}
                        <Link2 style="width: 24px; height: 24px; color: var(--ink-3);" />
                    {:else}
                        <img src={faviconForLink(link)} alt="" style="width: 24px; height: 24px; object-fit: contain;" />
                    {/if}
                </div>
                <span style="font-size: 11px; font-weight: 500; text-align: center;">{labelFor(link)}</span>
            </button>
        </div>
    {/each}

    <button
        type="button"
        class="add-link-button"
        style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; background: none; border: none;"
        onclick={() => openAdd()}
    >
        <div
            class="add-link-icon"
            style="width: 48px; height: 48px; background: var(--surface-3); border: 1px dashed var(--hairline); border-radius: 12px; display: flex; align-items: center; justify-content: center;"
        >
            <Plus style="width: 24px; height: 24px; color: var(--ink-4);" />
        </div>
        <span style="font-size: 11px; font-weight: 500; color: var(--ink-3);">Add link</span>
    </button>

    <button
        type="button"
        class="add-folder-button"
        style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; background: none; border: none;"
        onclick={() => qlDialog?.openAddFolder()}
    >
        <div
            class="add-folder-icon"
            style="width: 48px; height: 48px; background: var(--lilac); border: 1px dashed var(--lilac-d); border-radius: 12px; display: flex; align-items: center; justify-content: center;"
        >
            <Folder style="width: 24px; height: 24px; color: var(--lilac-d);" />
        </div>
        <span style="font-size: 11px; font-weight: 500; color: var(--lilac-d);">Add folder</span>
    </button>
</div>

{#if folderPopoverId}
    {@const folder = visibleFolders.find((f) => f.id === folderPopoverId)}
    {@const folderLinks = folderLinksMap[folderPopoverId as keyof typeof folderLinksMap] ?? []}
    {#snippet qlFolderPopoverHeader()}
        <div style="display: flex; align-items: center; gap: 12px;">
            <div
                style="width: 32px; height: 32px; background: var(--lilac); border-radius: 8px; display: flex; align-items: center; justify-content: center;"
            >
                <Folder style="width: 16px; height: 16px; color: var(--lilac-d);" />
            </div>
            <h3 class="display" style="font-size: 20px; margin: 0;">{folder?.name || 'Untitled Folder'}</h3>
        </div>
    {/snippet}
    {#snippet qlFolderPopoverActions()}
        {#if folder}
            <ThreeDotsMenu
                menuId={`qlw-folder-${folder.id}`}
                items={[
                    {
                        label: 'Edit',
                        icon: Edit,
                        action: () => openEditFolder(folder)
                    },
                    {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'destructive',
                        action: () => qlDialog?.openDelete('folder', folder.id, folder.name || 'Untitled folder')
                    }
                ]}
            />
        {/if}
    {/snippet}
    {#snippet qlFolderPopoverFooter()}
        <Button variant="outline" style="width: 100%;" onclick={() => folder && openAdd(folder)}>
            <Plus size={16} style="margin-right: 8px;" /> Add link to folder
        </Button>
    {/snippet}
    <Dialog
        open={!!folderPopoverId}
        onClose={closeFolderDialog}
        contentWidth="md"
        ariaLabel={folder?.name ? `Folder ${folder.name}` : 'Folder'}
        titleLevel="h3"
        header={qlFolderPopoverHeader}
        headerActions={qlFolderPopoverActions}
        footer={qlFolderPopoverFooter}
    >
        {#each folderLinks as link}
            <div
                class="card"
                style="padding: 12px; display: flex; align-items: center; justify-content: space-between; background: var(--surface-2); border-color: transparent;"
            >
                <div
                    style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; min-width: 0;"
                    onclick={() => openLink(link.url)}
                    onkeydown={(e) => e.key === 'Enter' && openLink(link.url)}
                    role="button"
                    tabindex="0"
                >
                    <div
                        style="width: 32px; height: 32px; background: var(--surface); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                    >
                        {#if brokenFavicons.has(link.id) || !(link.faviconUrl || preloadedFavicons.has(link.id))}
                            <Link2 style="width: 16px; height: 16px; color: var(--ink-3);" />
                        {:else}
                            <img src={faviconForLink(link)} alt="" style="width: 16px; height: 16px; object-fit: contain;" />
                        {/if}
                    </div>
                    <span style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                        >{labelFor(link)}</span
                    >
                </div>
                <ThreeDotsMenu
                    menuId={`qlw-folder-link-${link.id}`}
                    items={[
                        {
                            label: 'Move to root',
                            icon: CornerUpLeft,
                            action: () => moveLinkToRoot(link.id)
                        },
                        {
                            label: 'Edit',
                            icon: Edit,
                            action: () => openEdit(link)
                        },
                        {
                            label: 'Delete',
                            icon: Trash2,
                            variant: 'destructive',
                            action: () => qlDialog?.openDelete('link', link.id, labelFor(link))
                        }
                    ]}
                />
            </div>
        {/each}
        {#if folderLinks.length === 0}
            <div style="text-align: center; color: var(--ink-3); font-size: 13px;">This folder is empty.</div>
        {/if}
    </Dialog>
{/if}

<QuickLinksManageDialog bind:this={qlDialog} {links} {form} enableDeleteDialog={true} />

<style>
    .add-link-button {
        transition: transform 0.2s ease;
        padding: 0;
    }

    .add-link-button:hover {
        transform: scale(1.05);
    }

    .add-link-icon {
        transition:
            background 0.2s ease,
            border-color 0.2s ease;
    }

    .add-link-button:hover .add-link-icon {
        background: var(--surface-2);
        border-color: var(--ink-2);
    }

    .add-link-button:hover .add-link-icon :global(svg) {
        color: var(--ink-3);
    }

    .add-folder-button {
        transition: transform 0.2s ease;
        padding: 0;
    }

    .add-folder-button:hover {
        transform: scale(1.05);
    }

    .add-folder-icon {
        transition:
            background 0.2s ease,
            border-color 0.2s ease;
    }

    .add-folder-button:hover .add-folder-icon {
        background: var(--lilac-d);
        border-color: var(--lilac);
    }

    .add-folder-button:hover .add-folder-icon :global(svg) {
        color: white;
    }
</style>
