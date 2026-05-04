import { z } from 'zod';

export const cuidLike = z.string().min(1).max(64);

// Coerces empty strings (from HTML form selects) to null for optional FK fields.
export const optionalId = z
    .string()
    .optional()
    .transform((v) => (v && v.length ? v : null));

export const optionalDate = z
    .union([z.string().datetime(), z.string().length(0), z.null(), z.undefined()])
    .transform((v) => (v && v.length ? new Date(v) : null));

/** @deprecated Use optionalDateOnly instead — this accepts any string and can silently produce Invalid Date. */
export const optionalDateLoose = z
    .string()
    .optional()
    .transform((v) => (v && v.length ? new Date(v) : null));

/** Validates YYYY-MM-DD format before constructing a Date, preventing silent Invalid Date objects. */
export const optionalDateOnly = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
    .optional()
    .nullable()
    .transform((v) => (v && v.length ? new Date(v + 'T00:00:00') : null));

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export function stringOrEmpty(max = 2000) {
    return z
        .string()
        .max(max)
        .optional()
        .transform((v) => (v === undefined || v === '' ? null : v));
}
