import type { MilestonePhase, MilestoneStatus, Prisma } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import { PHASE_ORDER } from '$lib/constants/phases';
import type { MilestoneCreate, MilestoneUpdate } from '$lib/schemas/milestone';

export async function listMilestones(
	workspaceId: string,
	filter: { phase?: MilestonePhase; status?: MilestoneStatus } = {}
) {
	const where: Prisma.TimelineMilestoneWhereInput = { workspaceId, deletedAt: null };
	if (filter.phase) where.phase = filter.phase;
	if (filter.status) where.status = filter.status;
	return db.timelineMilestone.findMany({
		where,
		include: { owner: { select: { id: true, name: true, email: true } } },
		orderBy: [{ phase: 'asc' }, { order: 'asc' }, { dueDate: 'asc' }]
	});
}

export async function getMilestone(workspaceId: string, id: string) {
	return db.timelineMilestone.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			owner: { select: { id: true, name: true, email: true } },
			tasks: { where: { deletedAt: null } }
		}
	});
}

export async function createMilestone(
	workspaceId: string,
	actorId: string,
	input: MilestoneCreate
) {
	const count = await db.timelineMilestone.count({
		where: { workspaceId, phase: input.phase, deletedAt: null }
	});
	const milestone = await db.timelineMilestone.create({
		data: { workspaceId, ...input, order: count }
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'MILESTONE_CREATED',
		entityType: 'TimelineMilestone',
		entityId: milestone.id,
		summary: `Milestone "${milestone.title}" added in ${milestone.phase}`
	});
	return milestone;
}

export async function updateMilestone(
	workspaceId: string,
	actorId: string,
	id: string,
	input: MilestoneUpdate
) {
	const existing = await db.timelineMilestone.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Milestone not found');
	const completedAt =
		input.status === 'DONE' && !existing.completedAt
			? new Date()
			: input.status && input.status !== 'DONE'
				? null
				: undefined;
	const milestone = await db.timelineMilestone.update({
		where: { id },
		data: { ...input, completedAt }
	});
	const statusChanged = input.status && input.status !== existing.status;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'MILESTONE_UPDATED',
		entityType: 'TimelineMilestone',
		entityId: milestone.id,
		summary: statusChanged
			? `Milestone "${milestone.title}" marked ${milestone.status}`
			: `Milestone "${milestone.title}" updated`
	});
	return milestone;
}

export async function softDeleteMilestone(workspaceId: string, actorId: string, id: string) {
	const existing = await db.timelineMilestone.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Milestone not found');
	await db.timelineMilestone.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'MILESTONE_DELETED',
		entityType: 'TimelineMilestone',
		entityId: id,
		summary: `Milestone "${existing.title}" deleted`
	});
}

export function currentPhase(
	milestones: { phase: MilestonePhase; status: MilestoneStatus }[]
): MilestonePhase {
	// Current phase = the earliest phase with any non-DONE milestone; else OUTCOME.
	for (const phase of PHASE_ORDER) {
		const inPhase = milestones.filter((m) => m.phase === phase);
		if (inPhase.length === 0) continue;
		if (inPhase.some((m) => m.status !== 'DONE' && m.status !== 'SKIPPED')) return phase;
	}
	return 'OUTCOME';
}
