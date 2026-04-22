import type { EvidenceStatus, Prisma } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { EvidenceCreate, EvidenceUpdate } from '$lib/schemas/evidence';

export async function listEvidence(
	workspaceId: string,
	filter: { status?: EvidenceStatus; type?: string; q?: string } = {}
) {
	const where: Prisma.EvidenceItemWhereInput = { workspaceId, deletedAt: null };
	if (filter.status) where.status = filter.status;
	if (filter.type) where.type = filter.type;
	if (filter.q) {
		where.OR = [
			{ title: { contains: filter.q, mode: 'insensitive' } },
			{ description: { contains: filter.q, mode: 'insensitive' } },
			{ significance: { contains: filter.q, mode: 'insensitive' } }
		];
	}
	return db.evidenceItem.findMany({
		where,
		include: {
			files: { include: { file: true } },
			_count: { select: { tasks: true } }
		},
		orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }]
	});
}

export async function getEvidence(workspaceId: string, id: string) {
	return db.evidenceItem.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			files: { include: { file: true } },
			tasks: { where: { deletedAt: null } },
			supportingFor: { include: { form: true } },
			linkedNotes: { where: { deletedAt: null } }
		}
	});
}

export async function createEvidence(
	workspaceId: string,
	actorId: string,
	input: EvidenceCreate
) {
	const evidence = await db.evidenceItem.create({
		data: { workspaceId, ...input }
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_CREATED',
		entityType: 'EvidenceItem',
		entityId: evidence.id,
		summary: `Evidence "${evidence.title}" added`
	});
	return evidence;
}

export async function updateEvidence(
	workspaceId: string,
	actorId: string,
	id: string,
	input: EvidenceUpdate
) {
	const existing = await db.evidenceItem.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Evidence not found');
	const evidence = await db.evidenceItem.update({ where: { id }, data: input });
	const statusChanged = input.status && input.status !== existing.status;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'EVIDENCE_UPDATED',
		entityType: 'EvidenceItem',
		entityId: evidence.id,
		summary: statusChanged
			? `Evidence "${evidence.title}" marked ${evidence.status}`
			: `Evidence "${evidence.title}" updated`
	});
	return evidence;
}

export async function softDeleteEvidence(workspaceId: string, actorId: string, id: string) {
	const existing = await db.evidenceItem.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Evidence not found');
	await db.evidenceItem.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_DELETED',
		entityType: 'EvidenceItem',
		entityId: id,
		summary: `Evidence "${existing.title}" deleted`
	});
}

export async function linkFile(workspaceId: string, evidenceId: string, fileId: string) {
	const evidence = await db.evidenceItem.findFirst({
		where: { id: evidenceId, workspaceId, deletedAt: null }
	});
	if (!evidence) throw new Error('Evidence not found');
	await db.evidenceFile.upsert({
		where: { evidenceId_fileId: { evidenceId, fileId } },
		create: { evidenceId, fileId },
		update: {}
	});
}

export function summarizeCoverage(items: { type: string; status: string }[]) {
	const byType = new Map<string, { total: number; ready: number }>();
	for (const it of items) {
		const b = byType.get(it.type) ?? { total: 0, ready: 0 };
		b.total += 1;
		if (it.status === 'READY') b.ready += 1;
		byType.set(it.type, b);
	}
	return byType;
}
