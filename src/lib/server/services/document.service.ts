import type { DocumentFile, FileStatus, Prisma } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import { createUploadUrl, createDownloadUrl, deleteObject, headObject } from '$lib/server/storage';
import type { DocumentMetadata } from '$lib/schemas/document';

export async function listDocuments(
	workspaceId: string,
	filter: { category?: string; q?: string } = {}
) {
	const where: Prisma.DocumentFileWhereInput = { workspaceId, deletedAt: null };
	if (filter.category) where.category = filter.category;
	if (filter.q) {
		where.OR = [
			{ title: { contains: filter.q, mode: 'insensitive' } },
			{ notes: { contains: filter.q, mode: 'insensitive' } },
			{ category: { contains: filter.q, mode: 'insensitive' } }
		];
	}
	return db.documentFile.findMany({
		where,
		include: {
			uploadedBy: { select: { id: true, name: true, email: true } },
			versions: { where: { deletedAt: null }, select: { id: true, createdAt: true } }
		},
		orderBy: { createdAt: 'desc' }
	});
}

export async function getDocument(workspaceId: string, id: string) {
	return db.documentFile.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			uploadedBy: { select: { id: true, name: true, email: true } },
			versionOf: true,
			versions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
			form: true,
			evidence: true,
			appointment: true,
			task: true
		}
	});
}

export async function createExternalDocument(
	workspaceId: string,
	actorId: string,
	input: DocumentMetadata & { externalUrl: string }
) {
	const doc = await db.documentFile.create({
		data: {
			workspaceId,
			uploadedByUserId: actorId,
			title: input.title,
			category: input.category,
			storageMode: 'EXTERNAL_LINK',
			status: 'READY',
			externalUrl: input.externalUrl,
			notes: input.notes,
			linkedTaskId: input.linkedTaskId,
			linkedFormId: input.linkedFormId,
			linkedEvidenceId: input.linkedEvidenceId,
			linkedAppointmentId: input.linkedAppointmentId
		}
	});
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
	const doc = await db.documentFile.create({
		data: {
			workspaceId,
			uploadedByUserId: actorId,
			title: input.title,
			category: input.category,
			storageMode: 'UPLOADED',
			status: 'PENDING',
			mimeType: input.contentType,
			sizeBytes: input.sizeBytes,
			storageKey,
			linkedTaskId: input.linkedTaskId ?? null,
			linkedFormId: input.linkedFormId ?? null,
			linkedEvidenceId: input.linkedEvidenceId ?? null,
			linkedAppointmentId: input.linkedAppointmentId ?? null
		}
	});
	return { doc, uploadUrl, expiresIn };
}

export async function markUploaded(workspaceId: string, actorId: string, documentId: string) {
	const doc = await db.documentFile.findFirst({
		where: { id: documentId, workspaceId, deletedAt: null }
	});
	if (!doc || !doc.storageKey) throw new Error('Document not found');
	let status: FileStatus = 'READY';
	try {
		await headObject(doc.storageKey);
	} catch {
		status = 'FAILED';
	}
	const updated = await db.documentFile.update({ where: { id: documentId }, data: { status } });
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
	const doc = await db.documentFile.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!doc) return null;
	if (doc.storageMode === 'EXTERNAL_LINK') return doc.externalUrl;
	if (!doc.storageKey) return null;
	return createDownloadUrl(doc.storageKey, doc.title);
}

export async function softDeleteDocument(workspaceId: string, actorId: string, id: string) {
	const doc = await db.documentFile.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!doc) throw new Error('Document not found');
	await db.documentFile.update({ where: { id }, data: { deletedAt: new Date() } });
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
	const doc = await db.documentFile.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!doc) throw new Error('Document not found');
	const updated = await db.documentFile.update({
		where: { id },
		data: {
			title: input.title ?? undefined,
			category: input.category ?? undefined,
			notes: input.notes ?? undefined,
			linkedTaskId: input.linkedTaskId ?? undefined,
			linkedFormId: input.linkedFormId ?? undefined,
			linkedEvidenceId: input.linkedEvidenceId ?? undefined,
			linkedAppointmentId: input.linkedAppointmentId ?? undefined,
			externalUrl: input.externalUrl ?? undefined
		}
	});
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
