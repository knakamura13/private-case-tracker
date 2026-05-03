import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { getQuestion, updateQuestion, softDeleteQuestion } from '$lib/server/services/question.service';
import { questionUpdateSchema } from '$lib/schemas/question';

export const load: PageServerLoad = async (event) => {
    const { workspace } = requireWorkspace(event);
    const question = await getQuestion(workspace.id, event.params.id);
    if (!question) throw error(404, { message: 'Question not found' });
    return { question };
};

export const actions: Actions = {
    update: async (event) => {
        const { workspace, user } = requireWorkspace(event);
        const raw = Object.fromEntries(await event.request.formData());
        const parsed = questionUpdateSchema.safeParse(raw);
        if (!parsed.success) return fail(400, { error: parsed.error.message });
        await updateQuestion(workspace.id, user.id, event.params.id, parsed.data);
        return { ok: true };
    },
    delete: async (event) => {
        const { workspace, user } = requireWorkspace(event);
        await softDeleteQuestion(workspace.id, user.id, event.params.id);
        throw redirect(303, '/questions');
    }
};
