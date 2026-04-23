<script lang="ts">
	import type { QuickLink } from '@prisma/client';
	import { enhance } from '$app/forms';
	import { EllipsisVertical, Plus, Link2 } from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';

	type ActionForm = { error?: string; errorId?: string | null } | undefined;

	let { links, form }: { links: QuickLink[]; form?: ActionForm } = $props();

	let modalOpen = $state(false);
	let editing = $state<QuickLink | null>(null);
	let draftUrl = $state('');
	let draftTitle = $state('');
	let draftDescription = $state('');
	let draftNotes = $state('');
	let menuOpenId = $state<string | null>(null);
	let brokenFavicons = $state<Set<string>>(new Set());

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
		editing = null;
		draftUrl = '';
		draftTitle = '';
		draftDescription = '';
		draftNotes = '';
		modalOpen = true;
		menuOpenId = null;
	}

	function openEdit(link: QuickLink) {
		editing = link;
		draftUrl = link.url;
		draftTitle = link.title ?? '';
		draftDescription = link.description ?? '';
		draftNotes = link.notes ?? '';
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
	}

	function markFaviconBroken(id: string) {
		const next = new Set(brokenFavicons);
		next.add(id);
		brokenFavicons = next;
	}

	$effect(() => {
		if (menuOpenId === null) return;
		const onDoc = (e: MouseEvent) => {
			const t = e.target;
			if (!(t instanceof HTMLElement)) return;
			if (t.closest('[data-quicklink-menu]')) return;
			menuOpenId = null;
		};
		document.addEventListener('click', onDoc, true);
		return () => document.removeEventListener('click', onDoc, true);
	});
</script>

<!--
  Each tile: fixed width, flex-col, circle on top, label below.
  The ⋮ button is positioned relative to the circle span itself,
  so it doesn't push the circle down or affect alignment.
-->
<div class="flex flex-wrap items-start gap-1 sm:gap-2">
	{#each links as link (link.id)}
		<div
			class="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg px-1 py-2 hover:bg-muted/40 focus-within:bg-muted/40"
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
						class="absolute left-1/2 top-full z-20 mt-1 min-w-[8.5rem] -translate-x-1/2 rounded-md border border-border bg-card py-1 text-sm shadow-md"
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
					{editing ? 'Edit shortcut' : 'Add shortcut'}
				</p>
				<button type="button" class="rounded-md p-1 hover:bg-muted" aria-label="Close" onclick={closeModal}>
					<span class="sr-only">Close</span>
					<span aria-hidden="true" class="text-lg leading-none">×</span>
				</button>
			</div>
			<div class="max-h-[70vh] overflow-y-auto p-4">
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
			</div>
		</div>
	</div>
{/if}
