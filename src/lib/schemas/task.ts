import { z } from 'zod';
import { optionalDateLoose, priorityEnum, stringOrEmpty } from './common';

export const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE']);

export type TaskStatus = z.infer<typeof taskStatusEnum>;

export const checklistItemSchema = z.object({
	text: z.string().min(1).max(200),
	done: z.coerce.boolean().default(false)
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

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
	checklist: z.array(checklistItemSchema).default([])
});

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
