import { z } from 'zod';
import { stringOrEmpty } from './common';

const httpHttpsUrl = z
	.string()
	.trim()
	.transform((s) => {
		if (!s.length) return s;
		// If a scheme is already present (e.g. ftp://, javascript:), do not prepend https://
		if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
		return `https://${s}`;
	})
	.pipe(
		z
			.string()
			.url()
			.max(2000)
			.refine((u) => {
				try {
					const p = new URL(u).protocol;
					return p === 'http:' || p === 'https:';
				} catch {
					return false;
				}
			}, 'URL must use http or https')
	);

const optionalTitle = z
	.string()
	.max(200)
	.optional()
	.transform((v) => (v === undefined || v.trim() === '' ? null : v.trim()));

export const quickLinkCreateSchema = z.object({
	url: httpHttpsUrl,
	title: optionalTitle,
	description: stringOrEmpty(2000),
	notes: stringOrEmpty(5000)
});

export const quickLinkUpdateSchema = quickLinkCreateSchema.partial().extend({
	id: z.string().min(1)
});

export const quickLinkDeleteSchema = z.object({
	id: z.string().min(1)
});

export type QuickLinkCreate = z.infer<typeof quickLinkCreateSchema>;
export type QuickLinkUpdate = z.infer<typeof quickLinkUpdateSchema>;
