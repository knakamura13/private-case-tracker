<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Trash2 } from 'lucide-svelte';
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

<PageHeader title="Members" sub="This workspace is designed for two users." />

<Card class="settings-members-card">
	<h2>Active members</h2>
	<ul class="settings-members-list">
		{#each data.members as m (m.id)}
			<li class="settings-members-item">
				<div>
					<p class="settings-members-font-medium">{m.user.name ?? m.user.email}</p>
					<p class="settings-members-text-xs settings-members-text-muted">{m.user.email}</p>
				</div>
				<div class="settings-members-item-actions">
					{#if isOwner && m.user.id !== $page.data.user?.id}
						<form method="post" action="?/removeMember" use:enhance>
							<input type="hidden" name="userId" value={m.user.id} />
							<Button type="submit" variant="destructive" size="sm" aria-label="Remove member">
								<Trash2 class="settings-members-icon-sm" />
							</Button>
						</form>
					{/if}
					<Badge>{m.role}</Badge>
				</div>
			</li>
		{/each}
	</ul>
</Card>

{#if isOwner}
	<Card class="settings-members-card">
		<h2>Invite a user</h2>
		<form method="post" action="?/invite" use:enhance class="settings-members-invite-form">
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
			<div class="settings-members-flex settings-members-items-end"><Button type="submit">Create invite link</Button></div>
			{#if form?.error}<p class="settings-members-md-col-span-3 settings-members-text-sm settings-members-text-destructive">{form.error}</p>{/if}
		</form>
		{#if form?.ok && form?.inviteUrl}
			<div class="settings-members-invite-result">
				<p>Invite link created</p>
				<div class="settings-members-invite-url">
					<code>{form.inviteUrl}</code>
					<Button onclick={() => copyToClipboard(form.inviteUrl)} size="sm" variant="outline">
						{copied ? 'Copied!' : 'Copy'}
					</Button>
				</div>
				<p class="settings-members-mt-2 settings-members-text-xs settings-members-text-muted">Share this link with the user. It expires in 7 days.</p>
			</div>
		{/if}
	</Card>

	{#if data.invitations.length > 0}
		<Card class="settings-members-card">
			<h2>Pending invitations</h2>
			<ul class="settings-members-list">
				{#each data.invitations as inv (inv.id)}
					<li class="settings-members-item">
						<div>
							<p class="settings-members-font-medium">{inv.email}</p>
							<p class="settings-members-text-xs settings-members-text-muted">{inv.role} · expires {fmtDate(inv.expiresAt)}</p>
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
