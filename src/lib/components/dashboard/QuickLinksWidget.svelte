<script lang="ts">
	import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { EllipsisVertical, MoreHorizontal, Plus, Link2, Folder } from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';

	type ActionForm = { error?: string; errorId?: string | null } | undefined;
	type DropIntent = 'reorder' | 'merge' | 'move-into';

	let { links, folders, form }: { links: QuickLink[]; folders: QuickLinkFolder[]; form?: ActionForm } = $props();

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
<div class="widget-container">
	{#each visibleFolders as folder (folder.id)}
		{@const folderLinks = folderLinksMap[folder.id] ?? []}
		{@const previewLinks = folderLinks.slice(0, 4)}
		<div
			class="widget-item"
			draggable={true}
			ondragstart={(e) => handleDragStart(e, folder.id)}
			ondragenter={(e) => handleDragEnter(e, folder.id)}
			ondragover={(e) => handleDragOver(e, folder.id)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, folder.id)}
			ondragend={handleDragEnd}
			class:widget-drop-target={dropTargetId === folder.id && (dropIntent === 'reorder' || dropIntent === 'move-into')}
			class:widget-drop-target-reorder={dropTargetId === folder.id && dropIntent === 'reorder'}
			class:widget-drop-target-move-into={dropTargetId === folder.id && dropIntent === 'move-into'}
			class:widget-dragging={draggingId === folder.id}
			class:widget-insert-indicator={dropInsertIndex !== null && allItems.findIndex((i) => i.id === folder.id) === dropInsertIndex}
			role="button"
			tabindex="0"
			aria-label={folder.name ?? 'Folder'}
		>
			<!-- Circle + ⋮ menu wrapper -->
			<div class="widget-circle-wrapper">
				<!-- ⋮ button anchored to the top-right corner of the circle -->
				<button
					type="button"
					draggable={false}
					class="widget-action-btn"
					aria-label={`Actions for ${folder.name ?? 'Folder'}`}
					aria-expanded={menuOpenId === folder.id}
					aria-haspopup="true"
					data-quicklink-menu="trigger"
					onclick={(e) => toggleMenu(folder.id, e)}
				>
					<EllipsisVertical class="h-3.5 w-3.5" />
				</button>

				{#if menuOpenId === folder.id}
					<div
						class="widget-dropdown"
						data-quicklink-menu="panel"
						role="menu"
					>
						<button
							type="button"
							class="widget-dropdown-item"
							role="menuitem"
							onclick={() => openEditFolder(folder)}
						>
							Rename
						</button>
						<button
							type="button"
							class="widget-dropdown-item widget-dropdown-item-destructive"
							role="menuitem"
							onclick={() => deleteFolder(folder.id)}
						>
							Delete
						</button>
					</div>
				{/if}

				<!-- Folder circle with preview icons -->
				<div
					onclick={(e) => toggleFolderPopover(folder.id, e)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							toggleFolderPopover(folder.id, e);
						}
					}}
					class="widget-circle"
					role="button"
					tabindex="0"
					aria-label={folder.name ?? 'Folder'}
				>
					<Folder class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
					<!-- Preview icons (up to 4) -->
					{#if previewLinks.length > 0}
						<div class="widget-preview-icons">
							{#each previewLinks.slice(0, 2) as pl}
								{#if pl.faviconUrl || preloadedFavicons.has(pl.id)}
									<img
										src={faviconForLink(pl)}
										alt=""
										class="widget-preview-icon"
										referrerpolicy="no-referrer"
										class:opacity-50={previewLinks.length > 1}
										draggable={false}
										style="image-rendering: crisp-edges"
									/>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Label: up to 2 lines, then ellipsis -->
				{#if inlineEditingFolderId === folder.id}
					<input
						bind:this={inlineFolderInputEl}
						bind:value={inlineFolderName}
						placeholder="Name this folder"
						class="widget-folder-input"
						onclick={(event) => event.stopPropagation()}
						onkeydown={(event) => {
							event.stopPropagation();
							if (event.key === 'Enter') {
								event.preventDefault();
								void saveInlineFolderName(folder.id);
							}
							if (event.key === 'Escape') {
								event.preventDefault();
								cancelInlineFolderName();
							}
						}}
						onblur={() => void saveInlineFolderName(folder.id)}
					/>
				{:else if folder.name}
					<span
						class="widget-label"
						title={folder.name}
					>
					{folder.name}
				</span>
			{/if}
		</div>

		<!-- Folder popover -->
		{#if folderPopoverId === folder.id}
			<div
				class="widget-popover"
				data-folder-popover="panel"
				role="dialog"
				aria-modal="true"
			>
				<button
					type="button"
					class="widget-popover-overlay"
					aria-label="Close"
					onclick={closeFolderDialog}
				></button>
				<div
					class="widget-popover-panel"
				>
					<div class="flex items-center justify-between mb-4">
						<input
							bind:this={folderDialogInputEl}
							bind:value={folderDialogName}
							aria-label="Folder name"
							placeholder="Folder"
							class="mr-2 h-8 flex-1 rounded-md border-none bg-transparent px-0 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void saveFolderDialogName(folder);
									folderDialogInputEl?.blur();
								}
								if (event.key === 'Escape') {
									event.preventDefault();
									folderDialogName = folder.name ?? '';
									folderDialogInputEl?.blur();
								}
							}}
							onblur={() => void saveFolderDialogName(folder)}
						/>
						<div class="flex items-center gap-1">
							<div class="relative" data-quicklink-menu>
								<button
									type="button"
									class="rounded-md p-1 hover:bg-muted"
									aria-label={`Actions for ${folder.name ?? 'Folder'}`}
									aria-expanded={folderDialogMenuOpen}
									aria-haspopup="true"
									onclick={() => (folderDialogMenuOpen = !folderDialogMenuOpen)}
								>
									<MoreHorizontal class="h-4 w-4" aria-hidden="true" />
								</button>
								{#if folderDialogMenuOpen}
									<div class="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border border-border bg-card py-1 text-sm shadow-md" role="menu">
										<button
											type="button"
											class="block w-full px-3 py-1.5 text-left text-destructive hover:bg-muted"
											role="menuitem"
											onclick={() => deleteFolder(folder.id)}
										>
											Delete
										</button>
									</div>
								{/if}
							</div>
							<button
								type="button"
								class="rounded-md p-1 hover:bg-muted"
								aria-label="Close"
								onclick={closeFolderDialog}
							>
								<span class="sr-only">Close</span>
								<span aria-hidden="true" class="text-lg leading-none">×</span>
							</button>
						</div>
					</div>
					{#if folderLinks.length === 0}
						<div class="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
							<p class="text-sm">This folder is empty</p>
							<button
								type="button"
								class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
								onclick={() => openAdd(folder)}
							>
								<Plus class="h-4 w-4" aria-hidden="true" />
								Add link
							</button>
						</div>
					{/if}
					<div class="widget-container">
						{#each folderLinks as link (link.id)}
							<div
								class="widget-item"
							>
								<div class="widget-circle-wrapper">
									<button
										type="button"
										draggable={false}
										class="widget-action-btn"
										aria-label={`Actions for ${labelFor(link)}`}
										onclick={(e) => toggleMenu(link.id, e)}
									>
										<EllipsisVertical class="h-3.5 w-3.5" />
									</button>

									{#if menuOpenId === link.id && menuPosition}
										<div
											style="top: {menuPosition.top}px; left: {menuPosition.left}px;"
											class="widget-dropdown"
											data-quicklink-menu="panel"
											role="menu"
										>
											<button
												type="button"
												class="widget-dropdown-item"
												role="menuitem"
												onclick={() => openEdit(link)}
											>
												Edit
											</button>
											<button
												type="button"
												class="widget-dropdown-item"
												role="menuitem"
												onclick={() => moveLinkToRoot(link.id)}
											>
												Move to root
											</button>
											<form
												method="post"
												action="?/delete"
												use:enhance={() => {
													return async ({ result, update }) => {
														await update();
														if (result.type === 'redirect') closeModal();
													};
												}}
											>
												<input type="hidden" name="id" value={link.id} />
												<button
													type="submit"
													class="widget-dropdown-item widget-dropdown-item-destructive"
													role="menuitem"
												>
													Remove
												</button>
											</form>
										</div>
									{/if}

									<div
										onclick={() => openLink(link.url)}
										onkeydown={(e) => handleLinkKeydown(e, link.url)}
										aria-label={labelFor(link)}
										role="button"
										tabindex="0"
										class="widget-circle"
									>
										{#if brokenFavicons.has(link.id)}
											<Link2 class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
										{:else if link.faviconUrl || preloadedFavicons.has(link.id)}
											<img
												src={faviconForLink(link)}
												alt=""
												class="h-8 w-8 rounded-sm object-contain"
												referrerpolicy="no-referrer"
												style="image-rendering: crisp-edges"
											/>
										{:else}
											<!-- Show Link2 icon while preloading -->
											<Link2 class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
										{/if}
									</div>
								</div>
								<span
									class="widget-label"
									title={labelFor(link)}
								>
									{labelFor(link)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/each}

	{#each rootLinks as link (link.id)}
		<div
			class="widget-item"
			draggable={true}
			ondragstart={(e) => handleDragStart(e, link.id)}
			ondragenter={(e) => handleDragEnter(e, link.id)}
			ondragover={(e) => handleDragOver(e, link.id)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, link.id)}
			ondragend={handleDragEnd}
			class:widget-drop-target={dropTargetId === link.id && (dropIntent === 'reorder' || dropIntent === 'merge')}
			class:widget-drop-target-reorder={dropTargetId === link.id && dropIntent === 'reorder'}
			class:widget-drop-target-merge={dropTargetId === link.id && dropIntent === 'merge'}
			class:widget-dragging={draggingId === link.id}
			class:widget-insert-indicator={dropInsertIndex !== null && allItems.findIndex((i) => i.id === link.id) === dropInsertIndex}
			role="button"
			tabindex="0"
			aria-label={labelFor(link)}
		>
			<!-- Circle + ⋮ menu wrapper -->
			<div class="widget-circle-wrapper">
				<!-- ⋮ button anchored to the top-right corner of the circle -->
				<button
					type="button"
					draggable={false}
					class="widget-action-btn"
					aria-label={`Actions for ${labelFor(link)}`}
					aria-expanded={menuOpenId === link.id}
					aria-haspopup="true"
					data-quicklink-menu="trigger"
					onclick={(e) => toggleMenu(link.id, e)}
				>
					<EllipsisVertical class="h-3.5 w-3.5" />
				</button>

				{#if menuOpenId === link.id}
					<div
						class="widget-dropdown"
						data-quicklink-menu="panel"
						role="menu"
					>
						<button
							type="button"
							class="widget-dropdown-item"
							role="menuitem"
							onclick={() => openEdit(link)}
						>
							Edit
						</button>
						<form
							method="post"
							action="?/delete"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') closeModal();
								};
							}}
						>
							<input type="hidden" name="id" value={link.id} />
							<button
								type="submit"
								class="widget-dropdown-item widget-dropdown-item-destructive"
								role="menuitem"
							>
								Remove
							</button>
						</form>
					</div>
				{/if}

				<!-- Favicon circle is a plain div (no extra padding) -->
				<div
					onclick={() => openLink(link.url)}
					onkeydown={(e) => handleLinkKeydown(e, link.url)}
					aria-label={labelFor(link)}
					role="button"
					tabindex="0"
					class="widget-circle"
				>
					{#if brokenFavicons.has(link.id)}
						<Link2 class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
					{:else if link.faviconUrl || preloadedFavicons.has(link.id)}
						<img
							src={faviconForLink(link)}
							alt=""
							class="h-8 w-8 rounded-sm object-contain"
							referrerpolicy="no-referrer"
							draggable={false}
							style="image-rendering: crisp-edges"
						/>
					{:else}
						<!-- Show Link2 icon while preloading -->
						<Link2 class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
					{/if}
				</div>
			</div>

			<!-- Label: up to 2 lines, then ellipsis -->
			<span
				class="widget-label"
				title={labelFor(link)}
			>
				{labelFor(link)}
			</span>
		</div>
	{/each}

	<!-- Add link tile — same structure: circle on top, label below -->
	<button
		type="button"
		class="widget-item text-muted-foreground hover:text-foreground"
		onclick={() => openAdd()}
	>
		<span class="widget-circle">
			<Plus class="h-6 w-6" aria-hidden="true" />
		</span>
		<span class="widget-label">Add link</span>
	</button>

	<!-- Add folder tile -->
	<button
		type="button"
		class="widget-item text-muted-foreground hover:text-foreground"
		onclick={openAddFolder}
	>
		<span class="widget-circle">
			<Folder class="h-6 w-6" aria-hidden="true" />
		</span>
		<span class="widget-label">Add folder</span>
	</button>
</div>

{#if modalOpen}
	<div
		class="widget-popover"
		role="dialog"
		aria-modal="true"
		aria-labelledby="quicklink-modal-title"
	>
		<button
			type="button"
			class="widget-popover-overlay"
			aria-label="Close"
			onclick={closeModal}
		></button>
		<div
			class="widget-popover-panel"
		>
			<div class="widget-popover-header">
				<p id="quicklink-modal-title" class="text-sm font-semibold">
					{modalMode === 'folder'
						? 'Rename folder'
						: editing
							? 'Edit link'
							: 'Add link'}
				</p>
				<button type="button" class="rounded-md p-1 hover:bg-muted" aria-label="Close" onclick={closeModal}>
					<span class="sr-only">Close</span>
					<span aria-hidden="true" class="text-lg leading-none">×</span>
				</button>
			</div>
			<div class="widget-popover-body">
				{#if modalMode === 'folder'}
					<form
						method="post"
						action="?/updateFolder"
						class="modal-form-grid"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'redirect') closeModal();
							};
						}}
					>
						<input type="hidden" name="id" value={editingFolder?.id} />
						<div>
							<Label for="ql-folder-name">Folder name (optional)</Label>
							<Input id="ql-folder-name" name="name" bind:value={draftFolderName} placeholder="Leave empty for unnamed folder" />
						</div>
						{#if form?.error}
							<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
						{/if}
						<div class="flex gap-2">
							<Button type="submit">Save</Button>
							<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
						</div>
					</form>
				{:else}
					{#if editing}
						<form
							method="post"
							action="?/update"
							class="modal-form-grid"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') closeModal();
								};
							}}
						>
							<input type="hidden" name="id" value={editing.id} />
							<div>
								<Label for="ql-url">URL</Label>
								<Input id="ql-url" name="url" required bind:value={draftUrl} />
							</div>
							<div>
								<Label for="ql-title">Title (optional)</Label>
								<Input id="ql-title" name="title" bind:value={draftTitle} placeholder={prettyHostname(draftUrl)} />
							</div>
							<div>
								<Label for="ql-description">Description (optional)</Label>
								<Textarea id="ql-description" name="description" rows={2} bind:value={draftDescription} />
							</div>
							{#if form?.error}
								<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
							{/if}
							<div class="flex gap-2">
								<Button type="submit">Save</Button>
								<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
							</div>
						</form>
					{:else}
						<form
							method="post"
							action="?/create"
							class="modal-form-grid"
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
							<div>
								<Label for="ql-url-new">URL</Label>
								<Input id="ql-url-new" name="url" required bind:value={draftUrl} />
							</div>
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
								<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
							{/if}
							<div class="flex gap-2">
								<Button type="submit">Add</Button>
								<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
							</div>
						</form>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
