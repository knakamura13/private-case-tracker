import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createAppointment } from '$lib/server/services/appointment.service';
import { appointmentCreateSchema } from '$lib/schemas/appointment';

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = appointmentCreateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		const a = await createAppointment(workspace.id, user.id, parsed.data);
		throw redirect(303, `/appointments/${a.id}`);
	}
};
