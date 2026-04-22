import { z } from 'zod';
import { optionalId } from './common';

export const noteCreateSchema = z.object({
	title: z.string().min(1).max(200),
	bodyMd: z.string().max(50_000).default(''),
	linkedTaskId: optionalId,
	linkedFormId: optionalId,
	linkedEvidenceId: optionalId,
	linkedAppointmentId: optionalId
});

export const noteUpdateSchema = noteCreateSchema.partial();

export type NoteCreate = z.infer<typeof noteCreateSchema>;
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;
