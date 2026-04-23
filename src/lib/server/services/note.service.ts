import { logActivity } from '$lib/server/activity';
import type { NoteCreate, NoteUpdate } from '$lib/schemas/note';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';

export async function listNotes(workspaceId: string, filter: { q?: string } = {}) {
	const rows = await ddbQuery<any>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'Note#' }
	});
	const q = filter.q?.toLowerCase();
	const filtered = rows
		.filter((n) => !n.deletedAt)
		.filter((n) =>
			q
				? String(n.title ?? '')
						.toLowerCase()
						.includes(q) ||
					String(n.bodyMd ?? '')
						.toLowerCase()
						.includes(q)
				: true
		)
		.map((n) => ({
			...n,
			author: n.authorId ? { id: n.authorId, name: null, email: '' } : null
		}));
	filtered.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
	return filtered;
}

export async function getNote(workspaceId: string, id: string) {
	const note = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('Note', id) });
	if (!note || note.deletedAt) return null;
	return {
		...note,
		author: note.authorId ? { id: note.authorId, name: null, email: '' } : null,
		task: note.linkedTaskId ? { id: note.linkedTaskId } : null,
		form: note.linkedFormId ? { id: note.linkedFormId } : null,
		evidence: note.linkedEvidenceId ? { id: note.linkedEvidenceId } : null,
		appointment: note.linkedAppointmentId ? { id: note.linkedAppointmentId } : null
	};
}

export async function createNote(workspaceId: string, authorId: string, input: NoteCreate) {
	const now = new Date().toISOString();
	const note = {
		id: randomUUID(),
		workspaceId,
		authorId,
		...input,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('Note', note.id), ...note });
	await logActivity({
		workspaceId,
		userId: authorId,
		action: 'NOTE_CREATED',
		entityType: 'Note',
		entityId: note.id,
		summary: `Note "${note.title}" created`
	});
	return note;
}

export async function updateNote(
	workspaceId: string,
	actorId: string,
	id: string,
	input: NoteUpdate
) {
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('Note', id) });
	if (!existing) throw new Error('Note not found');
	if (existing.deletedAt) throw new Error('Note not found');
	const patch: Record<string, unknown> = { ...input, updatedAt: new Date().toISOString() };
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
	const note = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('Note', id) },
		`SET ${sets.join(', ')}`,
		values,
		names
	)) ?? { ...existing, ...patch };
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'NOTE_EDIT',
		entityType: 'Note',
		entityId: note.id,
		summary: `Note "${note.title}" edited`
	});
	return note;
}

export async function softDeleteNote(workspaceId: string, actorId: string, id: string) {
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('Note', id) });
	if (!existing) throw new Error('Note not found');
	if (existing.deletedAt) throw new Error('Note not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('Note', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'NOTE_DELETED',
		entityType: 'Note',
		entityId: id,
		summary: `Note "${existing.title}" deleted`
	});
}
