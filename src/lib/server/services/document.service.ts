import type { DocumentFile } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import type { DocumentMetadata } from '$lib/schemas/document';
import { ddbGet, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { DocumentFileItem } from '$lib/server/dynamo/types';

export async function listDocuments(
	workspaceId: string,
	filter: { category?: string; q?: string; limit?: number } = {}
) {
	const rows = await ddbQuery<DocumentFileItem>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'DocumentFile#' },
		Limit: filter.limit ?? 1000
	});
	const q = filter.q?.toLowerCase();
	const filtered = rows
		.filter((d) => !d.deletedAt)
		.filter((d) => (filter.category ? d.category === filter.category : true))
		.filter((d) =>
			q
				? String(d.title ?? '')
						.toLowerCase()
						.includes(q) ||
					String(d.notes ?? '')
						.toLowerCase()
						.includes(q) ||
					String(d.category ?? '')
						.toLowerCase()
						.includes(q)
				: true
		)
		.map((d) => ({
			...d,
			uploadedBy: d.uploadedByUserId ? { id: d.uploadedByUserId, name: null, email: '' } : null,
			versions: []
		}));
	filtered.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
	return filtered;
}

export async function getDocument(workspaceId: string, id: string) {
	const doc = await ddbGet<DocumentFileItem>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc || doc.deletedAt) return null;
	return {
		...doc,
		uploadedBy: doc.uploadedByUserId ? { id: doc.uploadedByUserId, name: null, email: '' } : null,
		versionOf: null,
		versions: [],
		form: doc.linkedFormId ? { id: doc.linkedFormId } : null,
		evidence: doc.linkedEvidenceId ? { id: doc.linkedEvidenceId } : null,
		appointment: doc.linkedAppointmentId ? { id: doc.linkedAppointmentId } : null,
		task: doc.linkedTaskId ? { id: doc.linkedTaskId } : null
	};
}

export async function updateDocumentMetadata(
	workspaceId: string,
	actorId: string,
	id: string,
	input: Partial<DocumentMetadata>
) {
	const doc = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) throw new Error('Document not found');
	const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
	if (input.title !== undefined) patch.title = input.title;
	if (input.category !== undefined) patch.category = input.category;
	if (input.notes !== undefined) patch.notes = input.notes;
	if (input.linkedTaskId !== undefined) patch.linkedTaskId = input.linkedTaskId;
	if (input.linkedFormId !== undefined) patch.linkedFormId = input.linkedFormId;
	if (input.linkedEvidenceId !== undefined) patch.linkedEvidenceId = input.linkedEvidenceId;
	if (input.linkedAppointmentId !== undefined)
		patch.linkedAppointmentId = input.linkedAppointmentId;

	const names: Record<string, string> = {};
	const values: Record<string, unknown> = {};
	const sets: string[] = [];
	for (const [k, v] of Object.entries(patch)) {
		const nk = `#${k}`;
		const vk = `:${k}`;
		names[nk] = k;
		values[vk] = v;
		sets.push(`${nk} = ${vk}`);
	}
	const updated = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) },
		`SET ${sets.join(', ')}`,
		values,
		names
	)) ?? { ...doc, ...patch };
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FILE_LINK_ADDED',
		entityType: 'DocumentFile',
		entityId: id,
		summary: `Document "${updated.title}" metadata updated`
	});
	return updated;
}

export type DocumentRow = DocumentFile & {
	uploadedBy: { id: string; name: string | null; email: string } | null;
};
