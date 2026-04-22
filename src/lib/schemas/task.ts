import { z } from 'zod';
import { optionalDateLoose, priorityEnum, stringOrEmpty } from './common';

export const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED']);

export const taskCreateSchema = z.object({
	title: z.string().min(1).max(200),
	description: stringOrEmpty(5000),
	dueDate: optionalDateLoose,
	priority: priorityEnum.default('MEDIUM'),
	status: taskStatusEnum.default('TODO'),
	ownerId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null)),
	linkedFormId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null)),
	linkedEvidenceId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null)),
	linkedAppointmentId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null)),
	linkedMilestoneId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null))
});

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;

export const checklistItemSchema = z.object({
	text: z.string().min(1).max(200),
	done: z.coerce.boolean().default(false)
});
