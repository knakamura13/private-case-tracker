import { logError } from '$lib/server/services/errorLog.service';
import type { RequestEvent } from '@sveltejs/kit';

export async function logActionError(
	event: RequestEvent,
	input: {
		message: string;
		status?: number;
		stack?: string;
		context?: Record<string, unknown>;
	}
) {
	try {
		const created = await logError({
			source: 'ACTION',
			requestId: event.locals.requestId,
			status: input.status ?? 400,
			route: event.url.pathname,
			method: event.request.method,
			message: input.message,
			stack: input.stack ?? null,
			userId: event.locals.user?.id ?? null,
			workspaceId: event.locals.workspace?.id ?? null,
			userAgent: event.request.headers.get('user-agent'),
			context: {
				...(input.context ?? {}),
				params: event.params,
				query: Object.fromEntries(event.url.searchParams.entries())
			}
		});
		return created.id;
	} catch {
		return undefined;
	}
}
