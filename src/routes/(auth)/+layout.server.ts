import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    if (locals.user && locals.workspace && !url.pathname.startsWith('/invite')) {
        throw redirect(303, '/dashboard');
    }
    return {};
};
