import { z } from 'zod';

export const evidenceCreateSchema = z.object({
	category: z.string().min(1).max(80),
	targetCount: z.coerce.number().int().min(0).default(0),
	currentCount: z.coerce.number().int().min(0).default(0)
});

export const evidenceUpdateSchema = evidenceCreateSchema.partial();

export type EvidenceCreate = z.infer<typeof evidenceCreateSchema>;
export type EvidenceUpdate = z.infer<typeof evidenceUpdateSchema>;
