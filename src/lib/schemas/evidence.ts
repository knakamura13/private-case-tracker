import { z } from 'zod';
import { optionalDateLoose, stringOrEmpty } from './common';

export const evidenceStatusEnum = z.enum([
	'COLLECTED',
	'NEEDS_SCAN',
	'NEEDS_TRANSLATION',
	'NEEDS_BETTER_COPY',
	'READY'
]);

export const evidenceCreateSchema = z.object({
	title: z.string().min(1).max(200),
	type: z.string().min(1).max(80),
	dateStart: optionalDateLoose,
	dateEnd: optionalDateLoose,
	peopleInvolved: z
		.union([z.array(z.string()), z.string()])
		.optional()
		.transform((v) => {
			if (!v) return [];
			if (Array.isArray(v)) return v.filter(Boolean);
			return v
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		}),
	description: stringOrEmpty(5000),
	significance: stringOrEmpty(1000),
	status: evidenceStatusEnum.default('COLLECTED'),
	confidenceScore: z.coerce.number().int().min(1).max(5).default(3),
	includedInPacket: z.coerce.boolean().default(false),
	notes: stringOrEmpty(5000)
});

export const evidenceUpdateSchema = evidenceCreateSchema.partial();

export type EvidenceCreate = z.infer<typeof evidenceCreateSchema>;
export type EvidenceUpdate = z.infer<typeof evidenceUpdateSchema>;
