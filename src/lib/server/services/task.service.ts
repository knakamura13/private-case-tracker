import type { TaskStatus } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import type { TaskCreate, TaskUpdate } from '$lib/schemas/task';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { TaskItem } from '$lib/server/dynamo/types';

export type TaskChecklistRow = {
	id: string;
	taskId: string;
	text: string;
	done: boolean;
	order: number;
};

export type TaskRow = {
	id: string;
	workspaceId: string;
	title: string;
	description: string | null;
	dueDate: Date | string | null;
	priority: string;
	status: TaskStatus;
	ownerId: string | null;
	linkedFormId: string | null;
	linkedEvidenceId: string | null;
	linkedAppointmentId: string | null;
	linkedMilestoneId: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	checklist?: TaskChecklistRow[];
	attachments?: unknown[];
	tags?: unknown[];
	// hydrated (UI compatibility)
	owner?: { id: string; name: string | null; email: string } | null;
	form?: { id: string; code: string; name: string } | null;
	evidence?: { id: string; title: string } | null;
	appointment?: { id: string; title: string } | null;
	milestone?: { id: string; title: string; phase: string | null } | null;
};

export interface TaskFilter {
	status?: TaskStatus;
	ownerId?: string;
	q?: string;
	overdueOnly?: boolean;
	limit?: number;
}

export async function listTasks(workspaceId: string, filter: TaskFilter = {}): Promise<TaskRow[]> {
	const rows = await ddbQuery<TaskItem>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'Task#' },
		Limit: filter.limit ?? 1000
	});

	const now = Date.now();
	const q = filter.q?.toLowerCase();
	const filtered = rows
		.filter((t) => !t.deletedAt)
		.filter((t) => (filter.status ? t.status === filter.status : true))
		.filter((t) => (filter.ownerId ? t.ownerId === filter.ownerId : true))
		.filter((t) =>
			q
				? String(t.title ?? '')
						.toLowerCase()
						.includes(q) ||
					String(t.description ?? '')
						.toLowerCase()
						.includes(q)
				: true
		)
		.filter((t) => {
			if (!filter.overdueOnly) return true;
			const due = t.dueDate ? Date.parse(t.dueDate) : NaN;
			if (!Number.isFinite(due)) return false;
			if (t.status === 'DONE' || t.status === 'ARCHIVED') return false;
			return due < now;
		})
		.map((t) => ({
			...t,
			status: t.status as TaskStatus,
			createdAt: t.createdAt ?? '',
			updatedAt: t.updatedAt ?? '',
			deletedAt: t.deletedAt ?? null,
			owner: t.ownerId ? { id: t.ownerId, name: null, email: '' } : null,
			form: t.linkedFormId ? { id: t.linkedFormId, code: '', name: '' } : null,
			evidence: t.linkedEvidenceId ? { id: t.linkedEvidenceId, title: '' } : null,
			appointment: t.linkedAppointmentId ? { id: t.linkedAppointmentId, title: '' } : null,
			milestone: t.linkedMilestoneId ? { id: t.linkedMilestoneId, title: '', phase: null } : null,
			checklist: t.checklist ?? [],
			tags: t.tags ?? []
		}));

	filtered.sort((a, b) => {
		if (a.status !== b.status) return String(a.status).localeCompare(String(b.status));
		const ad = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
		const bd = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
		if (ad !== bd) return ad - bd;
		const ap = Number(a.priority ?? 0);
		const bp = Number(b.priority ?? 0);
		if (ap !== bp) return bp - ap;
		return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
	});

	return filtered;
}

export async function getTask(workspaceId: string, id: string): Promise<TaskRow | null> {
	const task = await ddbGet<TaskItem>({ PK: wsPk(workspaceId), SK: entitySk('Task', id) });
	if (!task || task.deletedAt) return null;
	return {
		...task,
		status: task.status as TaskStatus,
		createdAt: task.createdAt ?? '',
		updatedAt: task.updatedAt ?? '',
		deletedAt: task.deletedAt ?? null,
		owner: task.ownerId ? { id: task.ownerId, name: null, email: '' } : null,
		form: task.linkedFormId ? { id: task.linkedFormId, code: '', name: '' } : null,
		evidence: task.linkedEvidenceId ? { id: task.linkedEvidenceId, title: '' } : null,
		appointment: task.linkedAppointmentId ? { id: task.linkedAppointmentId, title: '' } : null,
		milestone: task.linkedMilestoneId
			? { id: task.linkedMilestoneId, title: '', phase: null }
			: null,
		checklist: (task.checklist ?? [])
			.slice()
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
		attachments: task.attachments ?? [],
		tags: task.tags ?? []
	};
}

export async function createTask(workspaceId: string, actorId: string, input: TaskCreate) {
	const now = new Date().toISOString();
	const task: TaskRow = {
		id: randomUUID(),
		workspaceId,
		...input,
		order: (input as any).order ?? 0,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now,
		checklist: [],
		attachments: [],
		tags: []
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('Task', task.id), ...task });
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
	const existing = await ddbGet<TaskItem>({ PK: wsPk(workspaceId), SK: entitySk('Task', id) });
	if (!existing) throw new Error('Task not found');
	if (existing.deletedAt) throw new Error('Task not found');

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
	const task = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('Task', id) },
		`SET ${sets.join(', ')}`,
		values,
		names
	)) ?? { ...existing, ...patch };
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
	const existing = await ddbGet<TaskItem>({ PK: wsPk(workspaceId), SK: entitySk('Task', id) });
	if (!existing) throw new Error('Task not found');
	if (existing.deletedAt) throw new Error('Task not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('Task', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
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
	const existing = await ddbGet<TaskItem>({ PK: wsPk(workspaceId), SK: entitySk('Task', id) });
	if (!existing) throw new Error('Task not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('Task', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': null, ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
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
	const task = await ddbGet<TaskItem>({ PK: wsPk(workspaceId), SK: entitySk('Task', taskId) });
	if (!task) throw new Error('Task not found');
	if (task.deletedAt) throw new Error('Task not found');
	const checklist = items.map((item, idx) => ({
		id: item.id ?? randomUUID(),
		taskId,
		text: item.text,
		done: item.done,
		order: idx
	}));
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('Task', taskId) },
		'SET #checklist = :c, #updatedAt = :u',
		{ ':c': checklist, ':u': new Date().toISOString() },
		{ '#checklist': 'checklist', '#updatedAt': 'updatedAt' }
	);
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
	for (const u of updates) {
		await ddbUpdate<TaskItem>(
			{ PK: wsPk(workspaceId), SK: entitySk('Task', u.id) },
			'SET #status = :s, #order = :o, #updatedAt = :u',
			{ ':s': u.status, ':o': u.order, ':u': new Date().toISOString() },
			{ '#status': 'status', '#order': 'order', '#updatedAt': 'updatedAt' }
		);
	}
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'TASK_UPDATED',
		entityType: 'Task',
		entityId: updates[0]?.id ?? 'batch',
		summary: `Reordered ${updates.length} tasks on the board`
	});
}
