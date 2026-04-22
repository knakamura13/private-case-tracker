<script lang="ts">
	import AuthShell from '$lib/components/layout/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { authClient } from '$lib/client/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { KeyRound, Fingerprint } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let needsTwoFactor = $state(false);
	let totpCode = $state('');

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = null;
		const res = await authClient.signIn.email({ email, password });
		loading = false;
		if (res.error) {
			error = res.error.message ?? 'Sign-in failed';
			return;
		}
		if ((res.data as { twoFactorRedirect?: boolean } | undefined)?.twoFactorRedirect) {
			needsTwoFactor = true;
			return;
		}
		const next = $page.url.searchParams.get('next') ?? '/dashboard';
		await goto(next, { invalidateAll: true });
	}

	async function handleTotp(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = null;
		const res = await authClient.twoFactor.verifyTotp({ code: totpCode });
		loading = false;
		if (res.error) {
			error = res.error.message ?? 'Invalid code';
			return;
		}
		const next = $page.url.searchParams.get('next') ?? '/dashboard';
		await goto(next, { invalidateAll: true });
	}

	async function handlePasskey() {
		loading = true;
		error = null;
		const res = await authClient.signIn.passkey();
		loading = false;
		if (res?.error) {
			error = res.error.message ?? 'Passkey sign-in failed';
			return;
		}
		const next = $page.url.searchParams.get('next') ?? '/dashboard';
		await goto(next, { invalidateAll: true });
	}
</script>

<AuthShell title="Sign in" subtitle="Sign in to your private case workspace.">
	{#if needsTwoFactor}
		<form class="space-y-4" onsubmit={handleTotp}>
			<div>
				<Label for="totp">Authenticator code</Label>
				<Input id="totp" inputmode="numeric" autocomplete="one-time-code" bind:value={totpCode} required />
			</div>
			{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
			<Button type="submit" disabled={loading} class="w-full">
				{loading ? 'Verifying…' : 'Verify'}
			</Button>
		</form>
	{:else}
		<form class="space-y-4" onsubmit={handleLogin}>
			<div>
				<Label for="email">Email</Label>
				<Input id="email" type="email" autocomplete="email" bind:value={email} required />
			</div>
			<div>
				<Label for="password">Password</Label>
				<Input id="password" type="password" autocomplete="current-password" bind:value={password} required />
			</div>
			{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
			<Button type="submit" disabled={loading} class="w-full">
				{#snippet children()}<KeyRound class="h-4 w-4" /> {loading ? 'Signing in…' : 'Sign in'}{/snippet}
			</Button>
		</form>
		<div class="relative my-6">
			<div class="absolute inset-0 flex items-center"><span class="w-full border-t border-border"></span></div>
			<div class="relative flex justify-center text-xs uppercase"><span class="bg-background px-2 text-muted-foreground">or</span></div>
		</div>
		<Button variant="outline" class="w-full" onclick={handlePasskey} disabled={loading}>
			{#snippet children()}<Fingerprint class="h-4 w-4" /> Sign in with passkey{/snippet}
		</Button>
		{#if data.allowSignup}
			<p class="mt-6 text-center text-xs text-muted-foreground">
				Need to create the first account?
				<a class="text-primary underline-offset-4 hover:underline" href="/signup">Create owner account</a>
			</p>
		{/if}
	{/if}
</AuthShell>
