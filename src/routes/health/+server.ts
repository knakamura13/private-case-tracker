import { json } from '@sveltejs/kit';
import { ddbQuery } from '$lib/server/dynamo/ops';
import { wsPk } from '$lib/server/dynamo/keys';

export const GET = async () => {
	try {
		// Minimal read to verify DynamoDB connectivity.
		await ddbQuery({
			KeyConditionExpression: 'PK = :pk',
			ExpressionAttributeValues: { ':pk': wsPk('healthcheck') },
			Limit: 1
		});
		return json({ ok: true, db: 'up', time: new Date().toISOString(), store: 'dynamodb' });
	} catch (err) {
		return json(
			{ ok: false, db: 'down', error: err instanceof Error ? err.message : 'unknown' },
			{ status: 503 }
		);
	}
};
