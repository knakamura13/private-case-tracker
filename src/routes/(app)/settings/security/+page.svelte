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

<div class="settings-security-grid">
	<Card class="settings-security-card">
		<div class="settings-security-header">
			<Fingerprint class="settings-security-mt-1 settings-security-icon-lg settings-security-text-primary" />
			<div>
				<h2>Passkeys</h2>
				<p>Use Face ID, Touch ID, or a hardware key.</p>
			</div>
		</div>
		{#if passkeys.length === 0}
			<Button class="settings-security-mt-3" onclick={addPasskey}>Add a passkey</Button>
		{:else}
			<div class="settings-security-passkey-list">
				{#each passkeys as pk (pk.id)}
					<div class="settings-security-passkey-item">
						<span class="settings-security-text-sm">{pk.name || 'Unnamed passkey'}</span>
						<button
							onclick={() => deletePasskey(pk.id)}
							class="settings-security-text-xs settings-security-text-destructive settings-security-hover-underline"
							type="button"
						>
							Delete
						</button>
					</div>
				{/each}
				<Button class="settings-security-mt-2" variant="outline" onclick={addPasskey}>Add another passkey</Button>
			</div>
		{/if}
		{#if passkeyMsg}<p class="settings-security-mt-2 settings-security-text-xs settings-security-text-muted">{passkeyMsg}</p>{/if}
	</Card>
	<Card class="settings-security-card">
		<div class="settings-security-header">
			<ShieldCheck class="settings-security-mt-1 settings-security-icon-lg settings-security-text-primary" />
			<div>
				<h2>Authenticator app (TOTP)</h2>
				<p>Use a TOTP app like 1Password or Authy as a second factor.</p>
			</div>
		</div>
		{#if !totpSecret}
			<Button class="settings-security-mt-3" onclick={enableTotp}>Enable two-factor</Button>
		{:else}
			<p class="settings-security-mt-3 settings-security-text-sm">Scan this URI in your authenticator app:</p>
			<code class="settings-security-totp-uri">{totpSecret.totpURI}</code>
			{#if totpSecret.backupCodes}
				<p class="settings-security-mt-3 settings-security-text-xs settings-security-text-muted">Backup codes (store somewhere safe):</p>
				<ul class="settings-security-backup-codes">
					{#each totpSecret.backupCodes as c (c)}<li>{c}</li>{/each}
				</ul>
			{/if}
			<div class="settings-security-totp-actions">
				<input bind:value={totpCode} placeholder="Enter code" class="settings-security-totp-input" />
				<Button onclick={verifyTotp}>Verify</Button>
			</div>
		{/if}
		{#if totpMsg}<p class="settings-security-mt-2 settings-security-text-xs settings-security-text-muted">{totpMsg}</p>{/if}
	</Card>
</div>
