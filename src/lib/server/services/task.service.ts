import type { Prisma, TaskStatus } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { TaskCreate, TaskUpdate } from '$lib/schemas/task';

export interface TaskFilter {
	status?: TaskStatus;
	ownerId?: string;
	q?: string;
	overdueOnly?: boolean;
}

export async function listTasks(workspaceId: string, filter: TaskFilter = {}) {
	const where: Prisma.TaskWhereInput = { workspaceId, deletedAt: null };
	if (filter.status) where.status = filter.status;
	if (filter.ownerId) where.ownerId = filter.ownerId;
	if (filter.q) {
		where.OR = [
			{ title: { contains: filter.q, mode: 'insensitive' } },
			{ description: { contains: filter.q, mode: 'insensitive' } }
		];
	}
	if (filter.overdueOnly) {
		where.dueDate = { lt: new Date() };
		where.status = { notIn: ['DONE', 'ARCHIVED'] };
	}
	return db.task.findMany({
		where,
		include: {
			owner: { select: { id: true, name: true, email: true } },
			form: { select: { id: true, code: true, name: true } },
			evidence: { select: { id: true, title: true } },
			appointment: { select: { id: true, title: true } },
			milestone: { select: { id: true, title: true, phase: true } },
			checklist: true,
			tags: { include: { tag: true } }
		},
		orderBy: [
			{ status: 'asc' },
			{ dueDate: { sort: 'asc', nulls: 'last' } },
			{ priority: 'desc' },
			{ createdAt: 'desc' }
		]
	});
}

export async function getTask(workspaceId: string, id: string) {
	return db.task.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			owner: { select: { id: true, name: true, email: true } },
			form: true,
			evidence: true,
			appointment: true,
			milestone: true,
			checklist: { orderBy: { order: 'asc' } },
			attachments: true,
			tags: { include: { tag: true } }
		}
	});
}

export async function createTask(workspaceId: string, actorId: string, input: TaskCreate) {
	const task = await db.task.create({
		data: { workspaceId, ...input }
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'TASK_CREATED',
		entityType: 'Task',
		entityId: task.id,
		summary: `Task "${task.title}" created`
	});
	return task;
}

export async function updateTask(
	workspaceId: string,
	actorId: string,
	id: string,
	input: TaskUpdate
) {
	const existing = await db.task.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Task not found');
	const task = await db.task.update({ where: { id }, data: input });
	const statusChanged = input.status && input.status !== existing.status;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'TASK_UPDATED',
		entityType: 'Task',
		entityId: task.id,
		summary: statusChanged
			? `Task "${task.title}" moved to ${task.status}`
			: `Task "${task.title}" updated`
	});
	return task;
}

export async function softDeleteTask(workspaceId: string, actorId: string, id: string) {
	const existing = await db.task.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Task not found');
	await db.task.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'TASK_DELETED',
		entityType: 'Task',
		entityId: id,
		summary: `Task "${existing.title}" deleted`
	});
}

export async function restoreTask(workspaceId: string, actorId: string, id: string) {
	const existing = await db.task.findFirst({ where: { id, workspaceId } });
	if (!existing) throw new Error('Task not found');
	await db.task.update({ where: { id }, data: { deletedAt: null } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'TASK_UPDATED',
		entityType: 'Task',
		entityId: id,
		summary: `Task "${existing.title}" restored`
	});
}

export async function setChecklist(
	workspaceId: string,
	actorId: string,
	taskId: string,
	items: { id?: string; text: string; done: boolean }[]
) {
	const task = await db.task.findFirst({ where: { id: taskId, workspaceId, deletedAt: null } });
	if (!task) throw new Error('Task not found');
	await db.$transaction(async (tx) => {
		await tx.taskChecklistItem.deleteMany({ where: { taskId } });
		if (items.length) {
			await tx.taskChecklistItem.createMany({
				data: items.map((item, idx) => ({
					taskId,
					text: item.text,
					done: item.done,
					order: idx
				}))
			});
		}
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'TASK_UPDATED',
		entityType: 'Task',
		entityId: taskId,
		summary: `Updated checklist on "${task.title}"`
	});
}

export async function reorderOnBoard(
	workspaceId: string,
	actorId: string,
	updates: { id: string; status: TaskStatus; order: number }[]
) {
	await db.$transaction(
		updates.map((u) =>
			db.task.updateMany({
				where: { id: u.id, workspaceId, deletedAt: null },
				data: { status: u.status, order: u.order }
			})
		)
	);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'TASK_UPDATED',
		entityType: 'Task',
		entityId: updates[0]?.id ?? 'batch',
		summary: `Reordered ${updates.length} tasks on the board`
	});
}
