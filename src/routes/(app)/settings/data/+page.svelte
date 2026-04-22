<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Disclaimer from '$lib/components/shared/Disclaimer.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isOwner = $derived($page.data.workspace?.role === 'OWNER');
	let confirmName = $state('');
</script>

<PageHeader title="Data & privacy" description="Export, audit, demo data, and danger zone." />
<Disclaimer detailed class="mb-4" />

<div class="space-y-4">
	<Card class="p-4">
		<h2 class="text-sm font-semibold">Activity</h2>
		<p class="text-sm text-muted-foreground">Internal audit feed of important changes.</p>
		<Button variant="outline" class="mt-2" href="/settings/data/activity">Open activity</Button>
	</Card>

	<Card class="p-4">
		<h2 class="text-sm font-semibold">Export</h2>
		<p class="text-sm text-muted-foreground">Download a JSON snapshot of all your records (excluding raw uploaded files).</p>
		<Button variant="outline" class="mt-2" href="/api/export">Download JSON</Button>
	</Card>

	{#if data.hasDemo && isOwner}
		<Card class="p-4">
			<h2 class="text-sm font-semibold">Demo data</h2>
			<p class="text-sm text-muted-foreground">Records prefixed with <code>[Demo]</code> from the seed script. Safe to remove anytime.</p>
			<form method="post" action="?/removeDemo" use:enhance>
				<Button type="submit" variant="outline" class="mt-2">Remove demo data</Button>
			</form>
		</Card>
	{/if}

	{#if isOwner}
		<Card class="p-4">
			<h2 class="text-sm font-semibold">Trash</h2>
			<p class="text-sm text-muted-foreground">
				Permanently delete soft-deleted items.
				Currently: {Object.values(data.trashedCounts).reduce((a, b) => a + b, 0)} items in trash.
			</p>
			<form method="post" action="?/purgeTrash" use:enhance>
				<Button type="submit" variant="outline" class="mt-2">Empty trash</Button>
			</form>
		</Card>

		<Card class="border-destructive/40 bg-destructive/5 p-4">
			<h2 class="text-sm font-semibold text-destructive">Danger zone</h2>
			<p class="text-sm text-muted-foreground">
				Permanently delete this workspace and all its data. Type the workspace name to confirm.
			</p>
			<form method="post" action="?/deleteWorkspace" use:enhance class="mt-3 flex flex-col gap-2 md:flex-row">
				<Input name="confirm" placeholder={$page.data.workspace?.name ?? ''} bind:value={confirmName} />
				<Button type="submit" variant="destructive" disabled={confirmName !== ($page.data.workspace?.name ?? '')}>
					Delete workspace
				</Button>
			</form>
			{#if form?.error}<p class="mt-2 text-sm text-destructive">{form.error}</p>{/if}
		</Card>
	{/if}
</div>
