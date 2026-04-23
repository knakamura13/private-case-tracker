import type { FileStatus } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import { createUploadUrl, createDownloadUrl, deleteObject, headObject } from '$lib/server/storage';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import { softDeleteEntity } from './shared/softDeleteEntity';

export interface UploadedDocumentCreate {
	filename: string;
	contentType: string;
	sizeBytes: number;
	title: string;
	category: string;
}

export async function createUploadedDocument(
	workspaceId: string,
	actorId: string,
	input: UploadedDocumentCreate
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
		linkedTaskId: null as string | null,
		linkedFormId: null as string | null,
		linkedEvidenceId: null as string | null,
		linkedAppointmentId: null as string | null,
		externalUrl: null as string | null,
		notes: null as string | null,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', doc.id), ...doc });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FILE_UPLOAD',
		entityType: 'DocumentFile',
		entityId: doc.id,
		summary: `Upload requested for "${doc.title}"`
	});
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
		summary: `Upload completed for "${updated.title}"`
	});
	return updated;
}

export async function getUploadedDocumentUrl(workspaceId: string, id: string) {
	const doc = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) return null;
	if (!doc.storageKey) return null;
	return createDownloadUrl(doc.storageKey, doc.title);
}

export async function deleteUploadedDocument(workspaceId: string, actorId: string, id: string) {
	const doc = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) throw new Error('Document not found');
	
	// Delete from S3 first
	if (doc.storageKey) {
		try {
			await deleteObject(doc.storageKey);
		} catch (err) {
			console.error('[storage] delete failed', err);
		}
	}
	
	// Soft delete from DynamoDB using helper
	await softDeleteEntity(
		workspaceId,
		actorId,
		'DocumentFile',
		id,
		doc.title,
		'FILE_DELETE'
	);
}
