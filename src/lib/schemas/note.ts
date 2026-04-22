import { z } from 'zod';

export const noteCreateSchema = z.object({
	title: z.string().min(1).max(200),
	bodyMd: z.string().max(50_000).default(''),
	linkedTaskId: z.string().nullish(),
	linkedFormId: z.string().nullish(),
	linkedEvidenceId: z.string().nullish(),
	linkedAppointmentId: z.string().nullish()
});

export const noteUpdateSchema = noteCreateSchema.partial();

export type NoteCreate = z.infer<typeof noteCreateSchema>;
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;
