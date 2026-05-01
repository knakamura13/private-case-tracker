<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Dialog from '$lib/components/ui/Dialog.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Label from '$lib/components/ui/Label.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import { Plus, Folder, Link2, X } from 'lucide-svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';

    let { data, form }: { data: PageData; form: any } = $props();

    // Replicating logic from QuickLinksWidget to display structure
    const rootLinks = $derived(data.quickLinks.filter(l => !l.folderId));
    const folders = $derived(data.quickLinkFolders.sort((a, b) => a.order - b.order));
    
    let modalOpen = $state(false);
    let draftUrl = $state('');
    let draftTitle = $state('');
    let draftDescription = $state('');

    function openAdd() {
        draftUrl = '';
        draftTitle = '';
        draftDescription = '';
        modalOpen = true;
    }
</script>

<PageHeader 
    title="Quick links" 
    sub="Access your most-used resources and documents." 
    number={getPageNumber('/quick-links')} 
>
    {#snippet actions()}
        <Button variant="ghost" onclick={() => openAdd()}><Plus style="width: 14px; height: 14px;" /> Add link</Button>
    {/snippet}
</PageHeader>

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px; padding: 24px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-lg);">
    {#each folders as folder}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;" role="button" tabindex="0" onclick={() => console.log('Open folder:', folder.id)}>
            <div style="width: 64px; height: 64px; background: var(--lilac); border: 1px solid var(--lilac-d); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <Folder style="width: 32px; height: 32px; color: var(--lilac-d);" />
            </div>
            <span style="font-size: 13px; font-weight: 500;">{folder.name}</span>
        </div>
    {/each}

    {#each rootLinks as link}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;" role="button" tabindex="0" onclick={() => window.open(link.url, '_blank')}>
            <div style="width: 64px; height: 64px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <Link2 style="width: 32px; height: 32px; color: var(--ink-3);" />
            </div>
            <span style="font-size: 13px; font-weight: 500;">{link.title ?? 'Link'}</span>
        </div>
    {/each}

    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;" onclick={() => openAdd()}>
        <div style="width: 64px; height: 64px; background: var(--surface-3); border: 1px dashed var(--hairline); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            <Plus style="width: 32px; height: 32px; color: var(--ink-4);" />
        </div>
        <span style="font-size: 13px; font-weight: 500; color: var(--ink-3);">Add link</span>
    </div>
</div>

{#if modalOpen}
    <Dialog open={modalOpen} onClose={() => modalOpen = false} maxWidth="max-w-md">
        <form
            method="post"
            action="?/create"
            class="modal-form"
            use:enhance={() => {
                return async ({ result, update }) => {
                    await update();
                    if (result.type === 'redirect') modalOpen = false;
                };
            }}
        >
            <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 12px; font-size: 20px;">
                    Add link
                </div>
                <Button type="button" variant="ghost" size="sm" onclick={() => modalOpen = false}>
                    <X size={16} />
                </Button>
            </div>
            <div class="modal-content" style="display: flex; flex-direction: column; gap: 16px;">
                <Input
                    name="url"
                    bind:value={draftUrl}
                    placeholder="URL"
                    required
                />
                <div>
                    <Label for="ql-title-new">Title (optional)</Label>
                    <Input
                        id="ql-title-new"
                        name="title"
                        bind:value={draftTitle}
                    />
                </div>
                <div>
                    <Label for="ql-description-new">Description (optional)</Label>
                    <Textarea id="ql-description-new" name="description" rows={2} bind:value={draftDescription} />
                </div>
            </div>
            <div class="modal-footer">
                <Button type="button" variant="outline" onclick={() => modalOpen = false}>Cancel</Button>
                <Button type="submit">Add</Button>
            </div>
        </form>
    </Dialog>
{/if}
