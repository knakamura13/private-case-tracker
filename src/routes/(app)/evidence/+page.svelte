<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
	import { enhance } from '$app/forms';
	import { Plus, Minus, Check, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-svelte';
	import { getPageNumber } from '$lib/constants/navigation';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { error?: string } } = $props();

	let editingCategory = $state<string | null>(null);
	let editTarget = $state(0);
	let showAddModal = $state(false);
	let showRenameModal = $state(false);
	let showDeleteModal = $state(false);
	let dropdownOpen = $state<string | null>(null);
	let newCategoryName = $state('');
	let renameOldName = $state('');
	let renameNewName = $state('');
	let deleteCategoryName = $state('');

	function startEdit(category: string, currentTarget: number) {
		editingCategory = category;
		editTarget = currentTarget;
		dropdownOpen = null;
	}

	function cancelEdit() {
		editingCategory = null;
	}

	function openAddModal() {
		newCategoryName = '';
		showAddModal = true;
	}

	function openRenameModal(category: string) {
		renameOldName = category;
		renameNewName = category;
		showRenameModal = true;
		dropdownOpen = null;
	}

	function openDeleteModal(category: string) {
		deleteCategoryName = category;
		showDeleteModal = true;
		dropdownOpen = null;
	}

	function toggleDropdown(category: string) {
		dropdownOpen = dropdownOpen === category ? null : category;
	}
</script>

<PageHeader title="Evidence" description="Track evidence collection progress by category." number={getPageNumber('/evidence')}>
	{#snippet actions()}
		{#if data.isOwner}
			<Button onclick={openAddModal}>
				{#snippet children()}<Plus class="h-4 w-4" /> Add category{/snippet}
			</Button>
		{/if}
	{/snippet}
</PageHeader>

{#if form?.error}
	<Card class="mb-4 border-destructive/50 bg-destructive/10 p-4 text-destructive">
		{form.error}
	</Card>
{/if}

<div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
	{#each data.categories as cat}
		<Card class="p-4">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<h3 class="font-semibold">{cat.category}</h3>
					{#if editingCategory === cat.category}
						<form
							method="post"
							action="?/updateTarget"
							class="flex items-center gap-1"
							use:enhance={() => {
								return async ({ result: _result, update }) => {
									await update({ reset: false });
									cancelEdit();
								};
							}}
						>
							<input type="hidden" name="category" value={cat.category} />
							<span class="text-sm text-muted-foreground">{cat.currentCount} / </span>
							<input
								type="number"
								name="target"
								bind:value={editTarget}
								min="0"
								max="99"
								class="w-14 rounded border border-border bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
								onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
							/>
							<button type="submit" class="text-success hover:text-success/80" aria-label="Save">
								<Check class="h-4 w-4" />
							</button>
							<button type="button" class="text-muted-foreground hover:text-foreground" aria-label="Cancel" onclick={cancelEdit}>
								<X class="h-4 w-4" />
							</button>
						</form>
					{:else}
						<button
							type="button"
							class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
							aria-label="Edit target for {cat.category}"
							onclick={() => startEdit(cat.category, cat.targetCount)}
						>
							<span>{cat.currentCount} / {cat.targetCount}</span>
							<Pencil class="h-3 w-3" />
						</button>
					{/if}
				</div>
				{#if data.isOwner}
					<DropdownMenu isOpen={dropdownOpen === cat.category} onClose={() => dropdownOpen = null}>
						{#snippet trigger()}
							<button
								type="button"
								class="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								aria-label="Menu for {cat.category}"
								onclick={() => toggleDropdown(cat.category)}
							>
								<MoreHorizontal class="h-4 w-4" />
							</button>
						{/snippet}
						{#snippet children()}
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-left hover:bg-muted"
								onclick={() => openRenameModal(cat.category)}
							>
								<Pencil class="h-3 w-3" />
								Rename
							</button>
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-left text-destructive hover:bg-destructive/10"
								onclick={() => openDeleteModal(cat.category)}
							>
								<Trash2 class="h-3 w-3" />
								Delete
							</button>
						{/snippet}
					</DropdownMenu>
				{/if}
			</div>
			<div class="mb-4 h-2 overflow-hidden rounded bg-muted">
				<div
					class="h-full bg-primary transition-all"
					style:width={`${Math.min(100, cat.targetCount > 0 ? (cat.currentCount / cat.targetCount) * 100 : cat.currentCount > 0 ? 100 : 0)}%`}
				></div>
			</div>
			<div class="flex items-center justify-between">
				<form method="post" action="?/adjustCount" class="flex gap-2" use:enhance>
					<input type="hidden" name="category" value={cat.category} />
					<input type="hidden" name="delta" value="-1" />
					<button
						type="submit"
						class="rounded border border-border p-1.5 hover:bg-muted disabled:opacity-50"
						disabled={cat.currentCount === 0}
						aria-label="Decrease {cat.category} count"
					>
						<Minus class="h-3.5 w-3.5" />
					</button>
				</form>
				<form method="post" action="?/adjustCount" class="flex gap-2" use:enhance>
					<input type="hidden" name="category" value={cat.category} />
					<input type="hidden" name="delta" value="1" />
					<button
						type="submit"
						class="rounded border border-border p-1.5 hover:bg-muted"
						aria-label="Increase {cat.category} count"
					>
						<Plus class="h-3.5 w-3.5" />
					</button>
				</form>
			</div>
		</Card>
	{/each}
</div>

<!-- Add Category Modal -->
{#if showAddModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => showAddModal = false}
		onkeydown={(e) => { if (e.key === 'Escape') showAddModal = false; }}
	>
		<Card class="w-full max-w-md p-6" onclick={(e) => e.stopPropagation()}>
			<h2 id="add-category-title" class="mb-4 text-lg font-semibold">Add Category</h2>
			<form
				method="post"
				action="?/addCategory"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false });
						if (result.type !== 'failure') {
							showAddModal = false;
							newCategoryName = '';
						}
					};
				}}
			>
				<div class="mb-4">
					<label for="newCategory" class="mb-1 block text-sm font-medium">Category name</label>
					<input
						id="newCategory"
						name="category"
						type="text"
						bind:value={newCategoryName}
						maxlength="80"
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						placeholder="e.g., Passport"
						onkeydown={(e) => { if (e.key === 'Escape') showAddModal = false; }}
					/>
				</div>
				<div class="flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={() => showAddModal = false}>Cancel</Button>
					<Button type="submit">Add</Button>
				</div>
			</form>
		</Card>
	</div>
{/if}

<!-- Rename Category Modal -->
{#if showRenameModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => showRenameModal = false}
		onkeydown={(e) => { if (e.key === 'Escape') showRenameModal = false; }}
	>
		<Card class="w-full max-w-md p-6" onclick={(e) => e.stopPropagation()}>
			<h2 class="mb-4 text-lg font-semibold">Rename Category</h2>
			<form
				method="post"
				action="?/renameCategory"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false });
						if (result.type !== 'failure') {
							showRenameModal = false;
							renameOldName = '';
							renameNewName = '';
						}
					};
				}}
			>
				<input type="hidden" name="oldName" value={renameOldName} />
				<div class="mb-4">
					<label for="renameCategory" class="mb-1 block text-sm font-medium">New name</label>
					<input
						id="renameCategory"
						name="newName"
						type="text"
						bind:value={renameNewName}
						maxlength="80"
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						placeholder="e.g., Passport"
						onkeydown={(e) => { if (e.key === 'Escape') showRenameModal = false; }}
					/>
				</div>
				<div class="flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={() => showRenameModal = false}>Cancel</Button>
					<Button type="submit">Rename</Button>
				</div>
			</form>
		</Card>
	</div>
{/if}

<!-- Delete Category Modal -->
{#if showDeleteModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => showDeleteModal = false}
		onkeydown={(e) => { if (e.key === 'Escape') showDeleteModal = false; }}
	>
		<Card class="w-full max-w-md p-6" onclick={(e) => e.stopPropagation()}>
			<h2 class="mb-2 text-lg font-semibold">Delete Category</h2>
			<p class="mb-4 text-sm text-muted-foreground">
				Are you sure you want to delete "{deleteCategoryName}"? This action cannot be undone.
			</p>
			<form
				method="post"
				action="?/deleteCategory"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false });
						if (result.type !== 'failure') {
							showDeleteModal = false;
							deleteCategoryName = '';
						}
					};
				}}
			>
				<input type="hidden" name="category" value={deleteCategoryName} />
				<div class="flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={() => showDeleteModal = false}>Cancel</Button>
					<Button type="submit" variant="destructive">Delete</Button>
				</div>
			</form>
		</Card>
	</div>
{/if}
