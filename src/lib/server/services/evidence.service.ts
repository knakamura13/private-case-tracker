import { logActivity } from '$lib/server/activity';
import type { EvidenceCreate, EvidenceUpdate } from '$lib/schemas/evidence';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { EvidenceItem } from '$lib/server/dynamo/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function listEvidence(
	workspaceId: string,
	filter: { q?: string; limit?: number } = {}
) {
	const rows = await ddbQuery<EvidenceItem>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'EvidenceItem#' },
		Limit: filter.limit ?? 1000
	});
	const q = filter.q?.toLowerCase();
	const filtered = rows
		.filter((e) => !e.deletedAt)
		.filter((e) => (q ? String(e.category ?? '').toLowerCase().includes(q) : true));
	filtered.sort((a, b) => String(a.category ?? '').localeCompare(String(b.category ?? '')));
	return filtered;
}

export async function getEvidence(workspaceId: string, id: string) {
	const evidence = await ddbGet<EvidenceItem>({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) });
	if (!evidence) return null;
	if (evidence.deletedAt) return null;
	return evidence;
}

export async function createEvidence(workspaceId: string, actorId: string, input: EvidenceCreate) {
	// Validate category
	if (!EVIDENCE_CATEGORIES.includes(input.category as any)) {
		throw new Error('Invalid evidence category');
	}

	// Enforce single item per category
	const existing = await listEvidence(workspaceId);
	if (existing.some((e) => e.category === input.category)) {
		throw new Error('Evidence category already exists');
	}

	const now = new Date().toISOString();
	const evidence = {
		id: randomUUID(),
		workspaceId,
		...input,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', evidence.id), ...evidence });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_CREATED',
		entityType: 'EvidenceItem',
		entityId: evidence.id,
		summary: `Evidence category "${evidence.category}" added`
	});
	return evidence;
}

export async function incrementEvidenceCount(workspaceId: string, actorId: string, category: string, delta: number) {
	const items = await listEvidence(workspaceId);
	const item = items.find((i) => i.category === category);

	if (!item) {
		// Create new category item with initial count
		const target = EVIDENCE_CATEGORIES.includes(category as any)
			? (EVIDENCE_TARGETS as Record<string, number>)[category]
			: 0;
		try {
			return await createEvidence(workspaceId, actorId, {
				category,
				targetCount: target ?? 0,
				currentCount: Math.max(0, delta)
			});
		} catch (e) {
			// If creation failed due to category already existing (race condition),
			// retry by fetching the item again and updating it
			if (e instanceof Error && e.message === 'Evidence category already exists') {
				const retryItems = await listEvidence(workspaceId);
				const retryItem = retryItems.find((i) => i.category === category);
				if (retryItem) {
					// Atomic increment/decrement using DynamoDB ADD operation
					const evidence = await ddbUpdate<any>(
						{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', retryItem.id) },
						'SET #currentCount = #currentCount + :delta, #updatedAt = :u',
						{ ':delta': delta, ':u': new Date().toISOString() },
						{ '#currentCount': 'currentCount', '#updatedAt': 'updatedAt' }
					);

					// Fix negative count if needed
					if (evidence && evidence.currentCount < 0) {
						const fixed = await ddbUpdate<any>(
							{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', retryItem.id) },
							'SET #currentCount = :zero, #updatedAt = :u',
							{ ':zero': 0, ':u': new Date().toISOString() },
							{ '#currentCount': 'currentCount', '#updatedAt': 'updatedAt' }
						);
						await logActivity({
							workspaceId,
							userId: actorId,
							action: 'EVIDENCE_UPDATED',
							entityType: 'EvidenceItem',
							entityId: retryItem.id,
							summary: `Evidence category "${category}" count adjusted to 0 (corrected from negative)`
						});
						return fixed;
					}

					await logActivity({
						workspaceId,
						userId: actorId,
						action: 'EVIDENCE_UPDATED',
						entityType: 'EvidenceItem',
						entityId: retryItem.id,
						summary: `Evidence category "${category}" count adjusted to ${evidence?.currentCount ?? 0}`
					});
					return evidence;
				}
			}
			throw e;
		}
	}

	// Atomic increment/decrement using DynamoDB ADD operation
	// Use conditional update to prevent going below zero
	const newCount = Math.max(0, item.currentCount + delta);
	const evidence = await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', item.id) },
		'SET #currentCount = #currentCount + :delta, #updatedAt = :u',
		{ ':delta': delta, ':u': new Date().toISOString() },
		{ '#currentCount': 'currentCount', '#updatedAt': 'updatedAt' }
	);

	// If the update resulted in a negative count, fix it
	// This can happen if concurrent decrements pushed it below zero
	if (evidence && evidence.currentCount < 0) {
		const fixed = await ddbUpdate<any>(
			{ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', item.id) },
			'SET #currentCount = :zero, #updatedAt = :u',
			{ ':zero': 0, ':u': new Date().toISOString() },
			{ '#currentCount': 'currentCount', '#updatedAt': 'updatedAt' }
		);
		await logActivity({
			workspaceId,
			userId: actorId,
			action: 'EVIDENCE_UPDATED',
			entityType: 'EvidenceItem',
			entityId: item.id,
			summary: `Evidence category "${category}" count adjusted to 0 (corrected from negative)`
		});
		return fixed;
	}

	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_UPDATED',
		entityType: 'EvidenceItem',
		entityId: item.id,
		summary: `Evidence category "${category}" count adjusted to ${evidence?.currentCount ?? newCount}`
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
	if (existing.deletedAt) throw new Error('Evidence has been deleted');
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
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'EVIDENCE_UPDATED',
		entityType: 'EvidenceItem',
		entityId: evidence.id,
		summary: `Evidence category "${evidence.category}" updated`
	});
	return evidence;
}

export async function softDeleteEvidence(workspaceId: string, actorId: string, id: string) {
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('EvidenceItem', id) });
	if (!existing) throw new Error('Evidence not found');
	if (existing.deletedAt) throw new Error('Evidence has already been deleted');
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
		summary: `Evidence category "${existing.category}" deleted`
	});
}

/* eslint-enable @typescript-eslint/no-explicit-any */
