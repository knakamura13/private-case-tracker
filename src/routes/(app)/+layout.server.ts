import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { listMilestones } from '$lib/server/services/milestone.service';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        const next = encodeURIComponent(url.pathname + url.search);
        throw redirect(303, `/login?next=${next}`);
    }
    if (!locals.workspace) throw redirect(303, '/onboarding');

    // Stream milestones to the client to prevent blocking navigation
    const milestonesPromise = listMilestones(locals.workspace.id).catch((err) => {
        console.error('[layout] Failed to load milestones', err);
        return [];
    });

    return {
        user: locals.user,
        workspace: locals.workspace,
        streamed: {
            milestones: milestonesPromise
        }
    };
};
