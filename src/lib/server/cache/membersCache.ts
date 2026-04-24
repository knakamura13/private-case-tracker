import { listMembers } from '$lib/server/services/workspace.service';

const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
	data: Awaited<ReturnType<typeof listMembers>>;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export async function getMembers(workspaceId: string) {
	const now = Date.now();
	const cached = cache.get(workspaceId);

	if (cached && now - cached.timestamp < CACHE_TTL_MS) {
		return cached.data;
	}

	const data = await listMembers(workspaceId);
	cache.set(workspaceId, { data, timestamp: now });
	return data;
}

export function invalidateMembers(workspaceId: string) {
	cache.delete(workspaceId);
}
