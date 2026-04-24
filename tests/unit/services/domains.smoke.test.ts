import { describe, it, expect, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
	createNote,
	getNote,
	listNotes,
	updateNote,
	softDeleteNote
} from '$lib/server/services/note.service';
import {
	createEvidence,
	getEvidence,
	listEvidence,
	updateEvidence,
	softDeleteEvidence
} from '$lib/server/services/evidence.service';
import {
	createForm,
	getForm,
	listForms,
	updateForm,
	softDeleteForm
} from '$lib/server/services/form.service';
import {
	createAppointment,
	listAppointments,
	softDeleteAppointment,
	updateAppointment
} from '$lib/server/services/appointment.service';
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

	it('notes: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createNote(ws, actorId, {
			title: 'Research notes',
			bodyMd: 'Initial notes',
			linkedTaskId: null,
			linkedFormId: null,
			linkedEvidenceId: null,
			linkedAppointmentId: null
		} as any);

		expect((await listNotes(ws)).length).toBe(1);
		await updateNote(ws, actorId, created.id, { bodyMd: 'Updated body' } as any);
		expect((await getNote(ws, created.id))?.bodyMd).toBe('Updated body');
		await softDeleteNote(ws, actorId, created.id);
		expect((await listNotes(ws)).length).toBe(0);
	});

	it('evidence: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createEvidence(ws, actorId, {
			title: 'Joint lease',
			type: 'FINANCIAL_COMINGLING',
			dateStart: null,
			dateEnd: null,
			peopleInvolved: [],
			description: '',
			significance: '',
			status: 'COLLECTED',
			confidenceScore: 3,
			includedInPacket: false,
			notes: ''
		} as any);

		expect((await listEvidence(ws)).length).toBe(1);
		await updateEvidence(ws, actorId, created.id, { status: 'READY' } as any);
		expect((await getEvidence(ws, created.id))?.status).toBe('READY');
		await softDeleteEvidence(ws, actorId, created.id);
		expect((await listEvidence(ws)).length).toBe(0);
	});

	it('forms: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createForm(ws, actorId, {
			name: 'I-130',
			code: 'I-130',
			purpose: 'Petition',
			filingStatus: 'NOT_STARTED',
			plannedFilingDate: null,
			actualFilingDate: null,
			receiptNumber: null,
			notes: ''
		} as any);

		expect((await listForms(ws)).some((f) => f.id === created.id)).toBe(true);
		await updateForm(ws, actorId, created.id, { filingStatus: 'IN_PROGRESS' } as any);
		expect((await getForm(ws, created.id))?.filingStatus).toBe('IN_PROGRESS');
		await softDeleteForm(ws, actorId, created.id);
		expect((await listForms(ws)).length).toBe(0);
	});

	it('appointments: create → list → update → softDelete', async () => {
		const ws = workspaceId();
		const created = await createAppointment(ws, actorId, {
			title: 'Biometrics',
			type: 'BIOMETRICS',
			scheduledAt: new Date(Date.now() + 86_400_000),
			durationMin: 30,
			location: 'USCIS office',
			confirmationDetails: '',
			attendees: [],
			status: 'SCHEDULED',
			notes: ''
		} as any);

		expect((await listAppointments(ws)).some((a) => a.id === created.id)).toBe(true);
		await updateAppointment(ws, actorId, created.id, { status: 'CONFIRMED' } as any);
		await softDeleteAppointment(ws, actorId, created.id);
		expect((await listAppointments(ws)).length).toBe(0);
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
