import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

const WINDOW_MS = 60_000;
const LIMIT = 30;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function checkRateLimit(key: string) {
	const now = Date.now();
	const existing = buckets.get(key);
	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return { ok: true as const };
	}
	if (existing.count >= LIMIT) {
		return { ok: false as const, retryAfterMs: existing.resetAt - now };
	}
	existing.count += 1;
	return { ok: true as const };
}

export const POST: RequestHandler = async (event) => {
	const key = event.locals.user?.id ?? event.getClientAddress();
	const rl = checkRateLimit(key);
	if (!rl.ok) {
		return json(
			{ message: 'Too many client error reports. Try again soon.' },
			{ status: 429, headers: { 'retry-after': String(Math.ceil(rl.retryAfterMs / 1000)) } }
		);
	}

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return json({ message: 'Invalid JSON.' }, { status: 400 });
	}

	const payload = body as Partial<{
		message: string;
		stack: string;
		url: string;
		userAgent: string;
	}>;

	if (!payload?.message || typeof payload.message !== 'string') {
		return json({ message: 'Missing message.' }, { status: 400 });
	}

	const stack = typeof payload.stack === 'string' ? payload.stack : null;
	const url = typeof payload.url === 'string' ? payload.url : null;
	const ua =
		typeof payload.userAgent === 'string'
			? payload.userAgent
			: event.request.headers.get('user-agent');

	try {
		await db.errorLog.create({
			data: {
				requestId: event.locals.requestId,
				source: 'CLIENT',
				status: null,
				route: event.url.pathname,
				method: event.request.method,
				message: payload.message,
				stack,
				userId: event.locals.user?.id ?? null,
				workspaceId: event.locals.workspace?.id ?? null,
				userAgent: ua,
				context: {
					url
				}
			}
		});
	} catch (err) {
		// Never fail the caller because logging failed.
		console.error('[client-error] persistence failed', err);
	}

	return json({ ok: true });
};
