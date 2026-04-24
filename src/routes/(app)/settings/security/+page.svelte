<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { authClient } from '$lib/client/auth-client';
	import { Fingerprint, ShieldCheck } from 'lucide-svelte';

	let passkeyMsg = $state<string | null>(null);
	let passkeys = $state<Array<{ id: string; name?: string }>>([]);
	let totpMsg = $state<string | null>(null);
	let totpSecret = $state<{ totpURI?: string; backupCodes?: string[] } | null>(null);
	let totpCode = $state('');

	async function addPasskey() {
		passkeyMsg = 'Launching passkey ceremony…';
		try {
			const res = await authClient.passkey.addPasskey();
			if (res?.error) {
				passkeyMsg = res.error.message ?? 'Failed';
			} else {
				passkeyMsg = 'Passkey added.';
				await loadPasskeys();
			}
		} catch (err) {
			passkeyMsg = (err as Error).message;
		}
	}

	async function loadPasskeys() {
		const res = await authClient.passkey.listUserPasskeys();
		if (res.data) {
			passkeys = res.data;
		}
	}

	async function deletePasskey(id: string) {
		const res = await authClient.passkey.deletePasskey({ id });
		if (res.error) {
			passkeyMsg = res.error.message ?? 'Failed to delete passkey';
		} else {
			passkeyMsg = 'Passkey deleted.';
			await loadPasskeys();
		}
	}

	$effect(() => {
		loadPasskeys();
	});

	async function enableTotp() {
		totpMsg = null;
		const res = await authClient.twoFactor.enable({ password: prompt('Confirm your password') ?? '' });
		if (res.error) totpMsg = res.error.message ?? 'Failed';
		else totpSecret = res.data ?? null;
	}

	async function verifyTotp() {
		const res = await authClient.twoFactor.verifyTotp({ code: totpCode });
		if (res.error) totpMsg = res.error.message ?? 'Invalid code';
		else totpMsg = 'Two-factor enabled.';
	}
</script>

<PageHeader title="Security" description="Passkeys and two-factor authentication." />

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<Card class="p-4">
		<div class="flex items-start gap-3">
			<Fingerprint class="mt-1 h-5 w-5 text-primary" />
			<div>
				<h2 class="font-semibold">Passkeys</h2>
				<p class="text-sm text-muted-foreground">Use Face ID, Touch ID, or a hardware key.</p>
			</div>
		</div>
		{#if passkeys.length === 0}
			<Button class="mt-3" onclick={addPasskey}>Add a passkey</Button>
		{:else}
			<div class="mt-3 space-y-2">
				{#each passkeys as pk}
					<div class="flex items-center justify-between rounded-md border border-border bg-muted/50 p-2">
						<span class="text-sm">{pk.name || 'Unnamed passkey'}</span>
						<button
							onclick={() => deletePasskey(pk.id)}
							class="text-xs text-destructive hover:underline"
							type="button"
						>
							Delete
						</button>
					</div>
				{/each}
				<Button class="mt-2" variant="outline" onclick={addPasskey}>Add another passkey</Button>
			</div>
		{/if}
		{#if passkeyMsg}<p class="mt-2 text-xs text-muted-foreground">{passkeyMsg}</p>{/if}
	</Card>
	<Card class="p-4">
		<div class="flex items-start gap-3">
			<ShieldCheck class="mt-1 h-5 w-5 text-primary" />
			<div>
				<h2 class="font-semibold">Authenticator app (TOTP)</h2>
				<p class="text-sm text-muted-foreground">Use a TOTP app like 1Password or Authy as a second factor.</p>
			</div>
		</div>
		{#if !totpSecret}
			<Button class="mt-3" onclick={enableTotp}>Enable two-factor</Button>
		{:else}
			<p class="mt-3 text-sm">Scan this URI in your authenticator app:</p>
			<code class="mt-1 block break-all rounded bg-muted p-2 text-xs">{totpSecret.totpURI}</code>
			{#if totpSecret.backupCodes}
				<p class="mt-3 text-xs text-muted-foreground">Backup codes (store somewhere safe):</p>
				<ul class="mt-1 grid grid-cols-2 gap-1 text-xs font-mono">
					{#each totpSecret.backupCodes as c}<li>{c}</li>{/each}
				</ul>
			{/if}
			<div class="mt-3 flex items-center gap-2">
				<input bind:value={totpCode} placeholder="Enter code" class="h-11 rounded-md border border-input bg-card px-3 text-sm" />
				<Button onclick={verifyTotp}>Verify</Button>
			</div>
		{/if}
		{#if totpMsg}<p class="mt-2 text-xs text-muted-foreground">{totpMsg}</p>{/if}
	</Card>
</div>
