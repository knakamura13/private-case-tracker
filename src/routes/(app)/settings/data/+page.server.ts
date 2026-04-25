import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner, requireWorkspace } from '$lib/server/guards';
import { deleteWorkspace } from '$lib/server/services/workspace.service';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listQuestions } from '$lib/server/services/question.service';
import { listMilestones } from '$lib/server/services/milestone.service';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [evidence, questions, milestones] = await Promise.all([
		listEvidence(workspace.id),
		listQuestions(workspace.id),
		listMilestones(workspace.id)
	]);

	const trashedEvidence = evidence.filter((e) => e.deletedAt != null).length;
	const trashedQuestions = questions.filter((q) => q.deletedAt != null).length;
	const trashedMilestones = milestones.filter((m) => m.deletedAt != null).length;
	return {
		trashedCounts: {
			evidence: trashedEvidence,
			questions: trashedQuestions,
			milestones: trashedMilestones
		},
		hasDemo: false
	};
};

export const actions: Actions = {
	purgeTrash: async () => {
		// Not implemented yet for DynamoDB single-table without scan + batch delete.
		return fail(501, {
			error: 'Not implemented yet for DynamoDB. Use S3 lifecycle + PITR for recovery.'
		});
	},
	removeDemo: async () => {
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
