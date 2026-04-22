import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { createEvidence } from '$lib/server/services/evidence.service';
import { evidenceCreateSchema } from '$lib/schemas/evidence';

export const actions: Actions = {
	default: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		if (typeof raw.includedInPacket === 'string') raw.includedInPacket = 'true';
		const parsed = evidenceCreateSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.message });
		const ev = await createEvidence(workspace.id, user.id, parsed.data);
		throw redirect(303, `/evidence/${ev.id}`);
	}
};
