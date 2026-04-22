import type { Prisma } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { NoteCreate, NoteUpdate } from '$lib/schemas/note';

export async function listNotes(workspaceId: string, filter: { q?: string } = {}) {
	const where: Prisma.NoteWhereInput = { workspaceId, deletedAt: null };
	if (filter.q) {
		where.OR = [
			{ title: { contains: filter.q, mode: 'insensitive' } },
			{ bodyMd: { contains: filter.q, mode: 'insensitive' } }
		];
	}
	return db.note.findMany({
		where,
		include: { author: { select: { id: true, name: true, email: true } } },
		orderBy: { updatedAt: 'desc' }
	});
}

export async function getNote(workspaceId: string, id: string) {
	return db.note.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			author: { select: { id: true, name: true, email: true } },
			task: true,
			form: true,
			evidence: true,
			appointment: true
		}
	});
}

export async function createNote(workspaceId: string, authorId: string, input: NoteCreate) {
	const note = await db.note.create({
		data: { workspaceId, authorId, ...input }
	});
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
	const existing = await db.note.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Note not found');
	const note = await db.note.update({ where: { id }, data: input });
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
	const existing = await db.note.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Note not found');
	await db.note.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'NOTE_DELETED',
		entityType: 'Note',
		entityId: id,
		summary: `Note "${existing.title}" deleted`
	});
}
