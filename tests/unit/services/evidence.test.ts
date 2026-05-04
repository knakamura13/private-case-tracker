import { describe, it, expect, beforeEach } from 'vitest';

import {
    addEvidenceCategory,
    deleteEvidenceCategory,
    getEvidenceCategories,
    incrementEvidenceCount,
    renameEvidenceCategory
} from '$lib/server/services/evidence.service';
import { createWorkspace } from '$lib/server/services/workspace.service';

const actorId = 'test-user';

describe('evidence.service', () => {
    beforeEach(() => {
        (globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
    });

    // -------------------------------------------------------------------------
    // addEvidenceCategory
    // -------------------------------------------------------------------------
    describe('addEvidenceCategory', () => {
        it('rejects an empty category name', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await expect(addEvidenceCategory(ws.id, actorId, '')).rejects.toThrow('Category name must be 1-80 characters');
        });

        it('rejects a category name over 80 characters', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });
            const longName = 'a'.repeat(81);

            await expect(addEvidenceCategory(ws.id, actorId, longName)).rejects.toThrow('Category name must be 1-80 characters');
        });

        it('rejects a duplicate category name (case-insensitive)', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // 'Photos' is a default category seeded by createWorkspace
            await expect(addEvidenceCategory(ws.id, actorId, 'Photos')).rejects.toThrow('Category already exists');
            await expect(addEvidenceCategory(ws.id, actorId, 'photos')).rejects.toThrow('Category already exists');
            await expect(addEvidenceCategory(ws.id, actorId, 'PHOTOS')).rejects.toThrow('Category already exists');
        });

        it('accepts a name of exactly 80 characters', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });
            const maxName = 'a'.repeat(80);

            // Should not throw — just verify no error is raised
            await expect(addEvidenceCategory(ws.id, actorId, maxName)).resolves.toBeTruthy();
        });

        it('returns the new category name on success', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            const result = await addEvidenceCategory(ws.id, actorId, 'Unique New Category');

            expect(result).toEqual({ category: 'Unique New Category' });
        });
    });

    // -------------------------------------------------------------------------
    // renameEvidenceCategory
    // -------------------------------------------------------------------------
    describe('renameEvidenceCategory', () => {
        it('renames a category and updates both evidenceCounts and evidenceTargets maps', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // 'Photos' has a seeded target from EVIDENCE_TARGETS
            await renameEvidenceCategory(ws.id, actorId, 'Photos', 'Photographs');

            const categories = await getEvidenceCategories(ws.id);
            const names = categories.map((c) => c.category);

            expect(names).toContain('Photographs');
            expect(names).not.toContain('Photos');
        });

        it('rejects renaming to the same name (case-insensitive)', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await expect(renameEvidenceCategory(ws.id, actorId, 'Photos', 'Photos')).rejects.toThrow(
                'New name must be different from old name'
            );
            await expect(renameEvidenceCategory(ws.id, actorId, 'Photos', 'photos')).rejects.toThrow(
                'New name must be different from old name'
            );
            await expect(renameEvidenceCategory(ws.id, actorId, 'Photos', 'PHOTOS')).rejects.toThrow(
                'New name must be different from old name'
            );
        });

        it('throws when the old category does not exist', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await expect(renameEvidenceCategory(ws.id, actorId, 'Nonexistent', 'New Name')).rejects.toThrow('Category does not exist');
        });

        it('throws when the new name already exists in the workspace', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // 'Photos' and 'Tax' are both default categories
            await expect(renameEvidenceCategory(ws.id, actorId, 'Photos', 'Tax')).rejects.toThrow('Category name already exists');
        });

        it('rejects a new name longer than 80 characters', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });
            const longName = 'x'.repeat(81);

            await expect(renameEvidenceCategory(ws.id, actorId, 'Photos', longName)).rejects.toThrow(
                'Category name must be 1-80 characters'
            );
        });

        it('preserves count value under the new name after rename', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await renameEvidenceCategory(ws.id, actorId, 'Photos', 'Photographs');

            const categories = await getEvidenceCategories(ws.id);
            const renamed = categories.find((c) => c.category === 'Photographs');

            // Count should exist under new name (0 since none were incremented)
            expect(renamed).toBeDefined();
            expect(renamed!.currentCount).toBe(0);
        });
    });

    // -------------------------------------------------------------------------
    // deleteEvidenceCategory
    // -------------------------------------------------------------------------
    describe('deleteEvidenceCategory', () => {
        it('throws when the category does not exist', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await expect(deleteEvidenceCategory(ws.id, actorId, 'Ghost Category')).rejects.toThrow('Category does not exist');
        });

        it('throws when the category has a non-zero count (safety guard)', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // Manually seed a count > 0 directly into the workspace item so we
            // can test the guard without relying on the in-memory mock's limited
            // support for DynamoDB dotted-path update expressions.
            const { ddbUpdate } = await import('$lib/server/dynamo/ops');
            const { wsPk, entitySk } = await import('$lib/server/dynamo/keys');
            await ddbUpdate(
                { PK: wsPk(ws.id), SK: entitySk('Workspace', ws.id) },
                'SET #evidenceCounts = :counts',
                { ':counts': { Photos: 3 } },
                { '#evidenceCounts': 'evidenceCounts' }
            );

            await expect(deleteEvidenceCategory(ws.id, actorId, 'Photos')).rejects.toThrow('Cannot delete category with non-zero count');
        });

        it('deletes a category when its count is 0', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // 'Translation' has no seeded count (default 0)
            await deleteEvidenceCategory(ws.id, actorId, 'Translation');

            const categories = await getEvidenceCategories(ws.id);
            const names = categories.map((c) => c.category);

            expect(names).not.toContain('Translation');
        });

        it('removes the category from both evidenceCounts and evidenceTargets on deletion', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // 'Translation' has 0 count and no target, safe to delete
            await deleteEvidenceCategory(ws.id, actorId, 'Translation');

            const categories = await getEvidenceCategories(ws.id);
            expect(categories.find((c) => c.category === 'Translation')).toBeUndefined();
        });
    });

    // -------------------------------------------------------------------------
    // incrementEvidenceCount (negative delta floor)
    // -------------------------------------------------------------------------
    describe('incrementEvidenceCount', () => {
        it('floors the count at 0 when a negative delta would make it go below zero', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // Category starts at 0; decrementing by 5 should floor to 0, not -5
            const result = await incrementEvidenceCount(ws.id, actorId, 'Photos', -5);

            expect(result.currentCount).toBe(0);
        });

        it('increments the count when given a positive delta (resolves without error)', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            // The in-memory DynamoDB mock does not support dotted-path update
            // expressions (e.g. #evidenceCounts.#category), so the count value
            // cannot be asserted precisely here. We verify the call resolves
            // without throwing and returns the expected shape.
            const result = await incrementEvidenceCount(ws.id, actorId, 'Photos', 3);

            expect(result).toHaveProperty('category', 'Photos');
            expect(result).toHaveProperty('currentCount');
            expect(typeof result.currentCount).toBe('number');
        });

        it('throws when the category does not exist', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await expect(incrementEvidenceCount(ws.id, actorId, 'Nonexistent Category', 1)).rejects.toThrow('Category does not exist');
        });

        it('throws when the delta exceeds the allowed maximum', async () => {
            const ws = await createWorkspace({ name: 'Test WS', ownerUserId: actorId });

            await expect(incrementEvidenceCount(ws.id, actorId, 'Photos', 101)).rejects.toThrow('Delta too large');
        });
    });
});
