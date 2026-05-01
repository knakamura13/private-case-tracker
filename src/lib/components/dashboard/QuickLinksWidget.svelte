<script lang="ts">
	import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { EllipsisVertical, MoreHorizontal, Plus, Link2, Folder, X } from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';

	type ActionForm = { error?: string; errorId?: string | null } | undefined;
	type DropIntent = 'reorder' | 'merge' | 'move-into';

	let { links, folders = [], form }: { links: QuickLink[]; folders: QuickLinkFolder[]; form?: ActionForm } = $props();

	let modalOpen = $state(false);
	let modalMode = $state<'link' | 'folder'>('link');
	let editing = $state<QuickLink | null>(null);
	let editingFolder = $state<QuickLinkFolder | null>(null);
	let addingToFolder = $state<QuickLinkFolder | null>(null);
	let draftUrl = $state('');
	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftFolderName = $state('');
	let menuOpenId = $state<string | null>(null);
	let folderPopoverId = $state<string | null>(null);
	let brokenFavicons = $state<Set<string>>(new Set());
	let preloadedFavicons = $state<Set<string>>(new Set());
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let dropIntent = $state<DropIntent | null>(null);
	let dragEnterCount = $state(0);
	let dropInsertIndex = $state<number | null>(null);
	let isDragging = $state(false);
	let menuPosition = $state<{ top: number; left: number } | null>(null);
	let optimisticFolders = $state<QuickLinkFolder[]>([]);
	let inlineEditingFolderId = $state<string | null>(null);
	let inlineFolderName = $state('');
	let inlineFolderInputEl = $state<HTMLInputElement | null>(null);
	let creatingFolder = $state(false);
	let folderDialogMenuOpen = $state(false);
	let folderDialogName = $state('');
	let folderDialogInputEl = $state<HTMLInputElement | null>(null);

	let visibleFolders = $derived(
		[...folders, ...optimisticFolders].sort((a, b) => a.order - b.order)
	);

	// Separate root links and folder links
	let rootLinks = $derived(links.filter((l) => !l.folderId));
	let folderLinksMap = $derived(
		visibleFolders.reduce((acc, f) => {
			acc[f.id] = links.filter((l) => l.folderId === f.id);
			return acc;
		}, {} as Record<string, QuickLink[]>)
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

	function handleLinkKeydown(event: KeyboardEvent, url: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openLink(url);
		}
	}

	function openAdd(folder?: QuickLinkFolder) {
		modalMode = 'link';
		editing = null;
		editingFolder = null;
		addingToFolder = folder ?? null;
		draftUrl = '';
		draftTitle = '';
		draftDescription = '';
		draftFolderName = '';
		modalOpen = true;
	}

	function openEdit(link: QuickLink) {
		modalMode = 'link';
		editing = link;
		editingFolder = null;
		draftUrl = link.url;
		draftTitle = link.title ?? '';
		draftDescription = link.description ?? '';
		draftFolderName = '';
		modalOpen = true;
		menuOpenId = null;
	}

	function openAddFolder() {
		void createFolderInline();
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
		menuOpenId = null;
	}

	function closeModal() {
		modalOpen = false;
	}

	function closeFolderDialog() {
		folderPopoverId = null;
		folderDialogMenuOpen = false;
	}

	$effect(() => {
		if (!inlineEditingFolderId || !inlineFolderInputEl) return;
		void tick().then(() => {
			inlineFolderInputEl?.focus();
			inlineFolderInputEl?.select();
		});
	});

	$effect(() => {
		if (!folderPopoverId || !folderDialogInputEl) return;
		void tick().then(() => {
			folderDialogInputEl?.focus();
			folderDialogInputEl?.select();
		});
	});

	async function createFolderInline() {
		if (creatingFolder) return;
		creatingFolder = true;
		try {
			const response = await fetch('/dashboard/api/quick-link-folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: '' })
			});
			if (!response.ok) {
				console.error('Failed to create folder:', response.statusText);
				return;
			}

			const folder = (await response.json()) as QuickLinkFolder;
			optimisticFolders = [...optimisticFolders, folder];
			inlineEditingFolderId = folder.id;
			inlineFolderName = '';
		} catch (error) {
			console.error('Failed to create folder:', error);
		} finally {
			creatingFolder = false;
		}
	}

	async function saveInlineFolderName(folderId: string) {
		const formData = new FormData();
		formData.append('id', folderId);
		formData.append('name', inlineFolderName);

		try {
			const response = await fetch('?/updateFolder', {
				method: 'POST',
				body: formData
			});
			if (!response.ok) {
				console.error('Failed to update folder:', response.statusText);
				return;
			}
			optimisticFolders = optimisticFolders.filter((folder) => folder.id !== folderId);
			inlineEditingFolderId = null;
			inlineFolderName = '';
			await invalidateAll();
		} catch (error) {
			console.error('Failed to update folder:', error);
		}
	}

	function cancelInlineFolderName() {
		inlineEditingFolderId = null;
		inlineFolderName = '';
	}

	function toggleMenu(id: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (menuOpenId === id) {
			menuOpenId = null;
			menuPosition = null;
		} else {
			menuOpenId = id;
			const target = e.currentTarget as HTMLElement;
			const rect = target.getBoundingClientRect();
			const dropdownHeight = 150; // Estimated dropdown height in pixels
			const spaceBelow = window.innerHeight - rect.bottom;
			
			// Flip dropdown to appear above if there's not enough space below
			const top = spaceBelow < dropdownHeight ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
			
			menuPosition = {
				top,
				left: rect.left + rect.width / 2
			};
		}
	}

	function toggleFolderPopover(folderId: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (folderPopoverId === folderId) {
			closeFolderDialog();
		} else {
			const folder = visibleFolders.find((f) => f.id === folderId);
			folderPopoverId = folderId;
			folderDialogName = folder?.name ?? '';
			folderDialogMenuOpen = false;
		}
		menuOpenId = null;
		menuPosition = null;
	}

	$effect(() => {
		if (menuOpenId === null && folderPopoverId === null) return;
		const onDoc = (e: MouseEvent) => {
			const t = e.target;
			if (!(t instanceof HTMLElement)) return;
			if (t.closest('[data-quicklink-menu]')) return;
			if (t.closest('[data-folder-popover="trigger"]')) return;
			if (t.closest('[data-folder-popover="panel"]') && !t.closest('[data-quicklink-menu="panel"]')) {
				menuOpenId = null;
				menuPosition = null;
				return;
			}
			menuOpenId = null;
			menuPosition = null;
			folderPopoverId = null;
		};
		document.addEventListener('click', onDoc, true);
		return () => document.removeEventListener('click', onDoc, true);
	});

	$effect(() => {
		if (menuOpenId === null && folderPopoverId === null) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				menuOpenId = null;
				menuPosition = null;
				folderPopoverId = null;
			}
		};
		document.addEventListener('keydown', onKey, true);
		return () => document.removeEventListener('keydown', onKey, true);
	});

	function handleDragStart(event: DragEvent, id: string) {
		if (isDragging) return; // Prevent concurrent drag operations
		isDragging = true; // Set immediately to prevent race condition
		dropTargetId = null;
		dropIntent = null;
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
		dropTargetId = null;
		dropIntent = null;
		dragEnterCount = 0;
		dropInsertIndex = null;
		isDragging = false;
	}

	function handleDragEnter(event: DragEvent, id: string) {
		event.preventDefault();
		dragEnterCount++;
		if (draggingId && draggingId !== id) {
			dropTargetId = id;
			// Determine drop intent based on what's being dragged and what it's over
			const activeLink = links.find((l) => l.id === draggingId);
			const targetLink = links.find((l) => l.id === id);
				const targetFolder = visibleFolders.find((f) => f.id === id);

			if (activeLink && targetLink && !activeLink.folderId && !targetLink.folderId) {
				dropIntent = 'merge';
			} else if (activeLink && targetFolder && !activeLink.folderId) {
				dropIntent = 'move-into';
			} else {
				dropIntent = 'reorder';
				// Calculate insert index for visual feedback
				const oldIndex = itemIds.indexOf(draggingId);
				const newIndex = itemIds.indexOf(id);
				dropInsertIndex = newIndex > oldIndex ? newIndex + 1 : newIndex;
			}
		}
	}

	function handleDragLeave() {
		dragEnterCount--;
		if (dragEnterCount <= 0) {
			dragEnterCount = 0;
			dropTargetId = null;
			dropIntent = null;
			dropInsertIndex = null;
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
		dropTargetId = null;
		dropIntent = null;
		dragEnterCount = 0;
		dropInsertIndex = null;
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
						await Promise.all([
							moveLinkToFolderAction(activeId, folder.id),
							moveLinkToFolderAction(targetId, folder.id)
						]);
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
						newOrder
							.filter((id) => visibleFolders.some((f) => f.id === id))
							.forEach((id) => formData.append('folderIds', id));
					const response = await fetch('?/reorderFolders', { method: 'POST', body: formData });
					if (!response.ok) {
						console.error('Failed to reorder folders:', response.statusText);
						return;
					}
				} else {
					newOrder
						.filter((id) => rootLinks.some((l) => l.id === id))
						.forEach((id) => formData.append('linkIds', id));
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

	async function deleteFolder(folderId: string) {
		if (!confirm('Delete this folder? Links will be moved to the root level.')) return;
		try {
			const formData = new FormData();
			formData.append('id', folderId);
			const response = await fetch('?/deleteFolder', { method: 'POST', body: formData });
			if (!response.ok) {
				console.error('Failed to delete folder:', response.statusText);
				return;
			}
			closeFolderDialog();
			await invalidateAll();
		} catch (error) {
			console.error('Failed to delete folder:', error);
		}
	}

	async function saveFolderDialogName(folder: QuickLinkFolder) {
		if (folderDialogName === (folder.name ?? '')) return;
		const formData = new FormData();
		formData.append('id', folder.id);
		formData.append('name', folderDialogName);

		try {
			const response = await fetch('?/updateFolder', {
				method: 'POST',
				body: formData
			});
			if (!response.ok) {
				console.error('Failed to update folder:', response.statusText);
				return;
			}
			await invalidateAll();
		} catch (error) {
			console.error('Failed to update folder:', error);
		}
	}
</script>

<!--
  Each tile: fixed width, flex-col, circle on top, label below.
  The ⋮ button is positioned relative to the circle span itself,
  so it doesn't push the circle down or affect alignment.
-->
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 16px; padding: 12px;">
	{#each visibleFolders as folder (folder.id)}
		{@const folderLinks = folderLinksMap[folder.id] ?? []}
		<div
			class="widget-item"
			style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer;"
            draggable={true}
			ondragstart={(e) => handleDragStart(e, folder.id)}
			ondragenter={(e) => handleDragEnter(e, folder.id)}
			ondragover={(e) => handleDragOver(e, folder.id)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, folder.id)}
			ondragend={handleDragEnd}
            onclick={(e) => toggleFolderPopover(folder.id, e)}
            role="button"
            tabindex="0"
		>
			<div style="width: 48px; height: 48px; background: var(--lilac); border: 1px solid var(--lilac-d); border-radius: 12px; display: flex; align-items: center; justify-content: center; position: relative;">
				<Folder style="width: 24px; height: 24px; color: var(--lilac-d);" />
                {#if folderLinks.length > 0}
                    <div style="position: absolute; top: -4px; right: -4px; background: var(--lilac-d); color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--surface);">
                        {folderLinks.length}
                    </div>
                {/if}
			</div>
			<span style="font-size: 11px; font-weight: 500; text-align: center;">{folder.name || 'Untitled'}</span>
		</div>
	{/each}

	{#each rootLinks as link (link.id)}
		<div
			class="widget-item"
            style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer;"
			draggable={true}
			ondragstart={(e) => handleDragStart(e, link.id)}
			ondragenter={(e) => handleDragEnter(e, link.id)}
			ondragover={(e) => handleDragOver(e, link.id)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, link.id)}
			ondragend={handleDragEnd}
            role="button"
            tabindex="0"
            onclick={() => openLink(link.url)}
		>
			<div style="width: 48px; height: 48px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                {#if brokenFavicons.has(link.id) || !(link.faviconUrl || preloadedFavicons.has(link.id))}
				    <Link2 style="width: 24px; height: 24px; color: var(--ink-3);" />
                {:else}
                    <img src={faviconForLink(link)} alt="" style="width: 24px; height: 24px; object-fit: contain;" />
                {/if}
			</div>
			<span style="font-size: 11px; font-weight: 500; text-align: center;">{labelFor(link)}</span>
		</div>
	{/each}

	<button
		type="button"
		style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; background: none; border: none;"
		onclick={() => openAdd()}
	>
		<div style="width: 48px; height: 48px; background: var(--surface-3); border: 1px dashed var(--hairline); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
			<Plus style="width: 24px; height: 24px; color: var(--ink-4);" />
		</div>
		<span style="font-size: 11px; font-weight: 500; color: var(--ink-3);">Add link</span>
	</button>
</div>

{#if folderPopoverId}
    {@const folder = visibleFolders.find(f => f.id === folderPopoverId)}
    {@const folderLinks = folderLinksMap[folderPopoverId] ?? []}
    <Dialog open={!!folderPopoverId} onClose={closeFolderDialog} maxWidth="max-w-md">
        <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 32px; height: 32px; background: var(--lilac); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <Folder style="width: 16px; height: 16px; color: var(--lilac-d);" />
                </div>
                <h3 class="display" style="font-size: 20px; margin: 0;">{folder?.name || 'Untitled Folder'}</h3>
            </div>
            <div style="display: flex; gap: 8px;">
                <Button variant="ghost" size="sm" onclick={() => folder && openEditFolder(folder)}>
                    <MoreHorizontal size={16} />
                </Button>
                <Button variant="ghost" size="sm" onclick={closeFolderDialog}>
                    <X size={16} />
                </Button>
            </div>
        </div>
        <div class="modal-content" style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; padding: 4px;">
            {#each folderLinks as link}
                <div class="card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between; background: var(--surface-2); border-color: transparent;">
                    <div 
                        style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; min-width: 0;"
                        onclick={() => openLink(link.url)}
                        role="button"
                        tabindex="0"
                    >
                        <div style="width: 32px; height: 32px; background: var(--surface); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            {#if brokenFavicons.has(link.id) || !(link.faviconUrl || preloadedFavicons.has(link.id))}
                                <Link2 style="width: 16px; height: 16px; color: var(--ink-3);" />
                            {:else}
                                <img src={faviconForLink(link)} alt="" style="width: 16px; height: 16px; object-fit: contain;" />
                            {/if}
                        </div>
                        <span style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{labelFor(link)}</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <Button variant="ghost" size="sm" onclick={() => moveLinkToRoot(link.id)} title="Move to root">
                            <Plus style="width: 14px; height: 14px; transform: rotate(45deg);" />
                        </Button>
                        <Button variant="ghost" size="sm" onclick={() => openEdit(link)}>
                            <MoreHorizontal size={14} />
                        </Button>
                    </div>
                </div>
            {/each}
            {#if folderLinks.length === 0}
                <div style="padding: 32px; text-align: center; color: var(--ink-3); font-size: 13px;">
                    This folder is empty.
                </div>
            {/if}
        </div>
        <div class="modal-footer">
            <Button variant="outline" style="width: 100%;" onclick={() => folder && openAdd(folder)}>
                <Plus size={16} style="margin-right: 8px;" /> Add link to folder
            </Button>
        </div>
    </Dialog>
{/if}

{#if modalOpen}
	<Dialog open={modalOpen} onClose={closeModal} maxWidth="max-w-md">
		{#if modalMode === 'folder'}
			<form
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
				<div class="modal-header">
					<div class="widget-flex widget-flex-1 widget-items-start">
						<Input
							name="name"
							bind:value={draftFolderName}
							class="modal-title-input"
							placeholder="Folder name (optional)"
						/>
					</div>
					<Button type="button" variant="ghost" size="sm" onclick={closeModal} class="shrink-0">
						{#snippet children()}<X class="widget-icon-5" />{/snippet}
					</Button>
				</div>
				<div class="modal-content">
					{#if form?.error}
						<div class="modal-error">
							<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
						</div>
					{/if}
				</div>
				<div class="modal-footer">
					<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</form>
		{:else}
			{#if editing}
				<form
					method="post"
					action="?/update"
					class="modal-form"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'redirect') closeModal();
						};
					}}
				>
					<input type="hidden" name="id" value={editing.id} />
					<div class="modal-header">
						<div class="widget-flex widget-flex-1 widget-items-start">
							<Input
								name="url"
								bind:value={draftUrl}
								class="modal-title-input"
								placeholder="URL"
								required
							/>
						</div>
						<Button type="button" variant="ghost" size="sm" onclick={closeModal} class="shrink-0">
							{#snippet children()}<X class="widget-icon-5" />{/snippet}
						</Button>
					</div>
					<div class="modal-content">
						<div>
							<Label for="ql-title">Title (optional)</Label>
							<Input id="ql-title" name="title" bind:value={draftTitle} placeholder={prettyHostname(draftUrl)} />
						</div>
						<div>
							<Label for="ql-description">Description (optional)</Label>
							<Textarea id="ql-description" name="description" rows={2} bind:value={draftDescription} />
						</div>
						{#if form?.error}
							<div class="modal-error">
								<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
							</div>
						{/if}
					</div>
					<div class="modal-footer">
						<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
						<Button type="submit">Save</Button>
					</div>
				</form>
			{:else}
				<form
					method="post"
					action="?/create"
					class="modal-form"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'redirect') closeModal();
						};
					}}
				>
					{#if addingToFolder}
						<input type="hidden" name="folderId" value={addingToFolder.id} />
					{/if}
					<div class="modal-header">
						<div class="widget-flex widget-flex-1 widget-items-start">
							<Input
								name="url"
								bind:value={draftUrl}
								class="modal-title-input"
								placeholder="URL"
								required
							/>
						</div>
						<Button type="button" variant="ghost" size="sm" onclick={closeModal} class="shrink-0">
							{#snippet children()}<X class="widget-icon-5" />{/snippet}
						</Button>
					</div>
					<div class="modal-content">
						<div>
							<Label for="ql-title-new">Title (optional)</Label>
							<Input
								id="ql-title-new"
								name="title"
								bind:value={draftTitle}
								placeholder={draftUrl ? prettyHostname(draftUrl) : 'Shown under the icon'}
							/>
						</div>
						<div>
							<Label for="ql-description-new">Description (optional)</Label>
							<Textarea id="ql-description-new" name="description" rows={2} bind:value={draftDescription} />
						</div>
						{#if form?.error}
							<div class="modal-error">
								<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
							</div>
						{/if}
					</div>
					<div class="modal-footer">
						<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
						<Button type="submit">Add</Button>
					</div>
				</form>
			{/if}
		{/if}
	</Dialog>
{/if}
