import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { ENV } from './env';
import { dynamoBetterAuthAdapter } from './better-auth/dynamo-adapter';

export const auth = betterAuth({
    appName: ENV.PUBLIC_APP_NAME,
    baseURL: ENV.BETTER_AUTH_URL,
    secret: ENV.BETTER_AUTH_SECRET,
    database: dynamoBetterAuthAdapter(),
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
        requireEmailVerification: true,
        minPasswordLength: 12,
        maxPasswordLength: 256,
        autoSignIn: false
    },
    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: false,
        sendVerificationEmail: async ({ user, url }) => {
            const verificationUrl = new URL(url);
            const appUrl = new URL(ENV.APP_URL);
            verificationUrl.protocol = appUrl.protocol;
            verificationUrl.host = appUrl.host;

            if (ENV.NODE_ENV === 'production') {
                console.warn('[auth] email verification provider not configured; logging verification URL fallback');
            }
            console.info(`[auth] verification email for ${user.email}: ${verificationUrl.toString()}`);
        }
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
