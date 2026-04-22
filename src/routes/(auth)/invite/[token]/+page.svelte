<script lang="ts">
	import AuthShell from '$lib/components/layout/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<AuthShell title="You've been invited" subtitle={`Join "${data.invitation.workspaceName}" as ${data.invitation.role.toLowerCase()}.`}>
	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">
			Invitation for <strong>{data.invitation.email}</strong>.
		</p>
		{#if !data.isSignedIn}
			<p class="text-sm">
				Sign up with that email address to accept, or
				<a class="text-primary underline-offset-4 hover:underline" href={`/login?next=/invite/${data.token}`}>sign in</a>
				if you already have an account.
			</p>
			<Button href={`/signup?invite=${data.token}`} class="w-full">Create account to accept</Button>
		{:else if data.currentUserEmail !== data.invitation.email}
			<p class="text-sm text-destructive">
				You are signed in as {data.currentUserEmail}, but this invitation was sent to
				{data.invitation.email}. <a class="underline" href="/logout">Sign out</a> and sign back in.
			</p>
		{:else}
			<form method="post" action="?/accept" class="space-y-4">
				<Button type="submit" class="w-full">Accept invitation</Button>
			</form>
		{/if}
	</div>
</AuthShell>
