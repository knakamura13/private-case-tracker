import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createForm } from '$lib/server/services/form.service';
import { formCreateSchema } from '$lib/schemas/form';

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = formCreateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message, values: raw });
		const form = await createForm(workspace.id, user.id, parsed.data);
		throw redirect(303, `/forms/${form.id}`);
	}
};
