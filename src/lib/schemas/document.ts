import { z } from 'zod';
import { stringOrEmpty } from './common';

export const fileStorageModeEnum = z.enum(['UPLOADED', 'EXTERNAL_LINK']);

export const documentMetadataSchema = z.object({
	title: z.string().min(1).max(200),
	category: z.string().min(1).max(80),
	storageMode: fileStorageModeEnum.default('EXTERNAL_LINK'),
	externalUrl: z
		.string()
		.url()
		.optional()
		.or(z.literal(''))
		.transform((v) => (v && v.length ? v : null)),
	notes: stringOrEmpty(2000),
	linkedTaskId: z
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
		.transform((v) => (v && v.length ? v : null))
});

export const uploadUrlRequestSchema = z.object({
	filename: z.string().min(1).max(200),
	contentType: z.string().min(1).max(120),
	sizeBytes: z.coerce.number().int().positive().max(50 * 1024 * 1024),
	title: z.string().min(1).max(200),
	category: z.string().min(1).max(80),
	linkedTaskId: z.string().nullish(),
	linkedFormId: z.string().nullish(),
	linkedEvidenceId: z.string().nullish()
});

export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
