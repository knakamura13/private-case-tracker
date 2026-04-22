import { z } from 'zod';
import { optionalDateLoose, stringOrEmpty } from './common';

export const formFilingStatusEnum = z.enum([
	'NOT_STARTED',
	'IN_PROGRESS',
	'READY_FOR_REVIEW',
	'FILED',
	'RECEIVED',
	'REPLACED',
	'NOT_NEEDED'
]);

export const formCreateSchema = z.object({
	name: z.string().min(1).max(200),
	code: z.string().min(1).max(40),
	purpose: stringOrEmpty(500),
	filingStatus: formFilingStatusEnum.default('NOT_STARTED'),
	plannedFilingDate: optionalDateLoose,
	actualFilingDate: optionalDateLoose,
	receiptNumber: z
		.string()
		.trim()
		.optional()
		.transform((v) => (v && v.length ? v : null)),
	notes: stringOrEmpty(5000)
});

export const formUpdateSchema = formCreateSchema.partial();

export const supportingItemSchema = z.object({
	label: z.string().min(1).max(200),
	required: z.coerce.boolean().default(true),
	done: z.coerce.boolean().default(false),
	satisfiedByEvidenceId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null)),
	satisfiedByFileId: z
		.string()
		.optional()
		.transform((v) => (v && v.length ? v : null))
});

export type FormCreate = z.infer<typeof formCreateSchema>;
export type FormUpdate = z.infer<typeof formUpdateSchema>;
