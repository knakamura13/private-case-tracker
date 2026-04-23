import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.workspace) return json({ error: 'Unauthorized' }, { status: 401 });
	const wsId = locals.workspace.id;
	const [tasks, forms, evidence, documents, appointments, questions, notes, milestones, activity, quickLinks] =
		await Promise.all([
			db.task.findMany({ where: { workspaceId: wsId, deletedAt: null }, include: { checklist: true } }),
			db.formRecord.findMany({ where: { workspaceId: wsId, deletedAt: null }, include: { supportingItems: true } }),
			db.evidenceItem.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
			db.documentFile.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
			db.appointment.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
			db.questionItem.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
			db.note.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
			db.timelineMilestone.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
			db.activityLog.findMany({ where: { workspaceId: wsId } }),
			db.quickLink.findMany({ where: { workspaceId: wsId, deletedAt: null } })
		]);
	return new Response(
		JSON.stringify(
			{
				exportedAt: new Date().toISOString(),
				workspace: { id: locals.workspace.id, name: locals.workspace.name },
				tasks,
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
