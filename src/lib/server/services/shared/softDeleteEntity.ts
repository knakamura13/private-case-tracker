import type { ActivityAction } from '$lib/types/enums';
import type { EntityType } from '$lib/server/dynamo/keys';
import { logActivity } from '$lib/server/activity';
import { ddbGet, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { DynamoBaseItem } from '$lib/server/dynamo/types';

export async function softDeleteEntity(
	workspaceId: string,
	actorId: string,
	entityType: EntityType,
	entityId: string,
	entityName: string,
	action: ActivityAction
) {
	const existing = await ddbGet<DynamoBaseItem>({
		PK: wsPk(workspaceId),
		SK: entitySk(entityType, entityId)
	});
	if (!existing) throw new Error(`${entityType} not found`);
	if (existing.deletedAt) throw new Error(`${entityType} not found`);

	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk(entityType, entityId) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);

	await logActivity({
		workspaceId,
		userId: actorId,
		action,
		entityType,
		entityId,
		summary: `${entityType} "${entityName}" deleted`
	});
}
