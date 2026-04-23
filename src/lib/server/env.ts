import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { z } from 'zod';

const schema = z.object({
	// Legacy (Prisma/Postgres). Kept optional during migration, but not required at runtime once DynamoDB cutover is complete.
	DATABASE_URL: z.string().url().optional(),
	APP_URL: z.string().url(),
	PUBLIC_APP_NAME: z.string().default('Private Case Tracker'),
	BETTER_AUTH_SECRET: z.string().min(24),
	BETTER_AUTH_URL: z.string().url(),
	ALLOW_OPEN_SIGNUP: z
		.string()
		.optional()
		.transform((v) => v === 'true' || v === '1'),
	FIELD_ENCRYPTION_KEY: z.string().min(32),
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
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().default('Case Tracker <noreply@example.com>'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

type Env = z.infer<typeof schema>;
let cached: Env | null = null;

const BUILD_PLACEHOLDER: Env = {
	DATABASE_URL: undefined,
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
	RESEND_API_KEY: undefined,
	EMAIL_FROM: 'Case Tracker <noreply@example.com>',
	NODE_ENV: 'production'
};

function load(): Env {
	if (building) return BUILD_PLACEHOLDER;
	const parsed = schema.safeParse({
		DATABASE_URL: env.DATABASE_URL,
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
		RESEND_API_KEY: env.RESEND_API_KEY,
		EMAIL_FROM: env.EMAIL_FROM,
		NODE_ENV: env.NODE_ENV ?? process.env.NODE_ENV
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
