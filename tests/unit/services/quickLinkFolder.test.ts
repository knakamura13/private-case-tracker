import { describe, it, expect, beforeEach } from 'vitest';

import {
    createQuickLinkFolder,
    deleteQuickLinkFolder,
    listQuickLinkFolders,
    moveLinkToFolder,
    reorderQuickLinks,
    reorderQuickLinkFolders
} from '$lib/server/services/quickLinkFolder.service';
import { createQuickLink, listQuickLinks } from '$lib/server/services/quickLink.service';
import { ddbGet } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';

const actorId = 'test-user';

function workspaceId() {
    return `ws_${Math.random().toString(36).slice(2, 10)}`;
}

describe('quickLinkFolder.service', () => {
    beforeEach(() => {
        (globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
    });

    // -------------------------------------------------------------------------
    // createQuickLinkFolder
    // -------------------------------------------------------------------------
    describe('createQuickLinkFolder', () => {
        it('creates a folder successfully', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId, 'Government Sites');

            expect(folder.id).toBeTruthy();
            expect(folder.name).toBe('Government Sites');
            expect(folder.workspaceId).toBe(ws);
            expect(folder.deletedAt).toBeNull();
        });

        it('creates a folder with a null name when none is supplied', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId);

            expect(folder.name).toBeNull();
        });

        it('assigns incrementing order values to successive folders', async () => {
            const ws = workspaceId();

            const f1 = await createQuickLinkFolder(ws, actorId, 'First');
            const f2 = await createQuickLinkFolder(ws, actorId, 'Second');
            const f3 = await createQuickLinkFolder(ws, actorId, 'Third');

            expect(f1.order).toBe(0);
            expect(f2.order).toBe(1);
            expect(f3.order).toBe(2);
        });

        it('stores the folder so listQuickLinkFolders can retrieve it', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId, 'Stored Folder');
            const all = await listQuickLinkFolders(ws);

            expect(all.some((f) => f.id === folder.id)).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // deleteQuickLinkFolder
    // -------------------------------------------------------------------------
    describe('deleteQuickLinkFolder', () => {
        it('soft-deletes the folder so it no longer appears in listQuickLinkFolders', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId, 'To Delete');
            await deleteQuickLinkFolder(ws, actorId, folder.id);

            const all = await listQuickLinkFolders(ws);
            expect(all.some((f) => f.id === folder.id)).toBe(false);
        });

        it('un-groups all child links before soft-deleting the folder', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId, 'Folder with Links');

            // Create two links assigned to this folder
            const link1 = await createQuickLink(ws, actorId, {
                url: 'https://example.com',
                title: 'Example',
                description: null,
                notes: null,
                folderId: folder.id
            } as Parameters<typeof createQuickLink>[2]);

            const link2 = await createQuickLink(ws, actorId, {
                url: 'https://example.org',
                title: 'Example Org',
                description: null,
                notes: null,
                folderId: folder.id
            } as Parameters<typeof createQuickLink>[2]);

            await deleteQuickLinkFolder(ws, actorId, folder.id);

            // Both links should now have folderId === null
            const allLinks = await listQuickLinks(ws);
            const updated1 = allLinks.find((l) => l.id === link1.id)!;
            const updated2 = allLinks.find((l) => l.id === link2.id)!;

            expect(updated1.folderId).toBeNull();
            expect(updated2.folderId).toBeNull();
        });

        it('does not affect links that belong to a different folder', async () => {
            const ws = workspaceId();

            const folderA = await createQuickLinkFolder(ws, actorId, 'Folder A');
            const folderB = await createQuickLinkFolder(ws, actorId, 'Folder B');

            const linkInB = await createQuickLink(ws, actorId, {
                url: 'https://infolderb.com',
                title: 'In Folder B',
                description: null,
                notes: null,
                folderId: folderB.id
            } as Parameters<typeof createQuickLink>[2]);

            // Delete only folder A
            await deleteQuickLinkFolder(ws, actorId, folderA.id);

            const allLinks = await listQuickLinks(ws);
            const untouched = allLinks.find((l) => l.id === linkInB.id)!;

            expect(untouched.folderId).toBe(folderB.id);
        });

        it('throws when the folder does not exist', async () => {
            const ws = workspaceId();

            await expect(deleteQuickLinkFolder(ws, actorId, 'nonexistent-id')).rejects.toThrow('Quick link folder not found');
        });
    });

    // -------------------------------------------------------------------------
    // moveLinkToFolder
    // -------------------------------------------------------------------------
    describe('moveLinkToFolder', () => {
        it('moves a link to a valid folder', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId, 'Target Folder');
            const link = await createQuickLink(ws, actorId, {
                url: 'https://moveme.com',
                title: 'Move Me',
                description: null,
                notes: null
            } as Parameters<typeof createQuickLink>[2]);

            await moveLinkToFolder(ws, actorId, link.id, folder.id);

            const allLinks = await listQuickLinks(ws);
            const moved = allLinks.find((l) => l.id === link.id)!;

            expect(moved.folderId).toBe(folder.id);
        });

        it('moves a link back to root (null folderId)', async () => {
            const ws = workspaceId();

            const folder = await createQuickLinkFolder(ws, actorId, 'Origin Folder');
            const link = await createQuickLink(ws, actorId, {
                url: 'https://moveback.com',
                title: 'Move Back',
                description: null,
                notes: null,
                folderId: folder.id
            } as Parameters<typeof createQuickLink>[2]);

            await moveLinkToFolder(ws, actorId, link.id, null);

            const allLinks = await listQuickLinks(ws);
            const movedBack = allLinks.find((l) => l.id === link.id)!;

            expect(movedBack.folderId).toBeNull();
        });

        it('throws when the link does not exist', async () => {
            const ws = workspaceId();
            const folder = await createQuickLinkFolder(ws, actorId, 'Some Folder');

            await expect(moveLinkToFolder(ws, actorId, 'nonexistent-link-id', folder.id)).rejects.toThrow('Quick link not found');
        });

        it('throws when the target folder does not exist', async () => {
            const ws = workspaceId();
            const link = await createQuickLink(ws, actorId, {
                url: 'https://moveme.com',
                title: 'Move Me',
                description: null
            });

            await expect(moveLinkToFolder(ws, actorId, link.id, 'missing-folder')).rejects.toThrow('Quick link folder not found');
        });
    });

    describe('createQuickLink', () => {
        it('throws when a requested folder does not exist', async () => {
            const ws = workspaceId();

            await expect(
                createQuickLink(ws, actorId, {
                    url: 'https://example.com',
                    title: 'Example',
                    description: null,
                    folderId: 'missing-folder'
                })
            ).rejects.toThrow('Quick link folder not found');
        });
    });

    describe('reorderQuickLinks', () => {
        it('rejects missing link ids instead of creating sparse records', async () => {
            const ws = workspaceId();
            const link = await createQuickLink(ws, actorId, {
                url: 'https://example.com',
                title: 'Example',
                description: null
            });

            await expect(reorderQuickLinks(ws, actorId, [link.id, 'missing-link'])).rejects.toThrow('Quick link not found');

            await expect(ddbGet({ PK: wsPk(ws), SK: entitySk('QuickLink', 'missing-link') })).resolves.toBeUndefined();
        });
    });

    // -------------------------------------------------------------------------
    // reorderQuickLinkFolders
    // -------------------------------------------------------------------------
    describe('reorderQuickLinkFolders', () => {
        it('reorders folders correctly', async () => {
            const ws = workspaceId();

            const f1 = await createQuickLinkFolder(ws, actorId, 'Alpha');
            const f2 = await createQuickLinkFolder(ws, actorId, 'Beta');
            const f3 = await createQuickLinkFolder(ws, actorId, 'Gamma');

            // Reverse the order
            await reorderQuickLinkFolders(ws, actorId, [f3.id, f2.id, f1.id]);

            const folders = await listQuickLinkFolders(ws);
            const byId = Object.fromEntries(folders.map((f) => [f.id, f]));

            expect(byId[f3.id]!.order).toBe(0);
            expect(byId[f2.id]!.order).toBe(1);
            expect(byId[f1.id]!.order).toBe(2);
        });

        it('returns without throwing when given an empty array (no-op)', async () => {
            const ws = workspaceId();

            await createQuickLinkFolder(ws, actorId, 'Should survive');

            await expect(reorderQuickLinkFolders(ws, actorId, [])).resolves.not.toThrow();
        });

        it('preserves folder count after reordering', async () => {
            const ws = workspaceId();

            const f1 = await createQuickLinkFolder(ws, actorId, 'One');
            const f2 = await createQuickLinkFolder(ws, actorId, 'Two');

            await reorderQuickLinkFolders(ws, actorId, [f2.id, f1.id]);

            const folders = await listQuickLinkFolders(ws);
            expect(folders).toHaveLength(2);
        });

        it('rejects missing folder ids instead of creating sparse records', async () => {
            const ws = workspaceId();
            const folder = await createQuickLinkFolder(ws, actorId, 'One');

            await expect(reorderQuickLinkFolders(ws, actorId, [folder.id, 'missing-folder'])).rejects.toThrow('Quick link folder not found');

            await expect(ddbGet({ PK: wsPk(ws), SK: entitySk('QuickLinkFolder', 'missing-folder') })).resolves.toBeUndefined();
        });
    });
});
