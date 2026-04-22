import { z } from 'zod';
import { stringOrEmpty } from './common';

export const appointmentTypeEnum = z.enum([
	'CIVIL_MARRIAGE',
	'BIOMETRICS',
	'ATTORNEY_CONSULT',
	'MEDICAL_EXAM',
	'INTERVIEW',
	'TRANSLATION_OR_NOTARY',
	'DOCUMENT_PICKUP',
	'OTHER'
]);

export const appointmentStatusEnum = z.enum([
	'SCHEDULED',
	'CONFIRMED',
	'COMPLETED',
	'CANCELED',
	'RESCHEDULED',
	'MISSED'
]);

export const appointmentCreateSchema = z.object({
	title: z.string().min(1).max(200),
	type: appointmentTypeEnum.default('OTHER'),
	scheduledAt: z
		.string()
		.min(1, 'Date and time required')
		.transform((v) => new Date(v)),
	durationMin: z.coerce.number().int().positive().max(60 * 24).nullish(),
	location: stringOrEmpty(500),
	confirmationDetails: stringOrEmpty(500),
	attendees: z
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
	status: appointmentStatusEnum.default('SCHEDULED'),
	notes: stringOrEmpty(5000)
});

export const appointmentUpdateSchema = appointmentCreateSchema.partial();

export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>;
