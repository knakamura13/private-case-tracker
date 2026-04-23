<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/utils/dates';
	import type { ActionData, PageData } from './$types';
	import { page } from '$app/stores';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const isOwner = $derived($page.data.workspace?.role === 'OWNER');

	let copied = $state(false);

	async function copyToClipboard(url: string) {
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<PageHeader title="Members" description="This workspace is designed for two users." />

<Card class="mb-6 p-4">
	<h2 class="mb-3 text-sm font-semibold">Active members</h2>
	<ul class="divide-y divide-border">
		{#each data.members as m (m.id)}
			<li class="flex items-center justify-between py-2 text-sm">
				<div>
					<p class="font-medium">{m.user.name ?? m.user.email}</p>
					<p class="text-xs text-muted-foreground">{m.user.email}</p>
				</div>
				<div class="flex items-center gap-2">
					<Badge>{m.role}</Badge>
					{#if isOwner && m.user.id !== $page.data.user?.id}
						<form method="post" action="?/removeMember" use:enhance>
							<input type="hidden" name="userId" value={m.user.id} />
							<Button type="submit" variant="destructive" size="sm">Remove</Button>
						</form>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</Card>

{#if isOwner}
	<Card class="mb-6 p-4">
		<h2 class="mb-3 text-sm font-semibold">Invite a user</h2>
		<form method="post" action="?/invite" use:enhance class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]">
			<div>
				<Label for="email">Email</Label>
				<Input id="email" name="email" type="email" required />
			</div>
			<div>
				<Label for="role">Role</Label>
				<Select id="role" name="role" value="COLLABORATOR">
					<option value="COLLABORATOR">Collaborator</option>
					<option value="OWNER">Owner</option>
				</Select>
			</div>
			<div class="flex items-end"><Button type="submit">Create invite link</Button></div>
			{#if form?.error}<p class="md:col-span-3 text-sm text-destructive">{form.error}</p>{/if}
		</form>
		{#if form?.ok && form?.inviteUrl}
			<div class="mt-4 rounded-lg border border-border bg-muted/50 p-3">
				<p class="mb-2 text-sm font-medium">Invite link created</p>
				<div class="flex items-center gap-2">
					<code class="flex-1 truncate rounded bg-background px-2 py-1 text-xs">{form.inviteUrl}</code>
					<Button onclick={() => copyToClipboard(form.inviteUrl)} size="sm" variant="outline">
						{copied ? 'Copied!' : 'Copy'}
					</Button>
				</div>
				<p class="mt-2 text-xs text-muted-foreground">Share this link with the user. It expires in 7 days.</p>
			</div>
		{/if}
	</Card>

	{#if data.invitations.length > 0}
		<Card class="p-4">
			<h2 class="mb-3 text-sm font-semibold">Pending invitations</h2>
			<ul class="divide-y divide-border">
				{#each data.invitations as inv (inv.id)}
					<li class="flex items-center justify-between py-2 text-sm">
						<div>
							<p class="font-medium">{inv.email}</p>
							<p class="text-xs text-muted-foreground">{inv.role} · expires {fmtDate(inv.expiresAt)}</p>
						</div>
						<form method="post" action="?/revoke" use:enhance>
							<input type="hidden" name="id" value={inv.id} />
							<Button type="submit" variant="outline" size="sm">Revoke</Button>
						</form>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}
{/if}
