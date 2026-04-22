import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createQuestion } from '$lib/server/services/question.service';
import { questionCreateSchema } from '$lib/schemas/question';

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = questionCreateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		const q = await createQuestion(workspace.id, user.id, parsed.data);
		throw redirect(303, `/questions/${q.id}`);
	}
};
