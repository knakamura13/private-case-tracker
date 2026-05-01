<script lang="ts">
	import AuthShell from '$lib/components/layout/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<AuthShell
	title={data.isFirstUser ? 'Name your workspace' : 'Waiting for invitation'}
	subtitle={data.isFirstUser
		? 'Create a shared workspace for your two-person case.'
		: 'Your account exists, but you have not been invited to a workspace yet.'}
>
	{#if data.isFirstUser}
		<form method="post" action="?/create" style="display: flex; flex-direction: column; gap: 16px;">
			<div>
				<label for="name" style="display: block; font-size: 13px; margin-bottom: 4px;">Workspace name</label>
				<input id="name" name="name" value="Our case" required class="input" style="width: 100%;" />
			</div>
			{#if form?.error}<p style="font-size: 13px; color: var(--blush-d);">{form.error}</p>{/if}
			<Button type="submit" style="width: 100%;">Create workspace</Button>
		</form>
	{:else}
		<p style="font-size: 13px; color: var(--ink-2); line-height: 1.5;">
			Ask the workspace owner to send an invitation to your email. Invitations are delivered from
			within Settings → Members.
		</p>
		<form method="post" action="/logout" style="margin-top: 24px;">
			<Button type="submit" variant="outline" style="width: 100%;">Sign out</Button>
		</form>
	{/if}
</AuthShell>
