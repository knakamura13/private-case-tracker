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

<PageHeader title="Evidence" sub="Track evidence collection progress by category." number={getPageNumber('/evidence')}>
	{#snippet actions()}
		{#if data.isOwner}
			<Button onclick={openAddModal}>
				{#snippet children()}<Plus class="evidence-icon-sm" /> Add category{/snippet}
			</Button>
		{/if}
	{/snippet}
</PageHeader>

{#if form?.error}
	<Card class="evidence-mb-4 evidence-border-destructive evidence-bg-destructive-10 evidence-p-4 evidence-text-destructive">
		{form.error}
	</Card>
{/if}

<div class="evidence-grid">
	{#each data.categories as cat (cat.category)}
		<Card class="evidence-card">
			<div class="evidence-card-header">
				<div class="evidence-card-title">
					<h3>{cat.category}</h3>
					{#if editingCategory === cat.category}
						<form
							method="post"
							action="?/updateTarget"
							class="evidence-target-edit"
							use:enhance={() => {
								return async ({ result: _result, update }) => {
									await update({ reset: false });
									cancelEdit();
								};
							}}
						>
							<input type="hidden" name="category" value={cat.category} />
							<span class="evidence-text-sm evidence-text-muted">{cat.currentCount} / </span>
							<input
								type="number"
								name="target"
								bind:value={editTarget}
								min="0"
								max="99"
								class="evidence-target-input"
								onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
							/>
							<button type="submit" class="evidence-text-success evidence-hover-success" aria-label="Save">
								<Check class="evidence-icon-sm" />
							</button>
							<button type="button" class="evidence-text-muted evidence-hover-foreground" aria-label="Cancel" onclick={cancelEdit}>
								<X class="evidence-icon-sm" />
							</button>
						</form>
					{:else}
						<button
							type="button"
							class="evidence-flex evidence-items-center evidence-gap-1 evidence-text-sm evidence-text-muted evidence-hover-foreground"
							aria-label="Edit target for {cat.category}"
							onclick={() => startEdit(cat.category, cat.targetCount)}
						>
							<span>{cat.currentCount} / {cat.targetCount}</span>
							<Pencil class="evidence-icon-xs" />
						</button>
					{/if}
				</div>
				{#if data.isOwner}
					<DropdownMenu isOpen={dropdownOpen === cat.category} onClose={() => dropdownOpen = null}>
						{#snippet trigger()}
							<button
								type="button"
								class="evidence-rounded evidence-p-1-5 evidence-text-muted evidence-hover-muted evidence-hover-foreground"
								aria-label="Menu for {cat.category}"
								onclick={() => toggleDropdown(cat.category)}
							>
								<MoreHorizontal class="evidence-icon-sm" />
							</button>
						{/snippet}
						{#snippet children()}
							<button
								type="button"
								class="evidence-flex evidence-w-full evidence-items-center evidence-gap-2 evidence-rounded evidence-px-2 evidence-py-1-5 evidence-text-sm evidence-text-left evidence-hover-muted"
								onclick={() => openRenameModal(cat.category)}
							>
								<Pencil class="evidence-icon-xs" />
								Rename
							</button>
							<button
								type="button"
								class="evidence-flex evidence-w-full evidence-items-center evidence-gap-2 evidence-rounded evidence-px-2 evidence-py-1-5 evidence-text-sm evidence-text-left evidence-text-destructive evidence-hover-destructive-10"
								onclick={() => openDeleteModal(cat.category)}
							>
								<Trash2 class="evidence-icon-xs" />
								Delete
							</button>
						{/snippet}
					</DropdownMenu>
				{/if}
			</div>
			<div class="evidence-progress-bar">
				<div
					class="evidence-progress-fill"
					style:width={`${Math.min(100, cat.targetCount > 0 ? (cat.currentCount / cat.targetCount) * 100 : cat.currentCount > 0 ? 100 : 0)}%`}
				></div>
			</div>
			<div class="evidence-card-actions">
				<form method="post" action="?/adjustCount" class="evidence-flex evidence-gap-2" use:enhance>
					<input type="hidden" name="category" value={cat.category} />
					<input type="hidden" name="delta" value="-1" />
					<button
						type="submit"
						class="evidence-count-btn"
						disabled={cat.currentCount === 0}
						aria-label="Decrease {cat.category} count"
					>
						<Minus class="evidence-icon-3-5" />
					</button>
				</form>
				<form method="post" action="?/adjustCount" class="evidence-flex evidence-gap-2" use:enhance>
					<input type="hidden" name="category" value={cat.category} />
					<input type="hidden" name="delta" value="1" />
					<button
						type="submit"
						class="evidence-count-btn"
						aria-label="Increase {cat.category} count"
					>
						<Plus class="evidence-icon-3-5" />
					</button>
				</form>
			</div>
		</Card>
	{/each}
</div>

<!-- Add Category Modal -->
{#if showAddModal}
	<div
		class="widget-popover"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => showAddModal = false}
		onkeydown={(e) => { if (e.key === 'Escape') showAddModal = false; }}
	>
		<button
			type="button"
			class="widget-popover-overlay"
			aria-label="Close"
			onclick={() => showAddModal = false}
		></button>
		<Card class="widget-popover-panel modal-form" onclick={(e) => e.stopPropagation()}>
			<h2 id="add-category-title" class="modal-header-title">Add Category</h2>
			<form
				method="post"
				action="?/addCategory"
				class="modal-form-grid"
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
				<div>
					<label for="newCategory" class="form-label">Category name</label>
					<input
						id="newCategory"
						name="category"
						type="text"
						bind:value={newCategoryName}
						maxlength="80"
						class="form-input"
						placeholder="e.g., Passport"
						onkeydown={(e) => { if (e.key === 'Escape') showAddModal = false; }}
					/>
				</div>
				<div class="modal-actions">
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
		class="widget-popover"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => showRenameModal = false}
		onkeydown={(e) => { if (e.key === 'Escape') showRenameModal = false; }}
	>
		<button
			type="button"
			class="widget-popover-overlay"
			aria-label="Close"
			onclick={() => showRenameModal = false}
		></button>
		<Card class="widget-popover-panel modal-form" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-header-title">Rename Category</h2>
			<form
				method="post"
				action="?/renameCategory"
				class="modal-form-grid"
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
				<div>
					<label for="renameCategory" class="form-label">New name</label>
					<input
						id="renameCategory"
						name="newName"
						type="text"
						bind:value={renameNewName}
						maxlength="80"
						class="form-input"
						placeholder="e.g., Passport"
						onkeydown={(e) => { if (e.key === 'Escape') showRenameModal = false; }}
					/>
				</div>
				<div class="modal-actions">
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
		class="widget-popover"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => showDeleteModal = false}
		onkeydown={(e) => { if (e.key === 'Escape') showDeleteModal = false; }}
	>
		<button
			type="button"
			class="widget-popover-overlay"
			aria-label="Close"
			onclick={() => showDeleteModal = false}
		></button>
		<Card class="widget-popover-panel modal-form" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-header-title">Delete Category</h2>
			<p class="modal-description">
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
				<div class="modal-actions">
					<Button type="button" variant="ghost" onclick={() => showDeleteModal = false}>Cancel</Button>
					<Button type="submit" variant="destructive">Delete</Button>
				</div>
			</form>
		</Card>
	</div>
{/if}
