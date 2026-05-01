import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { listMilestones } from '$lib/server/services/milestone.service';
import { PHASE_ORDER } from '$lib/constants/phases';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/login?next=${next}`);
	}
	if (!locals.workspace) throw redirect(303, '/onboarding');

	const milestones = await listMilestones(locals.workspace.id);
	
	// Find the next milestone: first non-DONE milestone in phase order
	let nextMilestone = null;
	for (const phase of PHASE_ORDER) {
		const inPhase = milestones.filter(m => m.phase === phase);
		const incomplete = inPhase.find(m => m.status !== 'DONE' && m.status !== 'SKIPPED');
		if (incomplete) {
			nextMilestone = incomplete;
			break;
		}
	}

	return {
		user: locals.user,
		workspace: locals.workspace,
		nextMilestone
	};
};
