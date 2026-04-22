import type { FormFilingStatus, Prisma } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import { encryptString, decryptString, maskReceiptNumber } from '$lib/server/crypto';
import type { FormCreate, FormUpdate } from '$lib/schemas/form';

function encodeReceipt(raw: string | null | undefined): string | null {
	if (!raw) return null;
	return encryptString(raw.trim());
}

export function revealReceipt(encrypted: string | null): string | null {
	if (!encrypted) return null;
	try {
		return decryptString(encrypted);
	} catch {
		return null;
	}
}

export function maskReceipt(encrypted: string | null): string | null {
	const raw = revealReceipt(encrypted);
	return raw ? maskReceiptNumber(raw) : null;
}

export async function listForms(workspaceId: string, filter: { status?: FormFilingStatus; q?: string } = {}) {
	const where: Prisma.FormRecordWhereInput = { workspaceId, deletedAt: null };
	if (filter.status) where.filingStatus = filter.status;
	if (filter.q) {
		where.OR = [
			{ name: { contains: filter.q, mode: 'insensitive' } },
			{ code: { contains: filter.q, mode: 'insensitive' } },
			{ purpose: { contains: filter.q, mode: 'insensitive' } }
		];
	}
	return db.formRecord.findMany({
		where,
		include: {
			supportingItems: { orderBy: { order: 'asc' } },
			_count: { select: { tasks: true, documents: true } }
		},
		orderBy: [{ filingStatus: 'asc' }, { updatedAt: 'desc' }]
	});
}

export async function getForm(workspaceId: string, id: string) {
	return db.formRecord.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			supportingItems: {
				include: { evidence: true, file: true },
				orderBy: { order: 'asc' }
			},
			documents: { where: { deletedAt: null } },
			tasks: { where: { deletedAt: null } },
			questions: { where: { deletedAt: null } },
			linkedNotes: { where: { deletedAt: null } }
		}
	});
}

export async function createForm(workspaceId: string, actorId: string, input: FormCreate) {
	const { receiptNumber, ...rest } = input;
	const form = await db.formRecord.create({
		data: {
			workspaceId,
			...rest,
			receiptNumberEncrypted: encodeReceipt(receiptNumber),
			lastUpdatedByUserId: actorId
		}
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FORM_CREATED',
		entityType: 'FormRecord',
		entityId: form.id,
		summary: `Form ${form.code} "${form.name}" created`
	});
	return form;
}

export async function updateForm(
	workspaceId: string,
	actorId: string,
	id: string,
	input: FormUpdate
) {
	const existing = await db.formRecord.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Form not found');
	const { receiptNumber, ...rest } = input;
	const data: Prisma.FormRecordUpdateInput = { ...rest, lastUpdatedByUserId: actorId };
	if (receiptNumber !== undefined) {
		data.receiptNumberEncrypted = encodeReceipt(receiptNumber);
	}
	const form = await db.formRecord.update({ where: { id }, data });
	const statusChanged = input.filingStatus && input.filingStatus !== existing.filingStatus;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'FORM_UPDATED',
		entityType: 'FormRecord',
		entityId: form.id,
		summary: statusChanged
			? `Form ${form.code} moved to ${form.filingStatus}`
			: `Form ${form.code} updated`
	});
	return form;
}

export async function softDeleteForm(workspaceId: string, actorId: string, id: string) {
	const existing = await db.formRecord.findFirst({ where: { id, workspaceId, deletedAt: null } });
	if (!existing) throw new Error('Form not found');
	await db.formRecord.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FORM_DELETED',
		entityType: 'FormRecord',
		entityId: id,
		summary: `Form ${existing.code} deleted`
	});
}

export async function replaceSupportingItems(
	workspaceId: string,
	actorId: string,
	formId: string,
	items: Array<{
		label: string;
		required: boolean;
		done: boolean;
		satisfiedByEvidenceId: string | null;
		satisfiedByFileId: string | null;
	}>
) {
	const form = await db.formRecord.findFirst({ where: { id: formId, workspaceId, deletedAt: null } });
	if (!form) throw new Error('Form not found');
	await db.$transaction(async (tx) => {
		await tx.formSupportingItem.deleteMany({ where: { formId } });
		if (items.length) {
			await tx.formSupportingItem.createMany({
				data: items.map((it, idx) => ({
					formId,
					label: it.label,
					required: it.required,
					done: it.done,
					satisfiedByEvidenceId: it.satisfiedByEvidenceId,
					satisfiedByFileId: it.satisfiedByFileId,
					order: idx
				}))
			});
		}
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FORM_UPDATED',
		entityType: 'FormRecord',
		entityId: formId,
		summary: `Updated supporting items on ${form.code}`
	});
}
