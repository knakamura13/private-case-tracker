<script lang="ts">
	import AuthShell from '$lib/components/layout/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
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
		<form method="post" action="?/create" class="auth-form">
			<div>
				<Label for="name">Workspace name</Label>
				<Input id="name" name="name" value="Our case" required />
			</div>
			{#if form?.error}<p class="auth-text-sm auth-text-destructive">{form.error}</p>{/if}
			<Button type="submit" class="auth-w-full">Create workspace</Button>
		</form>
	{:else}
		<p class="auth-text-sm auth-text-muted">
			Ask the workspace owner to send an invitation to your email. Invitations are delivered from
			within Settings → Members.
		</p>
		<form method="post" action="/logout" class="auth-mt-4">
			<Button type="submit" variant="outline" class="auth-w-full">Sign out</Button>
		</form>
	{/if}
</AuthShell>
