import type { DocumentFile, FileStatus } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import { createUploadUrl, createDownloadUrl, deleteObject, headObject } from '$lib/server/storage';
import type { DocumentMetadata } from '$lib/schemas/document';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';

export async function listDocuments(
	workspaceId: string,
	filter: { category?: string; q?: string } = {}
) {
	const rows = await ddbQuery<any>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'DocumentFile#' }
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
	const doc = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
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

export async function createExternalDocument(
	workspaceId: string,
	actorId: string,
	input: DocumentMetadata & { externalUrl: string }
) {
	const now = new Date().toISOString();
	const doc = {
		id: randomUUID(),
		workspaceId,
		uploadedByUserId: actorId,
		title: input.title,
		category: input.category,
		storageMode: 'EXTERNAL_LINK' as const,
		status: 'READY' as const,
		externalUrl: input.externalUrl,
		notes: input.notes ?? null,
		linkedTaskId: input.linkedTaskId ?? null,
		linkedFormId: input.linkedFormId ?? null,
		linkedEvidenceId: input.linkedEvidenceId ?? null,
		linkedAppointmentId: input.linkedAppointmentId ?? null,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', doc.id), ...doc });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FILE_LINK_ADDED',
		entityType: 'DocumentFile',
		entityId: doc.id,
		summary: `External link added: "${doc.title}"`
	});
	return doc;
}

export async function requestUpload(
	workspaceId: string,
	actorId: string,
	input: {
		filename: string;
		contentType: string;
		sizeBytes: number;
		title: string;
		category: string;
		linkedTaskId?: string | null;
		linkedFormId?: string | null;
		linkedEvidenceId?: string | null;
		linkedAppointmentId?: string | null;
	}
) {
	const { uploadUrl, storageKey, expiresIn } = await createUploadUrl({
		workspaceId,
		contentType: input.contentType,
		sizeBytes: input.sizeBytes,
		filename: input.filename
	});
	const now = new Date().toISOString();
	const doc = {
		id: randomUUID(),
		workspaceId,
		uploadedByUserId: actorId,
		title: input.title,
		category: input.category,
		storageMode: 'UPLOADED' as const,
		status: 'PENDING' as const,
		mimeType: input.contentType,
		sizeBytes: input.sizeBytes,
		storageKey,
		linkedTaskId: input.linkedTaskId ?? null,
		linkedFormId: input.linkedFormId ?? null,
		linkedEvidenceId: input.linkedEvidenceId ?? null,
		linkedAppointmentId: input.linkedAppointmentId ?? null,
		externalUrl: null as string | null,
		notes: null as string | null,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', doc.id), ...doc });
	return { doc, uploadUrl, expiresIn };
}

export async function markUploaded(workspaceId: string, actorId: string, documentId: string) {
	const doc = await ddbGet<any>({
		PK: wsPk(workspaceId),
		SK: entitySk('DocumentFile', documentId)
	});
	if (!doc || !doc.storageKey) throw new Error('Document not found');
	let status: FileStatus = 'READY';
	try {
		await headObject(doc.storageKey);
	} catch {
		status = 'FAILED';
	}
	const updated = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', documentId) },
		'SET #status = :s, #updatedAt = :u',
		{ ':s': status, ':u': new Date().toISOString() },
		{ '#status': 'status', '#updatedAt': 'updatedAt' }
	)) ?? { ...doc, status };
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FILE_UPLOAD',
		entityType: 'DocumentFile',
		entityId: documentId,
		summary: `Uploaded "${updated.title}"`
	});
	return updated;
}

export async function getSignedGetUrl(workspaceId: string, id: string) {
	const doc = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) return null;
	if (doc.storageMode === 'EXTERNAL_LINK') return doc.externalUrl;
	if (!doc.storageKey) return null;
	return createDownloadUrl(doc.storageKey, doc.title);
}

export async function softDeleteDocument(workspaceId: string, actorId: string, id: string) {
	const doc = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) throw new Error('Document not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
	if (doc.storageMode === 'UPLOADED' && doc.storageKey) {
		try {
			await deleteObject(doc.storageKey);
		} catch (err) {
			console.error('[storage] delete failed', err);
		}
	}
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FILE_DELETE',
		entityType: 'DocumentFile',
		entityId: id,
		summary: `Deleted "${doc.title}"`
	});
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
	if (input.externalUrl !== undefined) patch.externalUrl = input.externalUrl;

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
