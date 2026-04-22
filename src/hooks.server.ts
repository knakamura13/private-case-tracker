import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';

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

export const handle = sequence(betterAuthHandle, sessionHandle);
