import { describe, it, expect } from 'vitest';
import { evidenceCreateSchema } from '$lib/schemas/evidence';
import { questionCreateSchema } from '$lib/schemas/question';
import { milestoneCreateSchema } from '$lib/schemas/milestone';
import { loginSchema, signupSchema } from '$lib/schemas/auth';

describe('zod schemas', () => {
	it('evidenceCreateSchema requires category', () => {
		expect(evidenceCreateSchema.safeParse({}).success).toBe(false);
		expect(evidenceCreateSchema.safeParse({ category: 'Photos' }).success).toBe(true);
	});

	it('questionCreateSchema requires a question', () => {
		expect(questionCreateSchema.safeParse({}).success).toBe(false);
	});

	it('milestoneCreateSchema requires phase enum value', () => {
		expect(milestoneCreateSchema.safeParse({ title: 'x' }).success).toBe(false);
		expect(milestoneCreateSchema.safeParse({ title: 'x', phase: 'PREPARATION' }).success).toBe(true);
	});

	it('loginSchema lower-cases email', () => {
		const r = loginSchema.parse({ email: 'A@B.com', password: 'x' });
		expect(r.email).toBe('a@b.com');
	});

	it('signupSchema requires 12+ char password', () => {
		expect(signupSchema.safeParse({ email: 'a@b.com', password: 'short', name: 'A' }).success).toBe(false);
		expect(
			signupSchema.safeParse({ email: 'a@b.com', password: 'long-enough-pass', name: 'A' }).success
		).toBe(true);
	});
});
