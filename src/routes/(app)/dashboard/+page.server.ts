import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { dashboardFor } from '$lib/server/services/dashboard.service';
import { logActionError } from '$lib/server/services/actionError.service';
import {
	createQuickLink,
	updateQuickLink,
	softDeleteQuickLink
} from '$lib/server/services/quickLink.service';
import {
	createQuickLinkFolder,
	updateQuickLinkFolder,
	deleteQuickLinkFolder,
	moveLinkToFolder,
	reorderQuickLinks,
	reorderQuickLinkFolders
} from '$lib/server/services/quickLinkFolder.service';
import {
	quickLinkCreateSchema,
	quickLinkUpdateSchema,
	quickLinkDeleteSchema,
	quickLinkFolderCreateSchema,
	quickLinkFolderUpdateSchema,
	quickLinkFolderDeleteSchema,
	quickLinkMoveToFolderSchema,
	quickLinkReorderSchema,
	quickLinkFolderReorderSchema
} from '$lib/schemas/quickLink';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const data = await dashboardFor(workspace.id);
	return data;
};

export const actions: Actions = {
	create: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkCreateSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await createQuickLink(workspace.id, user.id, parsed.data);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to create quick link';
			const errorId = await logActionError(event, { message, status: 500 });
			return fail(500, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	update: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkUpdateSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await updateQuickLink(workspace.id, user.id, parsed.data.id, parsed.data);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to update quick link';
			const status = message === 'Quick link not found' ? 404 : 500;
			const errorId = await logActionError(event, { message, status });
			return fail(status, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	delete: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkDeleteSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await softDeleteQuickLink(workspace.id, user.id, parsed.data.id);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to delete quick link';
			const status = message === 'Quick link not found' ? 404 : 500;
			const errorId = await logActionError(event, { message, status });
			return fail(status, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	createFolder: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkFolderCreateSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			const folder = await createQuickLinkFolder(workspace.id, user.id, parsed.data.name);
			return { success: true, folder };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to create folder';
			const errorId = await logActionError(event, { message, status: 500 });
			return fail(500, { error: message, errorId });
		}
	},
	updateFolder: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkFolderUpdateSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await updateQuickLinkFolder(workspace.id, user.id, parsed.data.id, parsed.data.name);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to update folder';
			const status = message === 'Quick link folder not found' ? 404 : 500;
			const errorId = await logActionError(event, { message, status });
			return fail(status, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	deleteFolder: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkFolderDeleteSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await deleteQuickLinkFolder(workspace.id, user.id, parsed.data.id);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to delete folder';
			const status = message === 'Quick link folder not found' ? 404 : 500;
			const errorId = await logActionError(event, { message, status });
			return fail(status, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	moveToFolder: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkMoveToFolderSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await moveLinkToFolder(workspace.id, user.id, parsed.data.linkId, parsed.data.folderId ?? null);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to move link';
			const status = message === 'Quick link not found' ? 404 : 500;
			const errorId = await logActionError(event, { message, status });
			return fail(status, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	reorderLinks: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkReorderSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await reorderQuickLinks(workspace.id, user.id, parsed.data.linkIds);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to reorder links';
			const errorId = await logActionError(event, { message, status: 500 });
			return fail(500, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	},
	reorderFolders: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const raw = Object.fromEntries(await event.request.formData());
		const parsed = quickLinkFolderReorderSchema.safeParse(raw);
		if (!parsed.success) {
			const errorId = await logActionError(event, { message: parsed.error.message, status: 400 });
			return fail(400, { error: parsed.error.message, errorId });
		}
		try {
			await reorderQuickLinkFolders(workspace.id, user.id, parsed.data.folderIds);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to reorder folders';
			const errorId = await logActionError(event, { message, status: 500 });
			return fail(500, { error: message, errorId });
		}
		throw redirect(303, '/dashboard');
	}
};
