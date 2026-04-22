import { describe, it, expect } from 'vitest';
import { taskCreateSchema } from '$lib/schemas/task';
import { formCreateSchema } from '$lib/schemas/form';
import { evidenceCreateSchema } from '$lib/schemas/evidence';
import { appointmentCreateSchema } from '$lib/schemas/appointment';
import { questionCreateSchema } from '$lib/schemas/question';
import { noteCreateSchema } from '$lib/schemas/note';
import { milestoneCreateSchema } from '$lib/schemas/milestone';
import { uploadUrlRequestSchema } from '$lib/schemas/document';
import { loginSchema, signupSchema } from '$lib/schemas/auth';

describe('zod schemas', () => {
	it('taskCreateSchema accepts a minimal payload', () => {
		const r = taskCreateSchema.parse({ title: 'Buy stamps' });
		expect(r.title).toBe('Buy stamps');
		expect(r.status).toBe('TODO');
		expect(r.priority).toBe('MEDIUM');
	});

	it('taskCreateSchema rejects missing title', () => {
		expect(taskCreateSchema.safeParse({ title: '' }).success).toBe(false);
	});

	it('formCreateSchema requires code and name', () => {
		expect(formCreateSchema.safeParse({ name: 'X' }).success).toBe(false);
		expect(formCreateSchema.safeParse({ name: 'Petition', code: 'I-130' }).success).toBe(true);
	});

	it('evidenceCreateSchema parses peopleInvolved CSV string', () => {
		const r = evidenceCreateSchema.parse({
			title: 'Photos',
			type: 'Photos',
			peopleInvolved: 'Alice, Bob, '
		});
		expect(r.peopleInvolved).toEqual(['Alice', 'Bob']);
	});

	it('evidenceCreateSchema clamps confidence to [1,5]', () => {
		expect(evidenceCreateSchema.safeParse({ title: 'x', type: 'y', confidenceScore: 0 }).success).toBe(false);
		expect(evidenceCreateSchema.safeParse({ title: 'x', type: 'y', confidenceScore: 6 }).success).toBe(false);
		expect(evidenceCreateSchema.safeParse({ title: 'x', type: 'y', confidenceScore: 3 }).success).toBe(true);
	});

	it('appointmentCreateSchema converts scheduledAt string to Date', () => {
		const r = appointmentCreateSchema.parse({
			title: 'Biometrics',
			type: 'BIOMETRICS',
			scheduledAt: '2026-09-01T10:00'
		});
		expect(r.scheduledAt).toBeInstanceOf(Date);
	});

	it('questionCreateSchema requires a question', () => {
		expect(questionCreateSchema.safeParse({}).success).toBe(false);
	});

	it('noteCreateSchema accepts blank body', () => {
		const r = noteCreateSchema.parse({ title: 'x' });
		expect(r.bodyMd).toBe('');
	});

	it('milestoneCreateSchema requires phase enum value', () => {
		expect(milestoneCreateSchema.safeParse({ title: 'x' }).success).toBe(false);
		expect(milestoneCreateSchema.safeParse({ title: 'x', phase: 'PREPARATION' }).success).toBe(true);
	});

	it('uploadUrlRequestSchema enforces size cap', () => {
		const ok = uploadUrlRequestSchema.parse({
			filename: 'a.txt',
			contentType: 'text/plain',
			sizeBytes: 100,
			title: 'X',
			category: 'Other'
		});
		expect(ok.sizeBytes).toBe(100);
		const tooBig = uploadUrlRequestSchema.safeParse({
			filename: 'big.bin',
			contentType: 'application/octet-stream',
			sizeBytes: 60 * 1024 * 1024,
			title: 'X',
			category: 'Other'
		});
		expect(tooBig.success).toBe(false);
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
