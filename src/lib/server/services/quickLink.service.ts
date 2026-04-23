import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { QuickLinkCreate, QuickLinkUpdate } from '$lib/schemas/quickLink';

export async function listQuickLinks(workspaceId: string) {
	return db.quickLink.findMany({
		where: { workspaceId, deletedAt: null },
		orderBy: { order: 'asc' }
	});
}

export async function createQuickLink(workspaceId: string, actorId: string, input: QuickLinkCreate) {
	const last = await db.quickLink.findFirst({
		where: { workspaceId, deletedAt: null },
		orderBy: { order: 'desc' },
		select: { order: true }
	});
	const order = (last?.order ?? -1) + 1;
	const link = await db.quickLink.create({
		data: {
			workspaceId,
			url: input.url,
			title: input.title,
			description: input.description,
			notes: input.notes,
			order
		}
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

export async function updateQuickLink(workspaceId: string, actorId: string, id: string, input: QuickLinkUpdate) {
	const existing = await db.quickLink.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Quick link not found');
	const { id: _drop, ...patch } = input;
	const link = await db.quickLink.update({
		where: { id },
		data: patch
	});
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
	const existing = await db.quickLink.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Quick link not found');
	await db.quickLink.update({ where: { id }, data: { deletedAt: new Date() } });
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
