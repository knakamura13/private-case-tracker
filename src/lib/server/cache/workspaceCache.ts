import { ddbQuery } from '$lib/server/dynamo/ops';
import { gsi1UserPk } from '$lib/server/dynamo/keys';

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
    data: {
        id: string;
        name: string;
        role: 'OWNER' | 'COLLABORATOR';
    } | null;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export async function getWorkspace(userId: string) {
    const now = Date.now();
    const cached = cache.get(userId);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    const memberships = await ddbQuery<{
        workspaceId: string;
        role: 'OWNER' | 'COLLABORATOR';
        acceptedAt: string | null;
        workspaceName?: string;
    }>({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: { ':pk': gsi1UserPk(userId) },
        Limit: 10
    });

    const membership = memberships.find((m) => m.acceptedAt != null);
    const data = membership?.workspaceId
        ? {
              id: membership.workspaceId,
              name: membership.workspaceName ?? 'Workspace',
              role: membership.role
          }
        : null;

    cache.set(userId, { data, timestamp: now });
    return data;
}

export function invalidateWorkspace(userId: string) {
    cache.delete(userId);
}
