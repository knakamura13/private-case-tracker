import { z } from 'zod';

export const emailSchema = z.string().email().trim().toLowerCase();
export const passwordSchema = z
	.string()
	.min(12, 'Password must be at least 12 characters')
	.max(256);
export const nameSchema = z.string().min(1).max(120);

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1)
});

export const signupSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	name: nameSchema,
	workspaceName: z.string().min(1).max(80).default('Our case'),
	inviteToken: z.string().optional()
});

export const inviteSchema = z.object({
	email: emailSchema,
	role: z.enum(['OWNER', 'COLLABORATOR']).default('COLLABORATOR')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
