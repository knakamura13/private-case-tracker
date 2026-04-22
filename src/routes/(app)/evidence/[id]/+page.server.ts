import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import {
	getEvidence,
	updateEvidence,
	softDeleteEvidence
} from '$lib/server/services/evidence.service';
import { evidenceUpdateSchema } from '$lib/schemas/evidence';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const evidence = await getEvidence(workspace.id, event.params.id);
	if (!evidence) throw error(404, { message: 'Evidence not found' });
	return { evidence };
};

export const actions: Actions = {
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		if (typeof raw.includedInPacket === 'string') raw.includedInPacket = 'true';
		else raw.includedInPacket = 'false';
		const parsed = evidenceUpdateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		await updateEvidence(workspace.id, user.id, event.params.id, parsed.data);
		return { ok: true };
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		await softDeleteEvidence(workspace.id, user.id, event.params.id);
		throw redirect(303, '/evidence');
	}
};
