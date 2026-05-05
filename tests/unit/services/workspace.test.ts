import { beforeEach, describe, expect, it } from 'vitest';

import { baPk, entitySk, gsi1Sk, gsi1UserPk, wsPk } from '$lib/server/dynamo/keys';
import { ddbGet, ddbPut, ddbQueryAll } from '$lib/server/dynamo/ops';
import type { BetterAuthSessionItem, MembershipItem } from '$lib/server/dynamo/types';
import { createInvitation } from '$lib/server/services/invitation.service';
import { createWorkspace, deleteWorkspace, removeMember } from '$lib/server/services/workspace.service';

function resetMem() {
    (globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
}

async function seedSession(userId: string, index: number) {
    const now = new Date().toISOString();
    await ddbPut({
        PK: baPk('session'),
        SK: `session-${userId}-${index}`,
        id: `session-${userId}-${index}`,
        userId,
        token: `token-${userId}-${index}`,
        expiresAt: now,
        ipAddress: null,
        userAgent: null,
        createdAt: now,
        updatedAt: now
    });
}

describe('workspace.service', () => {
    beforeEach(resetMem);

    it('does not create a second first workspace when the singleton marker already exists', async () => {
        await createWorkspace({ name: 'First', ownerUserId: 'owner-1' });

        await expect(createWorkspace({ name: 'Second', ownerUserId: 'owner-2' })).rejects.toThrow('ConditionalCheckFailed');

        const workspaceMarkers = await ddbQueryAll({ KeyConditionExpression: 'PK = :pk', ExpressionAttributeValues: { ':pk': 'WS_INDEX' } });
        expect(workspaceMarkers).toHaveLength(1);
    });

    it('revokes every session when removing a member with more than one DynamoDB page of sessions', async () => {
        const workspace = await createWorkspace({ name: 'Team', ownerUserId: 'owner-user' });
        const now = new Date().toISOString();
        await ddbPut({
            PK: wsPk(workspace.id),
            SK: entitySk('Membership', 'member-user'),
            id: 'member-record',
            workspaceId: workspace.id,
            userId: 'member-user',
            role: 'COLLABORATOR',
            acceptedAt: now,
            createdAt: now,
            updatedAt: now,
            GSI1PK: gsi1UserPk('member-user'),
            GSI1SK: gsi1Sk('Membership', workspace.id),
            workspaceName: workspace.name
        } satisfies MembershipItem);

        for (let i = 0; i < 501; i += 1) {
            await seedSession('member-user', i);
        }

        await removeMember(workspace.id, 'member-user');

        const sessions = await ddbQueryAll<BetterAuthSessionItem>({
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': baPk('session') },
            Limit: 100
        });
        expect(sessions.filter((s) => s.userId === 'member-user')).toHaveLength(0);
    });

    it('hard-purges workspace data, workspace index entries, memberships, invitations, and member sessions', async () => {
        const workspace = await createWorkspace({ name: 'Team', ownerUserId: 'owner-user' });
        const now = new Date().toISOString();
        await ddbPut({
            PK: wsPk(workspace.id),
            SK: entitySk('Membership', 'member-user'),
            id: 'member-record',
            workspaceId: workspace.id,
            userId: 'member-user',
            role: 'COLLABORATOR',
            acceptedAt: now,
            createdAt: now,
            updatedAt: now,
            GSI1PK: gsi1UserPk('member-user'),
            GSI1SK: gsi1Sk('Membership', workspace.id),
            workspaceName: workspace.name
        } satisfies MembershipItem);
        await createInvitation({
            workspaceId: workspace.id,
            email: 'pending@example.com',
            role: 'COLLABORATOR',
            invitedByUserId: 'owner-user',
            inviterName: 'Owner',
            workspaceName: workspace.name
        });
        await ddbPut({
            PK: wsPk(workspace.id),
            SK: entitySk('QuickLink', 'link-1'),
            id: 'link-1',
            workspaceId: workspace.id,
            url: 'https://example.com',
            title: null,
            description: null,
            folderId: null,
            faviconUrl: null,
            order: 0,
            deletedAt: null,
            createdAt: now,
            updatedAt: now
        });
        await seedSession('owner-user', 0);
        await seedSession('member-user', 0);

        await deleteWorkspace(workspace.id);

        await expect(
            ddbQueryAll({ KeyConditionExpression: 'PK = :pk', ExpressionAttributeValues: { ':pk': wsPk(workspace.id) } })
        ).resolves.toHaveLength(0);
        await expect(ddbGet({ PK: 'WS_INDEX', SK: 'Workspace#SINGLETON' })).resolves.toBeUndefined();
        const sessions = await ddbQueryAll<BetterAuthSessionItem>({
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': baPk('session') }
        });
        expect(sessions).toHaveLength(0);
    });
});
