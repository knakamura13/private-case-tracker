import type { LayoutServerLoad } from './$types';
import { requireOwner } from '$lib/server/guards';

export const load: LayoutServerLoad = async (event) => {
	requireOwner(event);
	return {};
};
