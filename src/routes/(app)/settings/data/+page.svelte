<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Shield, Download, FileJson, Trash2, AlertTriangle, Activity } from 'lucide-svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isOwner = $derived($page.data.workspace?.role === 'OWNER');
	let confirmName = $state('');

    const trashedTotal = $derived(Object.values(data.trashedCounts).reduce((a, b) => a + b, 0));
</script>

<PageHeader title="Settings" sub="Data, privacy, and workspace management." />

<div style="max-width: 880px; display: flex; flex-direction: column; gap: 24px;">
    <!-- Privacy & Export Card (Tinted Sage as per Phase 9) -->
    <div class="card tinted-sage" style="padding: 24px;">
        <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--sage-fill); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <Shield style="width: 24px; height: 24px;" />
            </div>
            <div>
                <h2 class="display" style="font-size: 24px; margin: 0 0 4px 0;">Privacy & Backups</h2>
                <p style="font-size: 13px; color: var(--sage-d); margin: 0;">Your data is encrypted and private to your workspace members.</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="card" style="padding: 16px; background: rgba(255, 255, 255, 0.5); border-color: var(--sage-d);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <FileJson style="width: 18px; height: 18px; color: var(--sage-fill);" />
                    <span style="font-size: 14px; font-weight: 600;">JSON Snapshot</span>
                </div>
                <p style="font-size: 12px; color: var(--ink-2); margin-bottom: 12px;">Download all your records in a machine-readable format.</p>
                <Button variant="outline" size="sm" href="/api/export" style="width: 100%;">
                    <Download style="width: 14px; height: 14px; margin-right: 6px;" /> Download JSON
                </Button>
            </div>
            
            <div class="card" style="padding: 16px; background: rgba(255, 255, 255, 0.5); border-color: var(--sage-d);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <Activity style="width: 18px; height: 18px; color: var(--sage-fill);" />
                    <span style="font-size: 14px; font-weight: 600;">Audit Feed</span>
                </div>
                <p style="font-size: 12px; color: var(--ink-2); margin-bottom: 12px;">Review a timeline of important changes and access logs.</p>
                <Button variant="outline" size="sm" href="/settings/data/activity" style="width: 100%;">
                    Open activity feed
                </Button>
            </div>
        </div>
    </div>

    <!-- Maintenance Card -->
    <div class="card" style="padding: 24px;">
        <h2 class="display" style="font-size: 24px; margin-bottom: 20px;">Maintenance</h2>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
            {#if data.hasDemo && isOwner}
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--surface-2); border-radius: var(--r-md);">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">Demo Data</div>
                        <p style="font-size: 12px; color: var(--ink-3); margin: 4px 0 0 0;">Remove seed records used for testing.</p>
                    </div>
                    <form method="post" action="?/removeDemo" use:enhance>
                        <Button type="submit" variant="outline" size="sm">Purge demo</Button>
                    </form>
                </div>
            {/if}

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--surface-2); border-radius: var(--r-md);">
                <div>
                    <div style="font-size: 14px; font-weight: 600;">Trash Bin</div>
                    <p style="font-size: 12px; color: var(--ink-3); margin: 4px 0 0 0;">Currently {trashedTotal} items pending permanent deletion.</p>
                </div>
                <form method="post" action="?/purgeTrash" use:enhance>
                    <Button type="submit" variant="outline" size="sm" disabled={trashedTotal === 0}>Empty trash</Button>
                </form>
            </div>
        </div>
    </div>

    <!-- Danger Zone (Tinted Blush as per Phase 9) -->
    {#if isOwner}
        <div class="card tinted-blush" style="padding: 24px;">
            <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--blush-fill); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <AlertTriangle style="width: 24px; height: 24px;" />
                </div>
                <div>
                    <h2 class="display" style="font-size: 24px; margin: 0 0 4px 0; color: var(--blush-d);">Danger Zone</h2>
                    <p style="font-size: 13px; color: var(--blush-d); margin: 0;">Irreversible actions for your entire case.</p>
                </div>
            </div>

            <div class="card" style="padding: 20px; background: rgba(255, 255, 255, 0.5); border-color: var(--blush-d);">
                <p style="font-size: 13px; color: var(--ink); margin-bottom: 16px;">
                    Permanently delete this workspace and all its data. This cannot be undone. 
                    Type <strong style="color: var(--blush-d);">{$page.data.workspace?.name}</strong> to confirm.
                </p>
                <form method="post" action="?/deleteWorkspace" use:enhance style="display: flex; gap: 12px;">
                    <input 
                        name="confirm" 
                        class="input" 
                        placeholder={$page.data.workspace?.name ?? ''} 
                        bind:value={confirmName} 
                        style="flex: 1; border-color: var(--blush-d);"
                    />
                    <Button type="submit" variant="destructive" disabled={confirmName !== ($page.data.workspace?.name ?? '')}>
                        Delete workspace
                    </Button>
                </form>
                {#if form?.error}<p style="margin-top: 12px; font-size: 13px; color: var(--blush-d);">{form.error}</p>{/if}
            </div>
        </div>
    {/if}
</div>
