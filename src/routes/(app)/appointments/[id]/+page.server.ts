import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import {
	getAppointment,
	updateAppointment,
	softDeleteAppointment
} from '$lib/server/services/appointment.service';
import { appointmentUpdateSchema } from '$lib/schemas/appointment';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const appointment = await getAppointment(workspace.id, event.params.id);
	if (!appointment) throw error(404, { message: 'Appointment not found' });
	return { appointment };
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = appointmentUpdateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		await updateAppointment(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteAppointment(workspace.id, user.id, event.params.id);
		throw redirect(303, '/appointments');
	}
};
