import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ENV } from '$lib/server/env';

const globalForDdb = globalThis as unknown as { ddbDoc?: DynamoDBDocumentClient };

function createDocClient() {
	const client = new DynamoDBClient({
		region: ENV.AWS_REGION,
		...(ENV.DYNAMO_ENDPOINT
			? {
					endpoint: ENV.DYNAMO_ENDPOINT,
					// DynamoDB Local accepts any credentials but the SDK requires some value.
					credentials: {
						accessKeyId: 'local',
						secretAccessKey: 'local'
					}
				}
			: {})
	});
	return DynamoDBDocumentClient.from(client, {
		marshallOptions: {
			removeUndefinedValues: true
		}
	});
}

export const ddb = globalForDdb.ddbDoc ?? createDocClient();
if (ENV.NODE_ENV === 'development') globalForDdb.ddbDoc = ddb;
