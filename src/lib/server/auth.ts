import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { passkey } from '@better-auth/passkey';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { db } from './db';
import { ENV } from './env';

export const auth = betterAuth({
	appName: ENV.PUBLIC_APP_NAME,
	baseURL: ENV.BETTER_AUTH_URL,
	secret: ENV.BETTER_AUTH_SECRET,
	database: prismaAdapter(db, { provider: 'postgresql' }),
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5
		}
	},
	advanced: {
		cookiePrefix: 'pct',
		useSecureCookies: ENV.NODE_ENV === 'production'
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 12,
		maxPasswordLength: 256,
		autoSignIn: true
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 30
	},
	plugins: [
		passkey({
			rpID: new URL(ENV.BETTER_AUTH_URL).hostname,
			rpName: ENV.PUBLIC_APP_NAME,
			origin: new URL(ENV.BETTER_AUTH_URL).origin
		}),
		twoFactor({
			issuer: ENV.PUBLIC_APP_NAME,
			skipVerificationOnEnable: false
		})
	],
	trustedOrigins: [ENV.APP_URL, ENV.BETTER_AUTH_URL]
});

export type Auth = typeof auth;
