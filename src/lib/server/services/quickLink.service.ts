import { logActivity } from '$lib/server/activity';
import type { QuickLinkCreate, QuickLinkUpdate } from '$lib/schemas/quickLink';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { QuickLinkItem } from '$lib/server/dynamo/types';

/* eslint-disable security/detect-object-injection */

export async function listQuickLinks(workspaceId: string, limit?: number, folderId?: string | null) {
	const rows = await ddbQuery<QuickLinkItem>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'QuickLink#' },
		Limit: limit ?? 1000
	});

	let filtered = rows.filter((r) => !r.deletedAt);

	if (folderId !== undefined) {
		filtered = filtered.filter((r) => r.folderId === folderId);
	}

	return filtered.sort((a, b) => a.order - b.order);
}

export async function createQuickLink(
	workspaceId: string,
	actorId: string,
	input: QuickLinkCreate
) {
	const existing = await listQuickLinks(workspaceId);
	const order = (existing.at(-1)?.order ?? -1) + 1;
	const now = new Date().toISOString();
	const link = {
		id: randomUUID(),
		workspaceId,
		url: input.url,
		title: input.title ?? null,
		description: input.description ?? null,
		notes: input.notes ?? null,
		order,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({
		PK: wsPk(workspaceId),
		SK: entitySk('QuickLink', link.id),
		...link
	});
	const label = link.title ?? new URL(link.url).hostname;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'QUICK_LINK_CREATED',
		entityType: 'QuickLink',
		entityId: link.id,
		summary: `Quick link "${label}" added`
	});
	return link;
}

export async function updateQuickLink(
	workspaceId: string,
	actorId: string,
	id: string,
	input: QuickLinkUpdate
) {
	const existing = await ddbGet<QuickLinkItem>({ PK: wsPk(workspaceId), SK: entitySk('QuickLink', id) });
	if (!existing) throw new Error('Quick link not found');
	if (existing.deletedAt) throw new Error('Quick link not found');
	const patch: Partial<typeof existing> = {};
	if (input.url !== undefined) patch.url = input.url;
	if (input.title !== undefined) patch.title = input.title ?? null;
	if (input.description !== undefined) patch.description = input.description ?? null;
	if (input.notes !== undefined) patch.notes = input.notes ?? null;
	patch.updatedAt = new Date().toISOString();

	const exprParts: string[] = [];
	const values: Record<string, unknown> = {};
	const names: Record<string, string> = {};
	for (const [k, v] of Object.entries(patch)) {
		const nk = `#${k}`;
		const vk = `:${k}`;
		names[nk] = k;
		values[vk] = v;
		exprParts.push(`${nk} = ${vk}`);
	}
	const updated =
		exprParts.length === 0
			? existing
			: ((await ddbUpdate<typeof existing>(
					{ PK: wsPk(workspaceId), SK: entitySk('QuickLink', id) },
					`SET ${exprParts.join(', ')}`,
					values,
					names
				)) ?? existing);
	const link = updated;
	const label = link.title ?? safeHostname(link.url);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'QUICK_LINK_UPDATED',
		entityType: 'QuickLink',
		entityId: link.id,
		summary: `Quick link "${label}" updated`
	});
	return link;
}

export async function softDeleteQuickLink(workspaceId: string, actorId: string, id: string) {
	const existing = await ddbGet<QuickLinkItem>({
		PK: wsPk(workspaceId),
		SK: entitySk('QuickLink', id)
	});
	if (!existing) throw new Error('Quick link not found');
	if (existing.deletedAt) throw new Error('Quick link not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('QuickLink', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
	const label = existing.title ?? safeHostname(existing.url);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'QUICK_LINK_DELETED',
		entityType: 'QuickLink',
		entityId: id,
		summary: `Quick link "${label}" removed`
	});
}

function safeHostname(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return url.slice(0, 80);
	}
}

/* eslint-enable security/detect-object-injection */
