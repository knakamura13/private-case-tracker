import { z } from 'zod';
import { optionalDateLoose, priorityEnum, stringOrEmpty } from './common';

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

export const milestoneCreateSchema = z.object({
	title: z.string().min(1).max(200),
	description: stringOrEmpty(2000),
	phase: milestonePhaseEnum,
	dueDate: optionalDateLoose,
	status: milestoneStatusEnum.default('PLANNED'),
	ownerId: z.string().nullish(),
	priority: priorityEnum.default('MEDIUM'),
	notes: stringOrEmpty(5000)
});

export const milestoneUpdateSchema = milestoneCreateSchema.partial();

export type MilestoneCreate = z.infer<typeof milestoneCreateSchema>;
export type MilestoneUpdate = z.infer<typeof milestoneUpdateSchema>;
