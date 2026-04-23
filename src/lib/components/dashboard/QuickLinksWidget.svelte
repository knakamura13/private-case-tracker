<script lang="ts">
	import type { QuickLink, QuickLinkFolder } from '$lib/types/enums';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { EllipsisVertical, Plus, Link2, Folder } from 'lucide-svelte';
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
	let draftUrl = $state('');
	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftNotes = $state('');
	let draftFolderName = $state('');
	let menuOpenId = $state<string | null>(null);
	let folderPopoverId = $state<string | null>(null);
	let brokenFavicons = $state<Set<string>>(new Set());
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let dropIntent = $state<DropIntent | null>(null);
	let dragEnterCount = $state(0);

	// Separate root links and folder links
	let rootLinks = $derived(links.filter((l) => !l.folderId));
	let folderLinksMap = $derived(
		folders.reduce((acc, f) => {
			acc[f.id] = links.filter((l) => l.folderId === f.id);
			return acc;
		}, {} as Record<string, QuickLink[]>)
	);

	// Combine folders and root links for drag context
	let allItems = $derived([...folders, ...rootLinks]);
	let itemIds = $derived(allItems.map((item) => item.id));

	function prettyHostname(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return 'Link';
		}
	}

	function faviconForUrl(url: string): string {
		try {
			const h = new URL(url).hostname;
			return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=128`;
		} catch {
			return '';
		}
	}

	function labelFor(link: QuickLink) {
		return link.title?.trim() ? link.title : prettyHostname(link.url);
	}

	function openAdd() {
		modalMode = 'link';
		editing = null;
		editingFolder = null;
		draftUrl = '';
		draftTitle = '';
		draftDescription = '';
		draftNotes = '';
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
		draftNotes = link.notes ?? '';
		draftFolderName = '';
		modalOpen = true;
		menuOpenId = null;
	}

	function openAddFolder() {
		modalMode = 'folder';
		editing = null;
		editingFolder = null;
		draftUrl = '';
		draftTitle = '';
		draftDescription = '';
		draftNotes = '';
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
		draftNotes = '';
		draftFolderName = folder.name ?? '';
		modalOpen = true;
		menuOpenId = null;
	}

	function closeModal() {
		modalOpen = false;
	}

	function toggleMenu(id: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		menuOpenId = menuOpenId === id ? null : id;
		folderPopoverId = null;
	}

	function toggleFolderPopover(folderId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		folderPopoverId = folderPopoverId === folderId ? null : folderId;
		menuOpenId = null;
	}

	function markFaviconBroken(id: string) {
		const next = new Set(brokenFavicons);
		next.add(id);
		brokenFavicons = next;
	}

	$effect(() => {
		if (menuOpenId === null && folderPopoverId === null) return;
		const onDoc = (e: MouseEvent) => {
			const t = e.target;
			if (!(t instanceof HTMLElement)) return;
			if (t.closest('[data-quicklink-menu]')) return;
			if (t.closest('[data-folder-popover]')) return;
			menuOpenId = null;
			folderPopoverId = null;
		};
		document.addEventListener('click', onDoc, true);
		return () => document.removeEventListener('click', onDoc, true);
	});

	function handleDragStart(event: DragEvent, id: string) {
		draggingId = id;
		dropTargetId = null;
		dropIntent = null;
		dragEnterCount = 0;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', id);
			event.dataTransfer.setData('application/x-quicklink-id', id);
		}
	}

	function handleDragEnd() {
		draggingId = null;
		dropTargetId = null;
		dropIntent = null;
		dragEnterCount = 0;
	}

	function handleDragEnter(event: DragEvent, id: string) {
		event.preventDefault();
		dragEnterCount++;
		if (draggingId && draggingId !== id) {
			dropTargetId = id;
			// Determine drop intent based on what's being dragged and what it's over
			const activeLink = links.find((l) => l.id === draggingId);
			const targetLink = links.find((l) => l.id === id);
			const targetFolder = folders.find((f) => f.id === id);

			if (activeLink && targetLink && !activeLink.folderId && !targetLink.folderId) {
				dropIntent = 'merge';
			} else if (activeLink && targetFolder && !activeLink.folderId) {
				dropIntent = 'move-into';
			} else {
				dropIntent = 'reorder';
			}
		}
	}

	function handleDragLeave() {
		dragEnterCount--;
		if (dragEnterCount <= 0) {
			dragEnterCount = 0;
			dropTargetId = null;
			dropIntent = null;
		}
	}

	function handleDragOver(event: DragEvent, id: string) {
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
		if (!activeId || activeId === targetId) return;

		const activeLink = links.find((l) => l.id === activeId);
		const targetLink = links.find((l) => l.id === targetId);
		const targetFolder = folders.find((f) => f.id === targetId);

		// 1. Drop a root link onto another root link → create folder with both
		if (activeLink && targetLink && !activeLink.folderId && !targetLink.folderId) {
			const response = await fetch('api/quick-link-folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: null })
			});
			if (!response.ok) return;
			const folder = await response.json();

			if (folder?.id) {
				await Promise.all([
					moveLinkToFolderAction(activeId, folder.id),
					moveLinkToFolderAction(targetId, folder.id)
				]);
				await invalidateAll();
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

			const isFolderDrag = folders.some((f) => f.id === activeId);
			const formData = new FormData();
			if (isFolderDrag) {
				newOrder
					.filter((id) => folders.some((f) => f.id === id))
					.forEach((id) => formData.append('folderIds', id));
				await fetch('?/reorderFolders', { method: 'POST', body: formData });
			} else {
				newOrder
					.filter((id) => rootLinks.some((l) => l.id === id))
					.forEach((id) => formData.append('linkIds', id));
				await fetch('?/reorderLinks', { method: 'POST', body: formData });
			}
			await invalidateAll();
		}
	}

	async function moveLinkToFolderAction(linkId: string, folderId: string | null) {
		const formData = new FormData();
		formData.append('linkId', linkId);
		if (folderId) formData.append('folderId', folderId);
		await fetch('?/moveToFolder', { method: 'POST', body: formData });
	}

	async function moveLinkToRoot(linkId: string) {
		await moveLinkToFolderAction(linkId, null);
		await invalidateAll();
	}

	async function deleteFolder(folderId: string) {
		if (!confirm('Delete this folder? Links will be moved to the root level.')) return;
		const formData = new FormData();
		formData.append('id', folderId);
		await fetch('?/deleteFolder', { method: 'POST', body: formData });
		await invalidateAll();
	}
</script>

<!--
  Each tile: fixed width, flex-col, circle on top, label below.
  The ⋮ button is positioned relative to the circle span itself,
  so it doesn't push the circle down or affect alignment.
-->
<div class="flex flex-wrap items-start gap-1 sm:gap-2">
	{#each folders as folder (folder.id)}
		{@const folderLinks = folderLinksMap[folder.id] ?? []}
		{@const previewLinks = folderLinks.slice(0, 4)}
		<div
			class="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 transition-shadow hover:bg-muted/40 focus-within:bg-muted/40"
			draggable={true}
			ondragstart={(e) => handleDragStart(e, folder.id)}
			ondragenter={(e) => handleDragEnter(e, folder.id)}
			ondragover={(e) => handleDragOver(e, folder.id)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, folder.id)}
			ondragend={handleDragEnd}
			class:ring-2={dropTargetId === folder.id && (dropIntent === 'reorder' || dropIntent === 'move-into')}
			class:ring-primary={dropTargetId === folder.id && dropIntent === 'reorder'}
			class:ring-emerald-500={dropTargetId === folder.id && dropIntent === 'move-into'}
			class:ring-offset-2={dropTargetId === folder.id && (dropIntent === 'reorder' || dropIntent === 'move-into')}
			class:opacity-50={draggingId === folder.id}
			role="button"
			tabindex="0"
			aria-label={folder.name ?? 'Folder'}
		>
			<!-- Circle + ⋮ menu wrapper -->
			<div class="relative">
				<!-- ⋮ button anchored to the top-right corner of the circle -->
				<button
					type="button"
					class="absolute -right-1 -top-1 z-10 rounded-full bg-background/90 p-0.5 text-muted-foreground opacity-0 shadow ring-1 ring-border transition-opacity hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
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
						class="absolute left-1/2 top-full z-20 mt-1 min-w-34 -translate-x-1/2 rounded-md border border-border bg-card py-1 text-sm shadow-md"
						data-quicklink-menu="panel"
						role="menu"
					>
						<button
							type="button"
							class="block w-full px-3 py-1.5 text-left hover:bg-muted"
							role="menuitem"
							onclick={() => openEditFolder(folder)}
						>
							Rename
						</button>
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

				<!-- Folder circle with preview icons -->
				<button
					type="button"
					onclick={(e) => toggleFolderPopover(folder.id, e)}
					class="flex h-14 w-14 items-center justify-center rounded-full bg-muted/90 ring-1 ring-border/60 outline-none focus-visible:ring-2 focus-visible:ring-ring relative"
					aria-label={folder.name ?? 'Folder'}
				>
					<Folder class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
					<!-- Preview icons (up to 4) -->
					{#if previewLinks.length > 0}
						<div class="absolute bottom-0 right-0 flex h-4 w-4">
							{#each previewLinks.slice(0, 2) as pl}
								<img
									src={faviconForUrl(pl.url)}
									alt=""
									class="h-3 w-3 rounded-sm object-contain"
									referrerpolicy="no-referrer"
									class:opacity-50={previewLinks.length > 1}
								/>
							{/each}
						</div>
					{/if}
				</button>
			</div>

			<!-- Label: up to 2 lines, then ellipsis -->
			{#if folder.name}
				<span
					class="line-clamp-2 w-full text-center text-[11px] leading-tight text-foreground"
					title={folder.name}
				>
					{folder.name}
				</span>
			{/if}
		</div>

		<!-- Folder popover -->
		{#if folderPopoverId === folder.id}
			<div
				class="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-24 backdrop-blur-sm"
				data-folder-popover="panel"
				role="dialog"
				aria-modal="true"
			>
				<button
					type="button"
					class="absolute inset-0 z-0 cursor-default"
					aria-label="Close"
					onclick={() => (folderPopoverId = null)}
				></button>
				<div
					class="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl p-4"
				>
					<div class="flex items-center justify-between mb-4">
						<p class="text-sm font-semibold">{folder.name ?? 'Folder'}</p>
						<button
							type="button"
							class="rounded-md p-1 hover:bg-muted"
							aria-label="Close"
							onclick={() => (folderPopoverId = null)}
						>
							<span class="sr-only">Close</span>
							<span aria-hidden="true" class="text-lg leading-none">×</span>
						</button>
					</div>
					<div class="flex flex-wrap items-start gap-1 sm:gap-2">
						{#each folderLinks as link (link.id)}
							<div
								class="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 hover:bg-muted/40"
							>
								<div class="relative">
									<button
										type="button"
										class="absolute -right-1 -top-1 z-10 rounded-full bg-background/90 p-0.5 text-muted-foreground opacity-0 shadow ring-1 ring-border transition-opacity hover:text-foreground group-hover:opacity-100"
										aria-label={`Actions for ${labelFor(link)}`}
										onclick={(e) => toggleMenu(link.id, e)}
									>
										<EllipsisVertical class="h-3.5 w-3.5" />
									</button>

									{#if menuOpenId === link.id}
										<div
											class="absolute left-1/2 top-full z-20 mt-1 min-w-34 -translate-x-1/2 rounded-md border border-border bg-card py-1 text-sm shadow-md"
											data-quicklink-menu="panel"
											role="menu"
										>
											<button
												type="button"
												class="block w-full px-3 py-1.5 text-left hover:bg-muted"
												role="menuitem"
												onclick={() => openEdit(link)}
											>
												Edit
											</button>
											<button
												type="button"
												class="block w-full px-3 py-1.5 text-left hover:bg-muted"
												role="menuitem"
												onclick={() => moveLinkToRoot(link.id)}
											>
												Move to root
											</button>
											<form
												method="post"
												action="?/delete"
												use:enhance={({ cancel }) => {
													if (!confirm('Remove this shortcut?')) cancel();
													return async ({ result, update }) => {
														await update();
														if (result.type === 'redirect') closeModal();
													};
												}}
											>
												<input type="hidden" name="id" value={link.id} />
												<button
													type="submit"
													class="block w-full px-3 py-1.5 text-left text-destructive hover:bg-muted"
													role="menuitem"
												>
													Remove
												</button>
											</form>
										</div>
									{/if}

									<a
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={labelFor(link)}
										class="flex h-14 w-14 items-center justify-center rounded-full bg-muted/90 ring-1 ring-border/60 outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										{#if brokenFavicons.has(link.id)}
											<Link2 class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
										{:else}
											<img
												src={faviconForUrl(link.url)}
												alt=""
												class="h-8 w-8 rounded-sm object-contain"
												referrerpolicy="no-referrer"
												loading="lazy"
												onerror={() => markFaviconBroken(link.id)}
											/>
										{/if}
									</a>
								</div>
								<span
									class="line-clamp-2 w-full text-center text-[11px] leading-tight text-foreground"
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
			class="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 transition-shadow hover:bg-muted/40 focus-within:bg-muted/40"
			draggable={true}
			ondragstart={(e) => handleDragStart(e, link.id)}
			ondragenter={(e) => handleDragEnter(e, link.id)}
			ondragover={(e) => handleDragOver(e, link.id)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, link.id)}
			ondragend={handleDragEnd}
			class:ring-2={dropTargetId === link.id && (dropIntent === 'reorder' || dropIntent === 'merge')}
			class:ring-primary={dropTargetId === link.id && dropIntent === 'reorder'}
			class:ring-amber-500={dropTargetId === link.id && dropIntent === 'merge'}
			class:ring-offset-2={dropTargetId === link.id && (dropIntent === 'reorder' || dropIntent === 'merge')}
			class:opacity-50={draggingId === link.id}
			role="button"
			tabindex="0"
			aria-label={labelFor(link)}
		>
			<!-- Circle + ⋮ menu wrapper -->
			<div class="relative">
				<!-- ⋮ button anchored to the top-right corner of the circle -->
				<button
					type="button"
					class="absolute -right-1 -top-1 z-10 rounded-full bg-background/90 p-0.5 text-muted-foreground opacity-0 shadow ring-1 ring-border transition-opacity hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
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
						class="absolute left-1/2 top-full z-20 mt-1 min-w-34 -translate-x-1/2 rounded-md border border-border bg-card py-1 text-sm shadow-md"
						data-quicklink-menu="panel"
						role="menu"
					>
						<button
							type="button"
							class="block w-full px-3 py-1.5 text-left hover:bg-muted"
							role="menuitem"
							onclick={() => openEdit(link)}
						>
							Edit
						</button>
						<form
							method="post"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm('Remove this shortcut?')) cancel();
								return async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') closeModal();
								};
							}}
						>
							<input type="hidden" name="id" value={link.id} />
							<button
								type="submit"
								class="block w-full px-3 py-1.5 text-left text-destructive hover:bg-muted"
								role="menuitem"
							>
								Remove
							</button>
						</form>
					</div>
				{/if}

				<!-- Favicon circle is a plain anchor (no extra padding) -->
				<a
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={labelFor(link)}
					class="flex h-14 w-14 items-center justify-center rounded-full bg-muted/90 ring-1 ring-border/60 outline-none focus-visible:ring-2 focus-visible:ring-ring"
					tabindex="0"
				>
					{#if brokenFavicons.has(link.id)}
						<Link2 class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
					{:else}
						<img
							src={faviconForUrl(link.url)}
							alt=""
							class="h-8 w-8 rounded-sm object-contain"
							referrerpolicy="no-referrer"
							loading="lazy"
							onerror={() => markFaviconBroken(link.id)}
						/>
					{/if}
				</a>
			</div>

			<!-- Label: up to 2 lines, then ellipsis -->
			<span
				class="line-clamp-2 w-full text-center text-[11px] leading-tight text-foreground"
				title={labelFor(link)}
			>
				{labelFor(link)}
			</span>
		</div>
	{/each}

	<!-- Add shortcut tile — same structure: circle on top, label below -->
	<button
		type="button"
		class="flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
		onclick={openAdd}
	>
		<span class="flex h-14 w-14 items-center justify-center rounded-full bg-muted/90 ring-1 ring-border/60">
			<Plus class="h-6 w-6" aria-hidden="true" />
		</span>
		<span class="line-clamp-2 w-full text-center text-[11px] leading-tight">Add shortcut</span>
	</button>

	<!-- Add folder tile -->
	<button
		type="button"
		class="flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
		onclick={openAddFolder}
	>
		<span class="flex h-14 w-14 items-center justify-center rounded-full bg-muted/90 ring-1 ring-border/60">
			<Folder class="h-6 w-6" aria-hidden="true" />
		</span>
		<span class="line-clamp-2 w-full text-center text-[11px] leading-tight">Add folder</span>
	</button>
</div>

{#if modalOpen}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-24 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="quicklink-modal-title"
	>
		<button
			type="button"
			class="absolute inset-0 z-0 cursor-default"
			aria-label="Close"
			onclick={closeModal}
		></button>
		<div
			class="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl"
		>
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<p id="quicklink-modal-title" class="text-sm font-semibold">
					{modalMode === 'folder'
						? editingFolder
							? 'Rename folder'
							: 'Add folder'
						: editing
							? 'Edit shortcut'
							: 'Add shortcut'}
				</p>
				<button type="button" class="rounded-md p-1 hover:bg-muted" aria-label="Close" onclick={closeModal}>
					<span class="sr-only">Close</span>
					<span aria-hidden="true" class="text-lg leading-none">×</span>
				</button>
			</div>
			<div class="max-h-[70vh] overflow-y-auto p-4">
				{#if modalMode === 'folder'}
					{#if editingFolder}
						<form
							method="post"
							action="?/updateFolder"
							class="grid grid-cols-1 gap-4"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') closeModal();
								};
							}}
						>
							<input type="hidden" name="id" value={editingFolder.id} />
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
						<form
							method="post"
							action="?/createFolder"
							class="grid grid-cols-1 gap-4"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') closeModal();
								};
							}}
						>
							<div>
								<Label for="ql-folder-name-new">Folder name (optional)</Label>
								<Input id="ql-folder-name-new" name="name" bind:value={draftFolderName} placeholder="Leave empty for unnamed folder" />
							</div>
							{#if form?.error}
								<ErrorDetails status={400} message={form.error} errorId={form.errorId ?? undefined} />
							{/if}
							<div class="flex gap-2">
								<Button type="submit">Create</Button>
								<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
							</div>
						</form>
					{/if}
				{:else}
					{#if editing}
						<form
							method="post"
							action="?/update"
							class="grid grid-cols-1 gap-4"
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
							<div>
								<Label for="ql-notes">Notes (optional)</Label>
								<Textarea id="ql-notes" name="notes" bind:value={draftNotes} />
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
							class="grid grid-cols-1 gap-4"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') closeModal();
								};
							}}
						>
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
							<div>
								<Label for="ql-notes-new">Notes (optional)</Label>
								<Textarea id="ql-notes-new" name="notes" bind:value={draftNotes} />
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
