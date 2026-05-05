<script lang="ts">
    import { flip } from 'svelte/animate';
    import { onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { invalidateAll } from '$app/navigation';
    import { showErrorToast } from '$lib/stores/toast';
    import { Folder, Link2, Plus, Edit, Trash2 } from 'lucide-svelte';
    import ThreeDotsMenu from '$lib/components/ui/ThreeDotsMenu.svelte';
    import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
    import { arraysEqual, clamp } from './quickLinkDrag';

    type Size = 'compact' | 'large';
    type DragKind = 'folder' | 'link';

    type Props = {
        links: QuickLink[];
        folders: QuickLinkFolder[];
        size: Size;
        onOpenLink: (link: QuickLink) => void;
        onOpenFolder?: (folder: QuickLinkFolder) => void;
        onOpenAddLink: () => void;
        onOpenAddFolder: () => void;
        onEditLink: (link: QuickLink) => void;
        onEditFolder: (folder: QuickLinkFolder) => void;
        onDeleteLink: (link: QuickLink) => void;
        onDeleteFolder: (folder: QuickLinkFolder) => void;
        onMoveToFolder: (linkId: string, folderId: string | null) => Promise<void>;
        onCreateFolderFromLinks: (activeId: string, targetId: string) => Promise<void>;
        onReorderLinks: (linkIds: string[]) => Promise<void>;
        onReorderFolders: (folderIds: string[]) => Promise<void>;
    };

    let {
        links,
        folders,
        size,
        onOpenLink,
        onOpenFolder,
        onOpenAddLink,
        onOpenAddFolder,
        onEditLink,
        onEditFolder,
        onDeleteLink,
        onDeleteFolder,
        onMoveToFolder,
        onCreateFolderFromLinks,
        onReorderLinks,
        onReorderFolders
    }: Props = $props();

    const tileSize = $derived(size === 'compact' ? 48 : 64);
    const gridMin = $derived(size === 'compact' ? 80 : 120);
    const gap = $derived(size === 'compact' ? 16 : 24);
    const labelSize = $derived(size === 'compact' ? 11 : 13);

    let folderOrder = $state<string[]>([]);
    let linkOrder = $state<string[]>([]);
    let dragState = $state<{
        id: string;
        kind: DragKind;
        offsetX: number;
        offsetY: number;
        width: number;
        height: number;
        left: number;
        top: number;
        gridLeft: number;
        gridTop: number;
        gridRight: number;
        gridBottom: number;
        item: QuickLink | QuickLinkFolder;
    } | null>(null);
    let wasDragging = $state(false);
    let liveRegionMessage = $state('');
    let brokenFavicons = $state<Set<string>>(new Set());
    let preloadedFavicons = $state<Set<string>>(new Set());

    const reorderTimeouts = new Map<DragKind, ReturnType<typeof setTimeout>>();
    const confirmedOrders = new Map<DragKind, string[]>();
    const saving = new Set<DragKind>();
    const dirtyWhileSaving = new Set<DragKind>();

    const faviconCache = new Map<string, string>();
    const fallbackFaviconCache = new Map<string, string>();

    $effect(() => {
        const nextFolderOrder = folders
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((folder) => folder.id);
        const nextLinkOrder = links
            .filter((link) => !link.folderId)
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((link) => link.id);
        if (folderOrder.length === 0) folderOrder = nextFolderOrder;
        if (linkOrder.length === 0) linkOrder = nextLinkOrder;
        confirmedOrders.set('folder', nextFolderOrder);
        confirmedOrders.set('link', nextLinkOrder);
    });

    function byId<T extends { id: string }>(items: T[]) {
        return new Map(items.map((item) => [item.id, item]));
    }

    const folderById = $derived(byId(folders));
    const linkById = $derived(byId(links));
    const rootLinks = $derived(
        linkOrder
            .map((id) => linkById.get(id))
            .filter((value): value is QuickLink => Boolean(value))
            .filter((value) => !value.folderId)
    );
    const visibleFolders = $derived(
        folderOrder.map((id) => folderById.get(id)).filter((value): value is QuickLinkFolder => Boolean(value))
    );
    const _folderLinksMap = $derived(
        visibleFolders.reduce(
            (acc, folder) => {
                acc[folder.id] = links.filter((link) => link.folderId === folder.id).sort((a, b) => a.order - b.order);
                return acc;
            },
            {} as Record<string, QuickLink[]>
        )
    );

    function prettyHostname(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Link';
        }
    }

    function labelFor(link: QuickLink) {
        return link.title?.trim() ? link.title : prettyHostname(link.url);
    }

    function faviconForLink(link: QuickLink): string {
        if (link.faviconUrl) return link.faviconUrl;
        if (faviconCache.has(link.url)) return faviconCache.get(link.url) || '';
        try {
            const h = new URL(link.url).hostname;
            if (/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(h)) {
                faviconCache.set(link.url, '');
                return '';
            }
            const faviconUrl = `https://${h}/favicon.ico`;
            faviconCache.set(link.url, faviconUrl);
            return faviconUrl;
        } catch {
            faviconCache.set(link.url, '');
            return '';
        }
    }

    function getFallbackFavicon(link: QuickLink): string {
        if (fallbackFaviconCache.has(link.url)) return fallbackFaviconCache.get(link.url) || '';
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

    $effect(() => {
        const imageElements: HTMLImageElement[] = [];
        const preloadPromises = links.map((link) => {
            if (preloadedFavicons.has(link.id) || brokenFavicons.has(link.id)) return Promise.resolve();
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
                    const fallbackUrl = getFallbackFavicon(link);
                    if (!fallbackUrl) {
                        const next = new Set(brokenFavicons);
                        next.add(link.id);
                        brokenFavicons = next;
                        resolve();
                        return;
                    }
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
                };
                img.src = url;
            });
        });
        void Promise.all(preloadPromises);
        return () => {
            imageElements.forEach((img) => {
                img.src = '';
                img.onload = null;
                img.onerror = null;
            });
        };
    });

    function clearDrag() {
        dragState = null;
        if (browser) {
            document.body.style.removeProperty('user-select');
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        }
        setTimeout(() => {
            wasDragging = false;
        }, 0);
    }

    function beginDrag(event: PointerEvent, id: string, kind: DragKind) {
        if (event.button !== 0) return;
        const tile = (event.currentTarget as HTMLElement).closest<HTMLElement>('.ql-item');
        const grid = tile?.closest<HTMLElement>('.ql-grid');
        if (!tile || !grid) return;
        event.preventDefault();
        event.stopPropagation();
        const tileRect = tile.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        const item = kind === 'folder' ? folderById.get(id) : linkById.get(id);
        if (!item) return;
        wasDragging = true;
        dragState = {
            id,
            kind,
            offsetX: event.clientX - tileRect.left,
            offsetY: event.clientY - tileRect.top,
            width: tileRect.width,
            height: tileRect.height,
            left: tileRect.left,
            top: tileRect.top,
            gridLeft: gridRect.left,
            gridTop: gridRect.top,
            gridRight: gridRect.right,
            gridBottom: gridRect.bottom,
            item
        };
        document.body.style.userSelect = 'none';
        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp, { passive: false });
    }

    function reorderLocal(kind: DragKind, orderedIds: string[]) {
        if (kind === 'folder') folderOrder = orderedIds;
        else linkOrder = orderedIds;
    }

    function orderedIds(kind: DragKind) {
        return kind === 'folder' ? folderOrder : linkOrder;
    }

    function otherItems(kind: DragKind, activeId: string) {
        return Array.from(document.querySelectorAll<HTMLElement>(`.ql-item[data-kind="${kind}"]:not([data-id="${activeId}"])`)).map(
            (node) => {
                const rect = node.getBoundingClientRect();
                return { id: node.dataset.id ?? '', midX: rect.left + rect.width / 2, midY: rect.top + rect.height / 2 };
            }
        );
    }

    function updateDrag(event: PointerEvent) {
        if (!dragState) return;
        dragState = {
            ...dragState,
            left: clamp(event.clientX - dragState.offsetX, dragState.gridLeft, dragState.gridRight - dragState.width),
            top: clamp(event.clientY - dragState.offsetY, dragState.gridTop, dragState.gridBottom - dragState.height)
        };
        const candidates = otherItems(dragState.kind, dragState.id);
        const target = candidates.find((item) => event.clientY < item.midY || event.clientX < item.midX) ?? candidates.at(-1);
        if (!target || target.id === dragState.id) return;
        const current = orderedIds(dragState.kind);
        const from = current.indexOf(dragState.id);
        const to = current.indexOf(target.id);
        if (from === -1 || to === -1 || from === to) return;
        const next = [...current];
        next.splice(from, 1);
        next.splice(to, 0, dragState.id);
        if (!arraysEqual(next, current)) reorderLocal(dragState.kind, next);
    }

    function handlePointerMove(event: PointerEvent) {
        event.preventDefault();
        updateDrag(event);
    }

    async function handlePointerUp(event: PointerEvent) {
        event.preventDefault();
        const active = dragState;
        clearDrag();
        if (!active) return;
        const targetNode = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('.ql-item');
        const targetId = targetNode?.dataset.id ?? null;
        const targetKind = targetNode?.dataset.kind as DragKind | undefined;
        if (active.kind === 'link' && targetId && targetId !== active.id) {
            const activeLink = links.find((link) => link.id === active.id && !link.folderId);
            if (activeLink && targetKind === 'folder') {
                await onMoveToFolder(active.id, targetId);
                await invalidateAll();
                return;
            }
            if (activeLink && targetKind === 'link') {
                const targetLink = links.find((link) => link.id === targetId && !link.folderId);
                if (targetLink) {
                    await onCreateFolderFromLinks(active.id, targetId);
                    await invalidateAll();
                    return;
                }
            }
        }
        const current = orderedIds(active.kind);
        const confirmed = confirmedOrders.get(active.kind) ?? [];
        if (arraysEqual(current, confirmed)) return;
        const timeoutKey = active.kind;
        const existing = reorderTimeouts.get(timeoutKey);
        if (existing) clearTimeout(existing);
        const timeout = setTimeout(async () => {
            reorderTimeouts.delete(timeoutKey);
            const latest = orderedIds(active.kind);
            const baseline = confirmedOrders.get(active.kind) ?? [];
            if (arraysEqual(latest, baseline)) return;
            if (saving.has(timeoutKey)) {
                dirtyWhileSaving.add(timeoutKey);
                return;
            }
            saving.add(timeoutKey);
            try {
                if (active.kind === 'folder') await onReorderFolders(latest);
                else await onReorderLinks(latest);
                confirmedOrders.set(timeoutKey, latest);
                liveRegionMessage = 'Order updated';
            } catch (error) {
                console.error(error);
                showErrorToast(`Failed to save ${active.kind} order`);
                await invalidateAll();
            } finally {
                saving.delete(timeoutKey);
                if (dirtyWhileSaving.has(timeoutKey)) {
                    dirtyWhileSaving.delete(timeoutKey);
                    void handlePointerUp(new PointerEvent('pointerup', { bubbles: false }));
                }
            }
        }, 550);
        reorderTimeouts.set(timeoutKey, timeout);
    }

    async function openFolder(folder: QuickLinkFolder) {
        onOpenFolder?.(folder);
    }

    onDestroy(() => clearDrag());
</script>

<div aria-live="polite" aria-atomic="true" class="sr-only">{liveRegionMessage}</div>

<div class="ql-grid" style={`grid-template-columns: repeat(auto-fill, minmax(${gridMin}px, 1fr)); gap: ${gap}px;`}>
    {#each visibleFolders as folder (folder.id)}
        <div class="ql-item {dragState?.id === folder.id ? 'ql-item-placeholder' : ''}" data-kind="folder" data-id={folder.id} animate:flip>
            <div class="widget-item-menu-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
                <div class="widget-item-menu-inner">
                    <ThreeDotsMenu
                        menuId={`ql-folder-${folder.id}`}
                        items={[
                            { label: 'Edit', icon: Edit, action: () => onEditFolder(folder) },
                            { label: 'Delete', icon: Trash2, variant: 'destructive', action: () => onDeleteFolder(folder) }
                        ]}
                    />
                </div>
            </div>
            <button
                type="button"
                class="ql-button"
                onclick={() => {
                    if (wasDragging) return;
                    openFolder(folder);
                }}
                onpointerdown={(e) => beginDrag(e, folder.id, 'folder')}
            >
                <div class="ql-icon ql-icon--folder" style={`width: ${tileSize}px; height: ${tileSize}px;`}>
                    <Folder
                        style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; color: var(--lilac-d);`}
                    />
                </div>
                <span class="ql-label" style={`font-size: ${labelSize}px;`}>{folder.name || 'Untitled'}</span>
            </button>
        </div>
    {/each}

    {#each rootLinks as link (link.id)}
        <div class="ql-item {dragState?.id === link.id ? 'ql-item-placeholder' : ''}" data-kind="link" data-id={link.id} animate:flip>
            <div class="widget-item-menu-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
                <div class="widget-item-menu-inner">
                    <ThreeDotsMenu
                        menuId={`ql-link-${link.id}`}
                        items={[
                            { label: 'Edit', icon: Edit, action: () => onEditLink(link) },
                            { label: 'Delete', icon: Trash2, variant: 'destructive', action: () => onDeleteLink(link) }
                        ]}
                    />
                </div>
            </div>
            <button
                type="button"
                class="ql-button"
                onclick={() => {
                    if (wasDragging) return;
                    onOpenLink(link);
                }}
                onpointerdown={(e) => beginDrag(e, link.id, 'link')}
            >
                <div class="ql-icon ql-icon--link" style={`width: ${tileSize}px; height: ${tileSize}px;`}>
                    {#if brokenFavicons.has(link.id) || !(link.faviconUrl || preloadedFavicons.has(link.id))}
                        <Link2
                            style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; color: var(--ink-3);`}
                        />
                    {:else}
                        <img
                            src={faviconForLink(link)}
                            alt=""
                            style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; object-fit: contain;`}
                        />
                    {/if}
                </div>
                <span class="ql-label" style={`font-size: ${labelSize}px;`}>{labelFor(link)}</span>
            </button>
        </div>
    {/each}

    <button type="button" class="ql-item ql-button" onclick={onOpenAddLink}>
        <div class="ql-icon ql-icon--add-link" style={`width: ${tileSize}px; height: ${tileSize}px;`}>
            <Plus style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; color: var(--ink-4);`} />
        </div>
        <span class="ql-label ql-label--muted" style={`font-size: ${labelSize}px;`}>Add link</span>
    </button>

    <button type="button" class="ql-item ql-button" onclick={onOpenAddFolder}>
        <div class="ql-icon ql-icon--add-folder" style={`width: ${tileSize}px; height: ${tileSize}px;`}>
            <Folder style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; color: var(--lilac-d);`} />
        </div>
        <span class="ql-label ql-label--folder" style={`font-size: ${labelSize}px;`}>Add folder</span>
    </button>
</div>

{#if dragState}
    {@const item = dragState.item}
    <div
        class="ql-ghost"
        style={`left: ${dragState.left}px; top: ${dragState.top}px; width: ${dragState.width}px; height: ${dragState.height}px;`}
    >
        <div class="ql-ghost-card">
            <div class="ql-button" style="width: 100%; height: 100%;">
                <div
                    class="ql-icon {dragState.kind === 'folder' ? 'ql-icon--folder' : 'ql-icon--link'}"
                    style={`width: ${tileSize}px; height: ${tileSize}px;`}
                >
                    {#if dragState.kind === 'folder'}
                        <Folder
                            style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; color: var(--lilac-d);`}
                        />
                    {:else}
                        {@const link = item as QuickLink}
                        {#if brokenFavicons.has(link.id) || !(link.faviconUrl || preloadedFavicons.has(link.id))}
                            <Link2
                                style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; color: var(--ink-3);`}
                            />
                        {:else}
                            <img
                                src={faviconForLink(link)}
                                alt=""
                                style={`width: ${size === 'compact' ? 24 : 32}px; height: ${size === 'compact' ? 24 : 32}px; object-fit: contain;`}
                            />
                        {/if}
                    {/if}
                </div>
                <span class="ql-label" style={`font-size: ${labelSize}px;`}
                    >{dragState.kind === 'folder' ? (item as QuickLinkFolder).name || 'Untitled' : labelFor(item as QuickLink)}</span
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .ql-grid {
        display: grid;
        align-items: start;
        position: relative;
        padding: 12px 0;
    }
    .ql-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    .ql-item-placeholder {
        opacity: 0.22;
    }
    .ql-item-placeholder .widget-item-menu-wrap {
        visibility: hidden;
    }
    .ql-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    .ql-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
    }
    .ql-icon--folder,
    .ql-icon--add-folder {
        background: var(--lilac);
        border: 1px solid var(--lilac-d);
    }
    .ql-icon--link {
        background: var(--surface-2);
        border: 1px solid var(--hairline);
    }
    .ql-icon--add-link {
        background: var(--surface-3);
        border: 1px dashed var(--hairline);
    }
    .ql-label {
        text-align: center;
        font-weight: 500;
    }
    .ql-label--muted {
        color: var(--ink-3);
    }
    .ql-label--folder {
        color: var(--lilac-d);
    }
    .ql-ghost {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
    }
    .ql-ghost-card {
        width: 100%;
        height: 100%;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface);
        border: 1px solid var(--hairline);
        box-shadow: 0 18px 45px color-mix(in srgb, var(--ink-1) 18%, transparent);
    }
</style>
