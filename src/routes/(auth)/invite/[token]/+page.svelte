<script lang="ts">
	import AuthShell from '$lib/components/layout/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<AuthShell title="You've been invited" subtitle={`Join "${data.invitation.workspaceName}" as ${data.invitation.role.toLowerCase()}.`}>
	<div class="auth-form">
		<p class="invite-text-sm invite-text-muted">
			Invitation for <strong>{data.invitation.email}</strong>.
		</p>
		{#if !data.isSignedIn}
			<p class="invite-text-sm">
				Sign up with that email address to accept, or
				<a class="invite-link" href={`/login?next=/invite/${data.token}`}>sign in</a>
				if you already have an account.
			</p>
			<Button href={`/signup?invite=${data.token}`} class="invite-w-full">Create account to accept</Button>
		{:else if data.currentUserEmail !== data.invitation.email}
			<p class="invite-text-sm invite-text-destructive">
				You are signed in as {data.currentUserEmail}, but this invitation was sent to
				{data.invitation.email}. <a class="invite-underline" href="/logout">Sign out</a> and sign back in.
			</p>
		{:else}
			<form method="post" action="?/accept" class="auth-form">
				<Button type="submit" class="invite-w-full">Accept invitation</Button>
			</form>
		{/if}
	</div>
</AuthShell>
