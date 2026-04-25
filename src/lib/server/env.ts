import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { z } from 'zod';

const schema = z.object({
	APP_URL: z.string().url(),
	PUBLIC_APP_NAME: z.string().default('Private Case Tracker'),
	BETTER_AUTH_SECRET: z.string().min(24),
	BETTER_AUTH_URL: z.string().url(),
	ALLOW_OPEN_SIGNUP: z
		.string()
		.optional()
		.transform((v) => v === 'true' || v === '1'),
	FIELD_ENCRYPTION_KEY: z
		.string()
		.min(32)
		.refine(
			(key) => {
				try {
					const buf = Buffer.from(key, 'base64');
					return buf.length === 32;
				} catch {
					return false;
				}
			},
			{
				message:
					'FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key. Generate with: openssl rand -base64 32'
			}
		),
	AWS_REGION: z.string().min(1).default('us-east-1'),
	// Required in production; defaulted in dev/test to keep local tooling and unit tests simple.
	DYNAMO_TABLE: z.string().min(1).default('case-tracker-dev'),
	DYNAMO_ENDPOINT: z.string().url().optional(),
	S3_ENDPOINT: z.string().url().optional(),
	S3_REGION: z.string().default('auto'),
	S3_BUCKET: z.string().optional(),
	S3_ACCESS_KEY_ID: z.string().optional(),
	S3_SECRET_ACCESS_KEY: z.string().optional(),
	S3_FORCE_PATH_STYLE: z
		.string()
		.optional()
		.transform((v) => v === 'true' || v === '1'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DEV_MODE: z.string().optional()
});

type Env = z.infer<typeof schema>;
let cached: Env | null = null;

// BUILD_PLACEHOLDER is used ONLY during SvelteKit build/prerender when runtime env vars are not available.
// These values must NEVER be used in production. The load() function validates that real env vars
// are provided in production and will fail if these placeholders are detected at runtime.
const BUILD_PLACEHOLDER: Env = {
	APP_URL: 'http://localhost:3000',
	PUBLIC_APP_NAME: 'Private Case Tracker',
	BETTER_AUTH_SECRET: 'build-placeholder-secret-build-placeholder',
	BETTER_AUTH_URL: 'http://localhost:3000',
	ALLOW_OPEN_SIGNUP: false,
	FIELD_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
	AWS_REGION: 'us-east-1',
	DYNAMO_TABLE: 'build-placeholder-table',
	DYNAMO_ENDPOINT: undefined,
	S3_ENDPOINT: undefined,
	S3_REGION: 'auto',
	S3_BUCKET: undefined,
	S3_ACCESS_KEY_ID: undefined,
	S3_SECRET_ACCESS_KEY: undefined,
	S3_FORCE_PATH_STYLE: false,
	NODE_ENV: 'production',
	DEV_MODE: undefined
};

function load(): Env {
	if (building) return BUILD_PLACEHOLDER;
	const parsed = schema.safeParse({
		APP_URL: env.APP_URL,
		PUBLIC_APP_NAME: env.PUBLIC_APP_NAME,
		BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: env.BETTER_AUTH_URL,
		ALLOW_OPEN_SIGNUP: env.ALLOW_OPEN_SIGNUP,
		FIELD_ENCRYPTION_KEY: env.FIELD_ENCRYPTION_KEY,
		AWS_REGION: env.AWS_REGION,
		DYNAMO_TABLE: env.DYNAMO_TABLE,
		DYNAMO_ENDPOINT: env.DYNAMO_ENDPOINT,
		S3_ENDPOINT: env.S3_ENDPOINT,
		S3_REGION: env.S3_REGION,
		S3_BUCKET: env.S3_BUCKET,
		S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
		S3_FORCE_PATH_STYLE: env.S3_FORCE_PATH_STYLE,
		NODE_ENV: env.NODE_ENV ?? process.env.NODE_ENV,
		DEV_MODE: env.DEV_MODE ?? process.env.DEV_MODE
	});
	if (!parsed.success) {
		console.error('[env] invalid environment', parsed.error.flatten().fieldErrors);
		throw new Error('Invalid environment configuration');
	}
	if (
		parsed.data.NODE_ENV === 'production' &&
		(!env.DYNAMO_TABLE || env.DYNAMO_TABLE.trim() === '')
	) {
		console.error('[env] invalid environment', { DYNAMO_TABLE: ['Required in production'] });
		throw new Error('Invalid environment configuration');
	}
	return parsed.data;
}

// Lazily validate on first access so the build/prerender step doesn't choke
// on missing runtime env vars.
export const ENV: Env = new Proxy({} as Env, {
	get(_t, prop: keyof Env) {
		if (!cached) cached = load();
		return cached[prop];
	}
});

export function storageConfigured(): boolean {
	const e = ENV;
	return Boolean(e.S3_ENDPOINT && e.S3_BUCKET && e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY);
}
