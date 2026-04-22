import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET = async () => {
	try {
		await db.$queryRaw`SELECT 1`;
		return json({ ok: true, db: 'up', time: new Date().toISOString() });
	} catch (err) {
		return json(
			{ ok: false, db: 'down', error: err instanceof Error ? err.message : 'unknown' },
			{ status: 503 }
		);
	}
};
