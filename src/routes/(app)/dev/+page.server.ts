import type { PageServerLoad } from './$types';
import { requireOwner } from '$lib/server/guards';
import { db } from '$lib/server/db';
import { listErrors } from '$lib/server/services/errorLog.service';

const RAILWAY_PROJECT_URL =
	'https://railway.com/project/3a9f57f3-72fb-4ec6-8fc8-c25dae27eaec?environmentId=4e56be4c-f007-4aed-bfdf-4afb3aac814d';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireOwner(event);

	const limit = 50;
	const statusParam = event.url.searchParams.get('status');
	const sourceParam = event.url.searchParams.get('source');
	const routeParam = event.url.searchParams.get('route');

	const status = statusParam ? Number(statusParam) : undefined;
	const source =
		sourceParam && ['SERVER', 'CLIENT', 'ACTION', 'API'].includes(sourceParam)
			? (sourceParam as 'SERVER' | 'CLIENT' | 'ACTION' | 'API')
			: undefined;

	const t0 = performance.now();
	let dbOk = true;
	let dbMs = 0;
	try {
		await db.$queryRaw`SELECT 1`;
		dbMs = Math.round(performance.now() - t0);
	} catch {
		dbOk = false;
		dbMs = Math.round(performance.now() - t0);
	}

	const errors = await listErrors({
		workspaceId: workspace.id,
		includeGlobal: true,
		limit,
		status: Number.isFinite(status) ? status : undefined,
		source,
		route: routeParam ?? undefined
	});

	return {
		errors,
		railwayProjectUrl: RAILWAY_PROJECT_URL,
		processInfo: {
			node: process.version,
			uptimeSec: Math.round(process.uptime()),
			uptimeLabel: 'Process uptime — resets on deploy',
			commitSha: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
			environment: process.env.RAILWAY_ENVIRONMENT ?? null,
			serviceName: process.env.RAILWAY_SERVICE_NAME ?? null
		},
		dbHealth: { ok: dbOk, ms: dbMs }
	};
};
