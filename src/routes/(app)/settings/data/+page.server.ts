import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner, requireWorkspace } from '$lib/server/guards';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import { deleteWorkspace } from '$lib/server/services/workspace.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [trashedTasks, trashedForms, trashedEvidence, trashedDocs, trashedAppts, trashedQuestions, trashedNotes, trashedMilestones, hasDemo] =
		await Promise.all([
			db.task.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.formRecord.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.evidenceItem.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.documentFile.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.appointment.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.questionItem.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.note.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.timelineMilestone.count({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.task.findFirst({
				where: { workspaceId: workspace.id, title: { startsWith: '[Demo] ' } },
				select: { id: true }
			})
		]);
	return {
		trashedCounts: {
			tasks: trashedTasks,
			forms: trashedForms,
			evidence: trashedEvidence,
			documents: trashedDocs,
			appointments: trashedAppts,
			questions: trashedQuestions,
			notes: trashedNotes,
			milestones: trashedMilestones
		},
		hasDemo: Boolean(hasDemo)
	};
};

export const actions: Actions = {
	purgeTrash: async (event) => {
		const { workspace } = requireOwner(event);
		await db.$transaction([
			db.task.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.formRecord.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.evidenceItem.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.documentFile.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.appointment.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.questionItem.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.note.deleteMany({ where: { workspaceId: workspace.id, deletedAt: { not: null } } }),
			db.timelineMilestone.deleteMany({
				where: { workspaceId: workspace.id, deletedAt: { not: null } }
			})
		]);
		return { ok: true };
	},
	removeDemo: async (event) => {
		const { workspace, user } = requireOwner(event);
		await db.$transaction(async (tx) => {
			await tx.task.deleteMany({ where: { workspaceId: workspace.id, title: { startsWith: '[Demo] ' } } });
			await tx.formRecord.deleteMany({
				where: { workspaceId: workspace.id, name: { startsWith: '[Demo] ' } }
			});
			await tx.evidenceItem.deleteMany({
				where: { workspaceId: workspace.id, title: { startsWith: '[Demo] ' } }
			});
			await tx.appointment.deleteMany({
				where: { workspaceId: workspace.id, title: { startsWith: '[Demo] ' } }
			});
			await tx.questionItem.deleteMany({
				where: { workspaceId: workspace.id, question: { startsWith: '[Demo] ' } }
			});
			await tx.note.deleteMany({
				where: { workspaceId: workspace.id, title: { startsWith: '[Demo] ' } }
			});
			await tx.timelineMilestone.deleteMany({
				where: { workspaceId: workspace.id, title: { startsWith: '[Demo] ' } }
			});
		});
		await logActivity({
			workspaceId: workspace.id,
			userId: user.id,
			action: 'DEMO_DATA_REMOVED',
			entityType: 'Workspace',
			entityId: workspace.id,
			summary: 'Removed all demo data'
		});
		return { ok: true };
	},
	deleteWorkspace: async (event) => {
		const { workspace } = requireOwner(event);
		const form = await event.request.formData();
		if (form.get('confirm') !== workspace.name) {
			return fail(400, { error: 'Type the workspace name exactly to confirm.' });
		}
		await deleteWorkspace(workspace.id);
		throw redirect(303, '/login');
	}
};
