import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ENV } from '$lib/server/env';

const globalForDdb = globalThis as unknown as { ddbDoc?: DynamoDBDocumentClient };

function createDocClient() {
	if (
		ENV.NODE_ENV === 'development' &&
		!ENV.DYNAMO_ENDPOINT &&
		!process.env.AWS_ACCESS_KEY_ID &&
		!process.env.AWS_PROFILE
	) {
		throw new Error(
			'DynamoDB credentials or DYNAMO_ENDPOINT required in development. ' +
				'Set DYNAMO_ENDPOINT for DynamoDB Local, or configure AWS credentials via AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_PROFILE.'
		);
	}
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

export function tableName() {
	return ENV.DYNAMO_TABLE;
}
