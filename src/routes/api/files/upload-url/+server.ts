import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requestUpload } from '$lib/server/services/document.service';
import { uploadUrlRequestSchema } from '$lib/schemas/document';
import { storageConfigured } from '$lib/server/env';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.workspace) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!storageConfigured()) {
		return json(
			{ error: 'Object storage is not configured. Set S3_* env vars to enable uploads.' },
			{ status: 503 }
		);
	}
	const body = await request.json().catch(() => null);
	const parsed = uploadUrlRequestSchema.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error.message }, { status: 400 });

	try {
		const { doc, uploadUrl, expiresIn } = await requestUpload(
			locals.workspace.id,
			locals.user.id,
			parsed.data
		);
		return json({ docId: doc.id, uploadUrl, expiresIn });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
