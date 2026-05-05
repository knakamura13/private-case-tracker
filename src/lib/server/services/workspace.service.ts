/* eslint-disable security/detect-object-injection */
import { logActivity } from '$lib/server/activity';
import type { MemberRole } from '$lib/types/enums';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbQuery, ddbUpdate, ddbDelete, ddbQueryAll, ddbTransactWrite } from '$lib/server/dynamo/ops';
import { baPk, entitySk, gsi1Sk, gsi1UserPk, wsPk } from '$lib/server/dynamo/keys';
import { invalidateMembers } from '$lib/server/cache/membersCache';
import { invalidateWorkspace } from '$lib/server/cache/workspaceCache';
import type { MembershipItem, BetterAuthUserItem, BetterAuthSessionItem, WorkspaceItem } from '$lib/server/dynamo/types';

export async function createWorkspace(input: { name: string; ownerUserId: string }) {
    const now = new Date().toISOString();
    const workspaceId = randomUUID();
    const evidenceCounts = {} as Record<string, number>;
    for (const cat of EVIDENCE_CATEGORIES) {
        evidenceCounts[cat] = 0;
    }
    const ws = {
        id: workspaceId,
        name: input.name,
        ownerId: input.ownerUserId,
        evidenceCategories: [...EVIDENCE_CATEGORIES] as string[],
        evidenceTargets: { ...EVIDENCE_TARGETS } as Record<string, number>,
        evidenceCounts,
        createdAt: now,
        updatedAt: now
    };

    await ddbTransactWrite([
        {
            Put: {
                Item: {
                    PK: wsPk(workspaceId),
                    SK: entitySk('Workspace', workspaceId),
                    ...ws
                }
            }
        },
        {
            Put: {
                Item: { PK: 'WS_INDEX', SK: 'Workspace#SINGLETON', workspaceId, createdAt: now, updatedAt: now },
                ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
            }
        },
        {
            Put: {
                Item: {
                    PK: wsPk(workspaceId),
                    SK: entitySk('Membership', input.ownerUserId),
                    id: randomUUID(),
                    workspaceId,
                    userId: input.ownerUserId,
                    role: 'OWNER' as const,
                    acceptedAt: now,
                    createdAt: now,
                    updatedAt: now,
                    GSI1PK: gsi1UserPk(input.ownerUserId),
                    GSI1SK: gsi1Sk('Membership', workspaceId),
                    workspaceName: ws.name
                }
            }
        }
    ]);
    await logActivity({
        workspaceId: ws.id,
        userId: input.ownerUserId,
        action: 'WORKSPACE_UPDATED',
        entityType: 'Workspace',
        entityId: ws.id,
        summary: `Workspace "${ws.name}" created`
    });
    invalidateWorkspace(input.ownerUserId);
    return ws;
}

export async function getMembership(workspaceId: string, userId: string) {
    return ddbGet<{
        workspaceId: string;
        userId: string;
        role: MemberRole;
        acceptedAt: string | null;
    }>({
        PK: wsPk(workspaceId),
        SK: entitySk('Membership', userId)
    });
}

export async function listMembers(workspaceId: string) {
    const rows = await ddbQuery<MembershipItem>({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'Membership#' }
    });

    // Fetch user data for each member from Better Auth table
    const membersWithUsers = await Promise.all(
        rows.map(async (r) => {
            const user = await ddbGet<BetterAuthUserItem>({ PK: baPk('user'), SK: r.userId });
            return {
                id: r.id ?? `${r.workspaceId}:${r.userId}`,
                workspaceId: r.workspaceId,
                userId: r.userId,
                role: r.role,
                acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : null,
                createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
                user: user
                    ? {
                          id: user.id,
                          email: user.email,
                          name: user.name,
                          image: user.image,
                          createdAt: user.createdAt ? new Date(user.createdAt) : new Date()
                      }
                    : { id: r.userId, email: '', name: null, image: null, createdAt: new Date() }
            };
        })
    );

    return membersWithUsers.sort((a, b) =>
        a.role === b.role ? a.createdAt.getTime() - b.createdAt.getTime() : a.role.localeCompare(b.role)
    );
}

export async function changeRole(workspaceId: string, userId: string, role: MemberRole) {
    await ddbUpdate({ PK: wsPk(workspaceId), SK: entitySk('Membership', userId) }, 'SET #role = :r', { ':r': role }, { '#role': 'role' });
    invalidateMembers(workspaceId);
    invalidateWorkspace(userId);
}

export async function removeMember(workspaceId: string, userId: string) {
    // Delete the membership
    await ddbDelete({ PK: wsPk(workspaceId), SK: entitySk('Membership', userId) });
    invalidateMembers(workspaceId);
    invalidateWorkspace(userId);

    // Invalidate all sessions for the user to immediately revoke access
    const sessions = await ddbQueryAll<BetterAuthSessionItem>({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': baPk('session') }
    });

    for (const session of sessions) {
        if (session.userId === userId) {
            await ddbDelete({ PK: baPk('session'), SK: session.id });
        }
    }
}

export async function renameWorkspace(workspaceId: string, name: string, actorId: string) {
    const updated =
        (await ddbUpdate<WorkspaceItem>(
            { PK: wsPk(workspaceId), SK: entitySk('Workspace', workspaceId) },
            'SET #name = :n, #updatedAt = :u',
            { ':n': name, ':u': new Date().toISOString() },
            { '#name': 'name', '#updatedAt': 'updatedAt' }
        )) ?? null;

    // Invalidate workspace cache for all members since name changed
    const members = await listMembers(workspaceId);
    for (const member of members) {
        invalidateWorkspace(member.userId);
    }

    await logActivity({
        workspaceId,
        userId: actorId,
        action: 'WORKSPACE_UPDATED',
        entityType: 'Workspace',
        entityId: workspaceId,
        summary: `Renamed workspace to "${name}"`
    });
    return updated;
}

export async function deleteWorkspace(workspaceId: string) {
    const workspacePartition = await ddbQueryAll<{ PK: string; SK: string; userId?: string }>({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': wsPk(workspaceId) }
    });
    const memberIds = new Set(
        workspacePartition
            .filter((item) => String(item.SK).startsWith('Membership#') && typeof item.userId === 'string')
            .map((item) => item.userId as string)
    );

    const sessions = await ddbQueryAll<BetterAuthSessionItem>({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': baPk('session') }
    });

    for (const session of sessions) {
        if (memberIds.has(session.userId)) {
            await ddbDelete({ PK: baPk('session'), SK: session.id });
        }
    }

    for (const item of workspacePartition) {
        await ddbDelete({ PK: item.PK, SK: item.SK });
    }

    const errorLogs = await ddbQueryAll<{ PK: string; SK: string }>({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': `ERR#WS#${workspaceId}` }
    });
    for (const item of errorLogs) {
        await ddbDelete({ PK: item.PK, SK: item.SK });
    }

    await ddbDelete({ PK: 'WS_INDEX', SK: 'Workspace#SINGLETON' });
    for (const userId of memberIds) {
        invalidateWorkspace(userId);
    }
    invalidateMembers(workspaceId);
}
