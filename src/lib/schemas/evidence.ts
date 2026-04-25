import { z } from 'zod';

// Schema for adding a new evidence category
export const evidenceCategoryAddSchema = z.object({
	category: z.string().min(1).max(80)
});

// Schema for renaming an evidence category
export const evidenceCategoryRenameSchema = z.object({
	oldName: z.string().min(1).max(80),
	newName: z.string().min(1).max(80)
});

// Schema for deleting an evidence category
export const evidenceCategoryDeleteSchema = z.object({
	category: z.string().min(1).max(80)
});

// Schema for updating evidence target
export const evidenceTargetUpdateSchema = z.object({
	category: z.string().min(1).max(80),
	target: z.coerce.number().int().min(0)
});

// Schema for incrementing evidence count
export const evidenceCountIncrementSchema = z.object({
	category: z.string().min(1).max(80),
	delta: z.coerce.number().int()
});

export type EvidenceCategoryAdd = z.infer<typeof evidenceCategoryAddSchema>;
export type EvidenceCategoryRename = z.infer<typeof evidenceCategoryRenameSchema>;
export type EvidenceCategoryDelete = z.infer<typeof evidenceCategoryDeleteSchema>;
export type EvidenceTargetUpdate = z.infer<typeof evidenceTargetUpdateSchema>;
export type EvidenceCountIncrement = z.infer<typeof evidenceCountIncrementSchema>;
