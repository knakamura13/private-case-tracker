import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user && locals.workspace) throw redirect(303, '/dashboard');
    if (locals.user && !locals.workspace) throw redirect(303, '/onboarding');
    throw redirect(303, '/login');
};
