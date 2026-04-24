import { z } from 'zod';
import { optionalDateLoose, optionalId, priorityEnum, stringOrEmpty } from './common';

export const milestonePhaseEnum = z.enum([
	'PREPARATION',
	'RELATIONSHIP_EVIDENCE',
	'MARRIAGE_LICENSE',
	'PACKET_DRAFTING',
	'FILING',
	'RECEIPT_NOTICES',
	'BIOMETRICS',
	'INTERVIEW_PREP',
	'POST_INTERVIEW',
	'OUTCOME'
]);

export const milestoneStatusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'SKIPPED']);

export const subTaskSchema = z.object({
	id: z.string().uuid(),
	text: z.string().min(1).max(200),
	done: z.coerce.boolean().default(false)
});

export const milestoneCreateSchema = z.object({
	title: z.string().min(1).max(200),
	description: stringOrEmpty(2000),
	phase: milestonePhaseEnum,
	dueDate: optionalDateLoose,
	status: milestoneStatusEnum.default('PLANNED'),
	ownerId: optionalId,
	priority: priorityEnum.default('MEDIUM'),
	notes: stringOrEmpty(5000),
	subTasks: z.array(subTaskSchema).default([])
});

export const milestoneUpdateSchema = milestoneCreateSchema.partial();

export type MilestoneCreate = z.infer<typeof milestoneCreateSchema>;
export type MilestoneUpdate = z.infer<typeof milestoneUpdateSchema>;
