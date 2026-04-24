import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listDocuments } from '$lib/server/services/document.service';
import { listAppointments } from '$lib/server/services/appointment.service';
import { listQuestions } from '$lib/server/services/question.service';
import { listNotes } from '$lib/server/services/note.service';
import { listMilestones } from '$lib/server/services/milestone.service';
import { recentActivity } from '$lib/server/activity';
import { listQuickLinks } from '$lib/server/services/quickLink.service';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.workspace) return json({ error: 'Unauthorized' }, { status: 401 });
	const wsId = locals.workspace.id;
	const [
		forms,
		evidence,
		documents,
		appointments,
		questions,
		notes,
		milestones,
		activity,
		quickLinks
	] = await Promise.all([
		listForms(wsId, { limit: 5000 }),
		listEvidence(wsId, { limit: 5000 }),
		listDocuments(wsId, { limit: 5000 }),
		listAppointments(wsId, { limit: 5000 }),
		listQuestions(wsId, { limit: 5000 }),
		listNotes(wsId, { limit: 5000 }),
		listMilestones(wsId, { limit: 5000 }),
		recentActivity(wsId, 500),
		listQuickLinks(wsId, 5000)
	]);
	return new Response(
		JSON.stringify(
			{
				exportedAt: new Date().toISOString(),
				workspace: { id: locals.workspace.id, name: locals.workspace.name },
				forms,
				evidence,
				documents: documents.map((d) => ({ ...d, storageKey: undefined })),
				appointments,
				questions,
				notes,
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
