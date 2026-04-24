import type { EvidenceStatus } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import type { EvidenceCreate, EvidenceUpdate } from '$lib/schemas/evidence';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { EvidenceItem } from '$lib/server/dynamo/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function listEvidence(
	workspaceId: string,
	filter: { status?: EvidenceStatus; type?: string; q?: string; limit?: number } = {}
) {
	const rows = await ddbQuery<EvidenceItem>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'EvidenceItem#' },
		Limit: filter.limit ?? 1000
	});
	const q = filter.q?.toLowerCase();
	const filtered = rows
		.filter((e) => !e.deletedAt)
		.filter((e) => (filter.status ? (e.status as EvidenceStatus) === filter.status : true))
		.filter((e) => (filter.type ? e.type === filter.type : true))
		.filter((e) =>
			q
				? String(e.title ?? '')
						.toLowerCase()
						.includes(q) ||
					String(e.description ?? '')
						.toLowerCase()
						.includes(q) ||
					String(e.significance ?? '')
						.toLowerCase()
						.includes(q)
				: true
		)
		.map((e) => ({
			...e,
			files: (e.files ?? []).map((f: any) => ({ ...f, file: f.file ?? null })),
			_count: { tasks: 0 }
		}));
	filtered.sort(
		(a, b) =>
			String(a.type ?? '').localeCompare(String(b.type ?? '')) ||
			String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))
	);
	return filtered;
}

export async function getEvidence(workspaceId: string, id: string) {
	const evidence = await ddbGet<EvidenceItem>({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) });
	if (!evidence || evidence.deletedAt) return null;
	return {
		...evidence,
		files: (evidence.files ?? []).map((f: any) => ({ ...f, file: f.file ?? null })),
		tasks: [],
		supportingFor: [],
		linkedNotes: []
	};
}

export async function createEvidence(workspaceId: string, actorId: string, input: EvidenceCreate) {
	const now = new Date().toISOString();
	const evidence = {
		id: randomUUID(),
		workspaceId,
		...input,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now,
		files: []
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', evidence.id), ...evidence });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_CREATED',
		entityType: 'EvidenceItem',
		entityId: evidence.id,
		summary: `Evidence "${evidence.title}" added`
	});
	return evidence;
}

export async function updateEvidence(
	workspaceId: string,
	actorId: string,
	id: string,
	input: EvidenceUpdate
) {
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) });
	if (!existing) throw new Error('Evidence not found');
	if (existing.deletedAt) throw new Error('Evidence not found');
	const patch: Record<string, unknown> = { ...input, updatedAt: new Date().toISOString() };
	const names: Record<string, string> = {};
	const values: Record<string, unknown> = {};
	const sets: string[] = [];
	for (const [k, v] of Object.entries(patch)) {
		const nk = `#${k}`;
		const vk = `:${k}`;
		names[nk] = k;
		values[vk] = v;
		sets.push(`${nk} = ${vk}`);
	}
	const evidence = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) },
		`SET ${sets.join(', ')}`,
		values,
		names
	)) ?? { ...existing, ...patch };
	const statusChanged = input.status && input.status !== existing.status;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'EVIDENCE_UPDATED',
		entityType: 'EvidenceItem',
		entityId: evidence.id,
		summary: statusChanged
			? `Evidence "${evidence.title}" marked ${evidence.status}`
			: `Evidence "${evidence.title}" updated`
	});
	return evidence;
}

export async function softDeleteEvidence(workspaceId: string, actorId: string, id: string) {
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) });
	if (!existing) throw new Error('Evidence not found');
	if (existing.deletedAt) throw new Error('Evidence not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_DELETED',
		entityType: 'EvidenceItem',
		entityId: id,
		summary: `Evidence "${existing.title}" deleted`
	});
}

export async function linkFile(workspaceId: string, evidenceId: string, fileId: string) {
	const evidence = await ddbGet<any>({
		PK: wsPk(workspaceId),
		SK: entitySk('EvidenceItem', evidenceId)
	});
	if (!evidence) throw new Error('Evidence not found');
	if (evidence.deletedAt) throw new Error('Evidence not found');
	const files = Array.isArray(evidence.files) ? evidence.files : [];
	if (!files.some((f: any) => f.fileId === fileId)) {
		files.push({ evidenceId, fileId });
		await ddbUpdate(
			{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', evidenceId) },
			'SET #files = :f, #updatedAt = :u',
			{ ':f': files, ':u': new Date().toISOString() },
			{ '#files': 'files', '#updatedAt': 'updatedAt' }
		);
	}
}

export function summarizeCoverage(items: { type: string; status: string }[]) {
	const byType = new Map<string, { total: number; ready: number }>();
	for (const it of items) {
		const b = byType.get(it.type) ?? { total: 0, ready: 0 };
		b.total += 1;
		if (it.status === 'READY') b.ready += 1;
		byType.set(it.type, b);
	}
	return byType;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
