import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
	region: 'us-east-1',
	endpoint: 'http://localhost:8000'
});

async function createTable() {
	const command = new CreateTableCommand({
		TableName: 'case-tracker-dev',
		AttributeDefinitions: [
			{ AttributeName: 'PK', AttributeType: 'S' },
			{ AttributeName: 'SK', AttributeType: 'S' },
			{ AttributeName: 'GSI1PK', AttributeType: 'S' },
			{ AttributeName: 'GSI1SK', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'PK', KeyType: 'HASH' },
			{ AttributeName: 'SK', KeyType: 'RANGE' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'GSI1',
				KeySchema: [
					{ AttributeName: 'GSI1PK', KeyType: 'HASH' },
					{ AttributeName: 'GSI1SK', KeyType: 'RANGE' }
				],
				Projection: { ProjectionType: 'ALL' }
			}
		],
		BillingMode: 'PAY_PER_REQUEST'
	});

	try {
		const response = await client.send(command);
		console.log('Table created successfully:', response.TableDescription?.TableName);
	} catch (error) {
		if (error instanceof Error && 'name' in error && error.name === 'ResourceInUseException') {
			console.log('Table already exists');
		} else {
			console.error('Error creating table:', error);
			throw error;
		}
	}
}

createTable();
