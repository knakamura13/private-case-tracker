import { logActivity } from '$lib/server/activity';
import type { DocumentMetadata } from '$lib/schemas/document';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import { softDeleteEntity } from './shared/softDeleteEntity';

export async function createExternalLink(
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

export async function getExternalLinkUrl(workspaceId: string, id: string) {
	const doc = await ddbGet<Record<string, unknown>>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) return null;
	if (doc.storageMode !== 'EXTERNAL_LINK') return null;
	return doc.externalUrl;
}

export async function deleteExternalLink(workspaceId: string, actorId: string, id: string) {
	const doc = await ddbGet<Record<string, unknown>>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) throw new Error('Document not found');
	
	await softDeleteEntity(
		workspaceId,
		actorId,
		'DocumentFile',
		id,
		doc.title as string,
		'FILE_DELETE'
	);
}

export async function updateExternalLinkMetadata(
	workspaceId: string,
	actorId: string,
	id: string,
	input: Partial<DocumentMetadata>
) {
	const doc = await ddbGet<Record<string, unknown>>({ PK: wsPk(workspaceId), SK: entitySk('DocumentFile', id) });
	if (!doc) throw new Error('Document not found');
	const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
	if (input.title !== undefined) patch.title = input.title;
	if (input.category !== undefined) patch.category = input.category;
	if (input.notes !== undefined) patch.notes = input.notes;
	if (input.linkedTaskId !== undefined) patch.linkedTaskId = input.linkedTaskId;
	if (input.linkedFormId !== undefined) patch.linkedFormId = input.linkedFormId;
	if (input.linkedEvidenceId !== undefined) patch.linkedEvidenceId = input.linkedEvidenceId;
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
	const updated = (await ddbUpdate<Record<string, unknown>>(
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
		summary: `External link "${updated.title}" metadata updated`
	});
	return updated;
}
