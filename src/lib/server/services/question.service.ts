import type { Prisma, QuestionSourceType, QuestionStatus } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { QuestionCreate, QuestionUpdate } from '$lib/schemas/question';

export async function listQuestions(
	workspaceId: string,
	filter: { status?: QuestionStatus; sourceType?: QuestionSourceType; q?: string } = {}
) {
	const where: Prisma.QuestionItemWhereInput = { workspaceId, deletedAt: null };
	if (filter.status) where.status = filter.status;
	if (filter.sourceType) where.sourceType = filter.sourceType;
	if (filter.q) {
		where.OR = [
			{ question: { contains: filter.q, mode: 'insensitive' } },
			{ answer: { contains: filter.q, mode: 'insensitive' } }
		];
	}
	return db.questionItem.findMany({
		where,
		orderBy: [{ status: 'asc' }, { priority: 'desc' }, { updatedAt: 'desc' }]
	});
}

export async function getQuestion(workspaceId: string, id: string) {
	return db.questionItem.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			relatedForm: true,
			relatedEvidence: true
		}
	});
}

export async function createQuestion(
	workspaceId: string,
	actorId: string,
	input: QuestionCreate
) {
	const question = await db.questionItem.create({
		data: {
			workspaceId,
			...input,
			answeredAt: input.status === 'ANSWERED' ? (input.answeredAt ?? new Date()) : input.answeredAt
		}
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'QUESTION_CREATED',
		entityType: 'QuestionItem',
		entityId: question.id,
		summary: `Question "${question.question.slice(0, 60)}…" added`
	});
	return question;
}

export async function updateQuestion(
	workspaceId: string,
	actorId: string,
	id: string,
	input: QuestionUpdate
) {
	const existing = await db.questionItem.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Question not found');
	const answeredAt =
		input.status === 'ANSWERED' && !existing.answeredAt ? new Date() : (input.answeredAt ?? undefined);
	const question = await db.questionItem.update({
		where: { id },
		data: { ...input, answeredAt }
	});
	const statusChanged = input.status && input.status !== existing.status;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'QUESTION_UPDATED',
		entityType: 'QuestionItem',
		entityId: question.id,
		summary: statusChanged
			? `Question moved to ${question.status}`
			: `Question updated`
	});
	return question;
}

export async function softDeleteQuestion(workspaceId: string, actorId: string, id: string) {
	const existing = await db.questionItem.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Question not found');
	await db.questionItem.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'QUESTION_DELETED',
		entityType: 'QuestionItem',
		entityId: id,
		summary: `Question deleted`
	});
}
