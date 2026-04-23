import type { FormFilingStatus } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import { encryptString, decryptString, maskReceiptNumber } from '$lib/server/crypto';
import type { FormCreate, FormUpdate } from '$lib/schemas/form';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';

export type FormSupportingItemRow = {
	id: string;
	formId: string;
	label: string;
	required: boolean;
	done: boolean;
	satisfiedByEvidenceId: string | null;
	satisfiedByFileId: string | null;
	order: number;
};

export type FormRow = {
	id: string;
	workspaceId: string;
	name: string;
	code: string;
	purpose?: string | null;
	filingStatus: FormFilingStatus;
	plannedFilingDate?: Date | string | null;
	actualFilingDate?: Date | string | null;
	receiptNumberEncrypted: string | null;
	notes?: string | null;
	lastUpdatedByUserId?: string | null;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
	supportingItems: FormSupportingItemRow[];
	// hydrated placeholders
	documents?: any[];
	tasks?: any[];
	questions?: any[];
	linkedNotes?: any[];
	_count: { tasks: number; documents: number };
};

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

export async function listForms(
	workspaceId: string,
	filter: { status?: FormFilingStatus; q?: string } = {}
): Promise<FormRow[]> {
	const rows = await ddbQuery<any>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'FormRecord#' }
	});
	const q = filter.q?.toLowerCase();
	const filtered = rows
		.filter((f) => !f.deletedAt)
		.filter((f) => (filter.status ? f.filingStatus === filter.status : true))
		.filter((f) =>
			q
				? String(f.name ?? '')
						.toLowerCase()
						.includes(q) ||
					String(f.code ?? '')
						.toLowerCase()
						.includes(q) ||
					String(f.purpose ?? '')
						.toLowerCase()
						.includes(q)
				: true
		)
		.map((f) => ({
			...f,
			supportingItems: (f.supportingItems ?? [])
				.slice()
				.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
			receiptNumberEncrypted: f.receiptNumberEncrypted ?? null,
			_count: { tasks: 0, documents: 0 }
		}));
	filtered.sort(
		(a, b) =>
			String(a.filingStatus).localeCompare(String(b.filingStatus)) ||
			String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))
	);
	return filtered;
}

export async function getForm(workspaceId: string, id: string) {
	const form = await ddbGet<FormRow>({ PK: wsPk(workspaceId), SK: entitySk('FormRecord', id) });
	if (!form || form.deletedAt) return null;
	return {
		...form,
		supportingItems: (form.supportingItems ?? [])
			.slice()
			.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
		receiptNumberEncrypted: form.receiptNumberEncrypted ?? null,
		documents: [],
		tasks: [],
		questions: [],
		linkedNotes: [],
		_count: { tasks: 0, documents: 0 }
	};
}

export async function createForm(workspaceId: string, actorId: string, input: FormCreate) {
	const { receiptNumber, ...rest } = input;
	const now = new Date().toISOString();
	const form = {
		id: randomUUID(),
		workspaceId,
		...rest,
		receiptNumberEncrypted: encodeReceipt(receiptNumber),
		lastUpdatedByUserId: actorId,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now,
		supportingItems: []
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('FormRecord', form.id), ...form });
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
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('FormRecord', id) });
	if (!existing) throw new Error('Form not found');
	if (existing.deletedAt) throw new Error('Form not found');
	const { receiptNumber, ...rest } = input;
	const data: Record<string, unknown> = {
		...rest,
		lastUpdatedByUserId: actorId,
		updatedAt: new Date().toISOString()
	};
	if (receiptNumber !== undefined) {
		data.receiptNumberEncrypted = encodeReceipt(receiptNumber);
	}
	const names: Record<string, string> = {};
	const values: Record<string, unknown> = {};
	const sets: string[] = [];
	for (const [k, v] of Object.entries(data)) {
		const nk = `#${k}`;
		const vk = `:${k}`;
		names[nk] = k;
		values[vk] = v;
		sets.push(`${nk} = ${vk}`);
	}
	const form = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('FormRecord', id) },
		`SET ${sets.join(', ')}`,
		values,
		names
	)) ?? { ...existing, ...data };
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
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('FormRecord', id) });
	if (!existing) throw new Error('Form not found');
	if (existing.deletedAt) throw new Error('Form not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('FormRecord', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
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
	const form = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('FormRecord', formId) });
	if (!form) throw new Error('Form not found');
	if (form.deletedAt) throw new Error('Form not found');
	const supportingItems = items.map((it, idx) => ({
		id: randomUUID(),
		formId,
		label: it.label,
		required: it.required,
		done: it.done,
		satisfiedByEvidenceId: it.satisfiedByEvidenceId,
		satisfiedByFileId: it.satisfiedByFileId,
		order: idx
	}));
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('FormRecord', formId) },
		'SET #supportingItems = :s, #updatedAt = :u',
		{ ':s': supportingItems, ':u': new Date().toISOString() },
		{ '#supportingItems': 'supportingItems', '#updatedAt': 'updatedAt' }
	);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'FORM_UPDATED',
		entityType: 'FormRecord',
		entityId: formId,
		summary: `Updated supporting items on ${form.code}`
	});
}
