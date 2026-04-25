import { describe, it, expect, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
	createEvidence,
	getEvidence,
	listEvidence,
	updateEvidence,
	softDeleteEvidence
} from '$lib/server/services/evidence.service';
import {
	createMilestone,
	listMilestones,
	softDeleteMilestone,
	updateMilestone
} from '$lib/server/services/milestone.service';
import {
	createQuestion,
	listQuestions,
	softDeleteQuestion,
	updateQuestion
} from '$lib/server/services/question.service';
import {
	createQuickLink,
	listQuickLinks,
	softDeleteQuickLink,
	updateQuickLink
} from '$lib/server/services/quickLink.service';
import { dashboardFor } from '$lib/server/services/dashboard.service';

const actorId = 'smoke-user';

function workspaceId() {
	return `ws_${Math.random().toString(36).slice(2, 10)}`;
}

describe('cross-domain DynamoDB smoke', () => {
	beforeEach(() => {
		(globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
	});

	it('evidence: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createEvidence(ws, actorId, {
			category: 'Photos',
			targetCount: 10,
			currentCount: 3
		} as any);

		expect((await listEvidence(ws)).length).toBe(1);
		await updateEvidence(ws, actorId, created.id, { currentCount: 5 } as any);
		expect((await getEvidence(ws, created.id))?.currentCount).toBe(5);
		await softDeleteEvidence(ws, actorId, created.id);
		expect((await listEvidence(ws)).length).toBe(0);
	});

	it('milestones: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createMilestone(ws, actorId, {
			title: 'Collect marriage certificate',
			description: '',
			phase: 'MARRIAGE_LICENSE',
			dueDate: null,
			status: 'PLANNED',
			ownerId: null,
			priority: 'MEDIUM',
			notes: '',
			subTasks: []
		} as any);

		expect((await listMilestones(ws)).some((m) => m.id === created.id)).toBe(true);
		await updateMilestone(ws, actorId, created.id, { status: 'IN_PROGRESS' } as any);
		await softDeleteMilestone(ws, actorId, created.id);
		expect((await listMilestones(ws)).length).toBe(0);
	});

	it('questions: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createQuestion(ws, actorId, {
			question: 'Do we need birth certificate translations?',
			category: '',
			priority: 'MEDIUM',
			status: 'OPEN',
			answer: '',
			sourceType: 'OTHER',
			citationUrl: null,
			answeredAt: null,
			relatedTaskId: null,
			relatedFormId: null,
			relatedEvidenceId: null
		} as any);

		expect((await listQuestions(ws)).some((q) => q.id === created.id)).toBe(true);
		await updateQuestion(ws, actorId, created.id, { status: 'RESEARCHING' } as any);
		await softDeleteQuestion(ws, actorId, created.id);
		expect((await listQuestions(ws)).length).toBe(0);
	});

	it('quick links: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createQuickLink(ws, actorId, {
			url: 'https://uscis.gov',
			title: 'USCIS',
			description: '',
			notes: ''
		} as any);

		expect((await listQuickLinks(ws)).length).toBe(1);
		await updateQuickLink(ws, actorId, created.id, {
			id: created.id,
			url: 'https://www.uscis.gov',
			title: 'USCIS (updated)',
			description: '',
			notes: ''
		} as any);
		await softDeleteQuickLink(ws, actorId, created.id);
		expect((await listQuickLinks(ws)).length).toBe(0);
	});

	it('dashboard: aggregates across domains without error', async () => {
		const ws = workspaceId();
		await createMilestone(ws, actorId, {
			title: 'M1',
			description: '',
			phase: 'PREPARATION',
			dueDate: null,
			status: 'PLANNED',
			ownerId: null,
			priority: 'MEDIUM',
			notes: '',
			subTasks: []
		} as any);

		const d = await dashboardFor(ws);
		expect(d).toBeTruthy();
		expect(Array.isArray(d.phaseProgress)).toBe(true);
	});
});
