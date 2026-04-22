import { createAuthClient } from 'better-auth/svelte';
import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [passkeyClient(), twoFactorClient()]
});

export const { signIn, signUp, signOut, useSession } = authClient;
