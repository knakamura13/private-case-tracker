import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { logError } from '$lib/server/services/errorLog.service';
import { redactSearchParams } from '$lib/server/utils/redact';

function makeRequestId() {
	// Short-ish id that’s useful in logs and UI.
	return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

const requestIdHandle: Handle = async ({ event, resolve }) => {
	event.locals.requestId = makeRequestId();
	const response = await resolve(event);
	response.headers.set('x-request-id', event.locals.requestId);
	return response;
};

const sessionHandle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.session = null;
	event.locals.workspace = null;

	try {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (session?.user && session.session) {
			event.locals.user = {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name ?? null,
				image: session.user.image ?? null
			};
			event.locals.session = {
				id: session.session.id,
				expiresAt: new Date(session.session.expiresAt)
			};

			const membership = await db.membership.findFirst({
				where: { userId: session.user.id, acceptedAt: { not: null } },
				include: { workspace: true },
				orderBy: { createdAt: 'asc' }
			});
			if (membership) {
				event.locals.workspace = {
					id: membership.workspace.id,
					name: membership.workspace.name,
					role: membership.role
				};
			}
		}
	} catch (err) {
		console.error('[hooks] session load error', err);
	}

	return resolve(event);
};

const betterAuthHandle: Handle = async ({ event, resolve }) =>
	svelteKitHandler({ event, resolve, auth, building });

export const handle = sequence(requestIdHandle, betterAuthHandle, sessionHandle);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const requestId = event.locals.requestId;
	const isOwner = event.locals.workspace?.role === 'OWNER';

	const err = error instanceof Error ? error : new Error(String(error));
	const stack = err.stack ?? null;
	const rawMessage = err.message || message;
	const contentLength = event.request.headers.get('content-length');

	let errorId: string | undefined;
	try {
		const created = await logError({
			requestId,
			source: 'SERVER',
			status: status ?? null,
			route: event.url.pathname,
			method: event.request.method,
			message: rawMessage,
			stack,
			userId: event.locals.user?.id ?? null,
			workspaceId: event.locals.workspace?.id ?? null,
			userAgent: event.request.headers.get('user-agent'),
			context: {
				params: event.params,
				query: redactSearchParams(event.url.searchParams),
				bodySummary: {
					hasBody:
						event.request.headers.has('content-length') ||
						event.request.headers.has('transfer-encoding'),
					contentType: event.request.headers.get('content-type'),
					size: contentLength ? Number(contentLength) : null
				}
			}
		});
		errorId = created.id;
	} catch (logErr) {
		console.error('[hooks] error persistence failed', logErr);
	}

	return {
		// Non-owners only see SvelteKit's sanitized `message` ("Internal Error"
		// for unhandled 500s) so raw exception text — DB constraint names,
		// integration errors, stack fragments — never leaks to end users.
		message: isOwner ? rawMessage : message,
		errorId,
		requestId,
		...(isOwner ? { stack: stack ?? undefined } : {})
	};
};
