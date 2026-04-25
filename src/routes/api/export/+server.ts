import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listDocuments } from '$lib/server/services/document.service';
import { listQuestions } from '$lib/server/services/question.service';
import { listMilestones } from '$lib/server/services/milestone.service';
import { recentActivity } from '$lib/server/activity';
import { listQuickLinks } from '$lib/server/services/quickLink.service';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.workspace) return json({ error: 'Unauthorized' }, { status: 401 });
	const wsId = locals.workspace.id;
	const [
		evidence,
		documents,
		questions,
		milestones,
		activity,
		quickLinks
	] = await Promise.all([
		listEvidence(wsId, { limit: 5000 }),
		listDocuments(wsId, { limit: 5000 }),
		listQuestions(wsId, { limit: 5000 }),
		listMilestones(wsId, { limit: 5000 }),
		recentActivity(wsId, 500),
		listQuickLinks(wsId, 5000)
	]);
	return new Response(
		JSON.stringify(
			{
				exportedAt: new Date().toISOString(),
				workspace: { id: locals.workspace.id, name: locals.workspace.name },
				evidence,
				documents: documents.map((d) => ({ ...d, storageKey: undefined })),
				questions,
				milestones,
				quickLinks,
				activity
			},
			null,
			2
		),
		{
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="case-tracker-${wsId}-${Date.now()}.json"`
			}
		}
	);
};
