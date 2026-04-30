<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isOwner = $derived($page.data.workspace?.role === 'OWNER');
	let confirmName = $state('');
</script>

<PageHeader title="Data & privacy" description="Export, audit, demo data, and danger zone." />

<div class="settings-data-container">
	<Card class="settings-data-card">
		<h2>Activity</h2>
		<p>Internal audit feed of important changes.</p>
		<Button variant="outline" class="settings-data-mt-2" href="/settings/data/activity">Open activity</Button>
	</Card>

	<Card class="settings-data-card">
		<h2>Export</h2>
		<p>Download a JSON snapshot of all your records (excluding raw uploaded files).</p>
		<Button variant="outline" class="settings-data-mt-2" href="/api/export">Download JSON</Button>
	</Card>

	{#if data.hasDemo && isOwner}
		<Card class="settings-data-card">
			<h2>Demo data</h2>
			<p>Records prefixed with <code>[Demo]</code> from the seed script. Safe to remove anytime.</p>
			<form method="post" action="?/removeDemo" use:enhance>
				<Button type="submit" variant="outline" class="settings-data-mt-2">Remove demo data</Button>
			</form>
		</Card>
	{/if}

	{#if isOwner}
		<Card class="settings-data-card">
			<h2>Trash</h2>
			<p>
				Permanently delete soft-deleted items.
				Currently: {Object.values(data.trashedCounts).reduce((a, b) => a + b, 0)} items in trash.
			</p>
			<form method="post" action="?/purgeTrash" use:enhance>
				<Button type="submit" variant="outline" class="settings-data-mt-2">Empty trash</Button>
			</form>
		</Card>

		<Card class="settings-data-card settings-data-danger">
			<h2>Danger zone</h2>
			<p>
				Permanently delete this workspace and all its data. Type the workspace name to confirm.
			</p>
			<form method="post" action="?/deleteWorkspace" use:enhance class="settings-data-mt-3 settings-data-flex settings-data-flex-col settings-data-gap-2 settings-data-md-flex-row">
				<Input name="confirm" placeholder={$page.data.workspace?.name ?? ''} bind:value={confirmName} />
				<Button type="submit" variant="destructive" disabled={confirmName !== ($page.data.workspace?.name ?? '')}>
					Delete workspace
				</Button>
			</form>
			{#if form?.error}<p class="settings-data-mt-2 settings-data-text-sm settings-data-text-destructive">{form.error}</p>{/if}
		</Card>
	{/if}
</div>
