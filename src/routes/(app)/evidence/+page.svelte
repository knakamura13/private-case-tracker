<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { enhance } from '$app/forms';
    import { Plus, FileText } from 'lucide-svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import type { PageData } from './$types';

    let { data, form }: { data: PageData; form: { error?: string } } = $props();

    let showAddModal = $state(false);
    let newCategoryName = $state('');

    function openAddModal() {
        newCategoryName = '';
        showAddModal = true;
    }

    const totalCollected = $derived(data.categories.reduce((acc, cat) => acc + cat.currentCount, 0));
    const totalTarget = $derived(data.categories.reduce((acc, cat) => acc + cat.targetCount, 0));
</script>

<PageHeader
    eyebrow={`${totalCollected} of ${totalTarget} items collected`}
    title="Evidence"
    sub="Track evidence collection progress by category."
    number={getPageNumber('/evidence')}
>
    {#snippet actions()}
        {#if data.isOwner}
            <Button onclick={openAddModal}>
                {#snippet children()}<Plus style="width: 14px; height: 14px;" /> Add category{/snippet}
            </Button>
        {/if}
    {/snippet}
</PageHeader>

{#if form?.error}
    <div
        class="card"
        style="border: 1px solid var(--blush-d); background: var(--blush); padding: 16px; margin-bottom: 16px; color: var(--blush-d);"
    >
        {form.error}
    </div>
{/if}

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 48px;">
    {#each data.categories as cat (cat.category)}
        <div class="card tinted-lilac" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; color: var(--ink-3);">
                    <FileText style="width: 16px; height: 16px;" />
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">{cat.category}</span
                    >
                </div>
            </div>
            <div style="font-family: var(--font-display); font-size: 44px; font-weight: 500; line-height: 1; margin-bottom: 4px;">
                {cat.currentCount}
                <span style="font-family: var(--font-mono); font-size: 11px; color: var(--ink-3);">/ {cat.targetCount}</span>
            </div>
            <div style="height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden; margin-top: 12px;">
                <div
                    style:width={`${Math.min(100, cat.targetCount > 0 ? (cat.currentCount / cat.targetCount) * 100 : 0)}%`}
                    style="height: 100%; background: var(--lilac-d);"
                ></div>
            </div>
        </div>
    {/each}
</div>

<!-- Per-category item list -->
<div style="display: flex; flex-direction: column; gap: 32px;">
    {#each data.categories as cat (cat.category)}
        <div class="card" style="padding: 0; overflow: hidden;">
            <div
                style="padding: 16px 20px; border-bottom: 1px solid var(--hairline); display: flex; align-items: center; justify-content: space-between; background: var(--surface);"
            >
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--lilac-fill);"></div>
                    <h3 class="display" style="font-size: 20px; margin: 0;">{cat.category}</h3>
                    <span class="mono" style="font-size: 11px; color: var(--ink-3);">{cat.currentCount} / {cat.targetCount}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <form method="post" action="?/adjustCount" use:enhance style="display: flex; gap: 4px;">
                        <input type="hidden" name="category" value={cat.category} />
                        <Button type="submit" name="delta" value="-1" variant="ghost" size="sm" disabled={cat.currentCount <= 0}>-</Button>
                        <Button type="submit" name="delta" value="1" variant="ghost" size="sm">+</Button>
                    </form>
                    <Button variant="ghost" size="sm">
                        <Plus style="width: 14px; height: 14px; margin-right: 4px;" /> Add item
                    </Button>
                </div>
            </div>
        </div>
    {/each}
</div>

<!-- Add Category Modal -->
{#if showAddModal}
    <div
        role="button"
        tabindex="0"
        class="backdrop-blur-sm"
        style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 100;"
        onclick={() => (showAddModal = false)}
        onkeydown={(e) => {
            if (e.key === 'Escape') showAddModal = false;
        }}
    >
        <div
            class="card"
            style="width: 400px; padding: 24px;"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
            }}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
        >
            <h2 style="font-family: var(--font-display); font-size: 24px; margin-bottom: 16px;">Add Category</h2>
            <form method="post" action="?/addCategory" use:enhance>
                <label for="newCategory" style="display: block; font-size: 13px; margin-bottom: 4px;">Category name</label>
                <input
                    id="newCategory"
                    name="category"
                    type="text"
                    bind:value={newCategoryName}
                    maxlength="80"
                    class="input"
                    style="width: 100%; margin-bottom: 16px;"
                    placeholder="e.g., Passport"
                />
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <Button type="button" variant="ghost" onclick={() => (showAddModal = false)}>Cancel</Button>
                    <Button type="submit">Add</Button>
                </div>
            </form>
        </div>
    </div>
{/if}
