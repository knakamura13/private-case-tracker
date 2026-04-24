import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner, requireWorkspace } from '$lib/server/guards';
import { logActivity } from '$lib/server/activity';
import { deleteWorkspace } from '$lib/server/services/workspace.service';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listDocuments } from '$lib/server/services/document.service';
import { listAppointments } from '$lib/server/services/appointment.service';
import { listQuestions } from '$lib/server/services/question.service';
import { listNotes } from '$lib/server/services/note.service';
import { listMilestones } from '$lib/server/services/milestone.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence, docs, appts, questions, notes, milestones] = await Promise.all([
		listForms(workspace.id),
		listEvidence(workspace.id),
		listDocuments(workspace.id),
		listAppointments(workspace.id),
		listQuestions(workspace.id),
		listNotes(workspace.id),
		listMilestones(workspace.id)
	]);

	const trashedForms = forms.filter((f) => f.deletedAt != null).length;
	const trashedEvidence = evidence.filter((e) => e.deletedAt != null).length;
	const trashedDocs = docs.filter((d: any) => d.deletedAt != null).length;
	const trashedAppts = appts.filter((a) => a.deletedAt != null).length;
	const trashedQuestions = questions.filter((q) => q.deletedAt != null).length;
	const trashedNotes = notes.filter((n) => n.deletedAt != null).length;
	const trashedMilestones = milestones.filter((m) => m.deletedAt != null).length;
	return {
		trashedCounts: {
			forms: trashedForms,
			evidence: trashedEvidence,
			documents: trashedDocs,
			appointments: trashedAppts,
			questions: trashedQuestions,
			notes: trashedNotes,
			milestones: trashedMilestones
		},
		hasDemo: false
	};
};

export const actions: Actions = {
	purgeTrash: async (event) => {
		// Not implemented yet for DynamoDB single-table without scan + batch delete.
		return fail(501, {
			error: 'Not implemented yet for DynamoDB. Use S3 lifecycle + PITR for recovery.'
		});
	},
	removeDemo: async (event) => {
		return fail(501, { error: 'Not implemented yet for DynamoDB.' });
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
