import { json, type RequestHandler } from '@sveltejs/kit';
import { logError } from '$lib/server/services/errorLog.service';
import { redactUrl } from '$lib/server/utils/redact';

// Per-window limits. Authenticated users get the generous bucket; anonymous
// callers (pre-login flows, misbehaving extensions, abuse) get a tight one.
const WINDOW_MS = 60_000;
const AUTHED_LIMIT = 30;
const ANON_LIMIT = 5;

// Bound the in-memory map so a flood of unique IPs cannot grow it indefinitely.
const MAX_BUCKETS = 10_000;

// Hard caps on persisted fields. logError also truncates, but rejecting large
// payloads up front avoids parsing megabytes of attacker-controlled JSON.
const MAX_BODY_BYTES = 64_000;
const MAX_MESSAGE_CHARS = 2_000;
const MAX_STACK_CHARS = 50_000;
const MAX_URL_CHARS = 2_000;
const MAX_UA_CHARS = 500;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function pruneBuckets(now: number) {
	for (const [k, v] of buckets) {
		if (v.resetAt <= now) buckets.delete(k);
	}
	if (buckets.size > MAX_BUCKETS) {
		// Insertion-order FIFO eviction until under the cap.
		const iter = buckets.keys();
		while (buckets.size > MAX_BUCKETS) {
			const next = iter.next();
			if (next.done) break;
			buckets.delete(next.value);
		}
	}
}

function checkRateLimit(key: string, limit: number) {
	const now = Date.now();
	// Opportunistic cleanup — avoids a dedicated interval while keeping the
	// map bounded even for long-lived processes.
	if (Math.random() < 0.01) pruneBuckets(now);

	const existing = buckets.get(key);
	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return { ok: true as const };
	}
	if (existing.count >= limit) {
		return { ok: false as const, retryAfterMs: existing.resetAt - now };
	}
	existing.count += 1;
	return { ok: true as const };
}

function clip(value: string, max: number): string {
	return value.length > max ? value.slice(0, max) : value;
}

export const POST: RequestHandler = async (event) => {
	const userId = event.locals.user?.id ?? null;
	const authed = Boolean(userId);
	const key = userId ?? event.getClientAddress();
	const rl = checkRateLimit(key, authed ? AUTHED_LIMIT : ANON_LIMIT);
	if (!rl.ok) {
		return json(
			{ message: 'Too many client error reports. Try again soon.' },
			{ status: 429, headers: { 'retry-after': String(Math.ceil(rl.retryAfterMs / 1000)) } }
		);
	}

	const declaredLen = Number(event.request.headers.get('content-length') ?? '0');
	if (Number.isFinite(declaredLen) && declaredLen > MAX_BODY_BYTES) {
		return json({ message: 'Payload too large.' }, { status: 413 });
	}

	let raw: string;
	try {
		raw = await event.request.text();
	} catch {
		return json({ message: 'Invalid body.' }, { status: 400 });
	}
	if (raw.length > MAX_BODY_BYTES) {
		return json({ message: 'Payload too large.' }, { status: 413 });
	}

	let body: unknown;
	try {
		body = JSON.parse(raw);
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

	const message = clip(payload.message, MAX_MESSAGE_CHARS);
	const stack = typeof payload.stack === 'string' ? clip(payload.stack, MAX_STACK_CHARS) : null;
	const url =
		typeof payload.url === 'string' ? redactUrl(clip(payload.url, MAX_URL_CHARS)) : null;
	const ua =
		typeof payload.userAgent === 'string'
			? clip(payload.userAgent, MAX_UA_CHARS)
			: event.request.headers.get('user-agent');

	try {
		await logError({
			requestId: event.locals.requestId,
			source: 'CLIENT',
			status: null,
			route: event.url.pathname,
			method: event.request.method,
			message,
			stack,
			userId,
			workspaceId: event.locals.workspace?.id ?? null,
			userAgent: ua,
			context: { url, authed }
		});
	} catch (err) {
		// Never fail the caller because logging failed.
		console.error('[client-error] persistence failed', err);
	}

	return json({ ok: true });
};
