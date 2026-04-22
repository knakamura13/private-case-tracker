import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireUser(event: RequestEvent) {
	if (!event.locals.user) {
		const next = encodeURIComponent(event.url.pathname + event.url.search);
		throw redirect(303, `/login?next=${next}`);
	}
	return event.locals.user;
}

export function requireWorkspace(event: RequestEvent) {
	const user = requireUser(event);
	if (!event.locals.workspace) {
		throw redirect(303, '/onboarding');
	}
	return { user, workspace: event.locals.workspace };
}

export function requireOwner(event: RequestEvent) {
	const { user, workspace } = requireWorkspace(event);
	if (workspace.role !== 'OWNER') {
		throw error(403, { message: 'Only workspace owners can perform this action.' });
	}
	return { user, workspace };
}
