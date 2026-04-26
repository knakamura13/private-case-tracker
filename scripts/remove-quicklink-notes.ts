import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
	region: 'us-east-1',
	endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
});

async function removeQuickLinkNotes() {
	const tableName = process.env.DYNAMODB_TABLE || 'case-tracker-dev';
	console.log(`Scanning table: ${tableName}`);

	let updatedCount = 0;

	try {
		const scanCommand = new ScanCommand({
			TableName: tableName,
			FilterExpression: 'begins_with(SK, :prefix) AND attribute_exists(notes)',
			ExpressionAttributeValues: {
				':prefix': { S: 'QuickLink#' }
			}
		});

		const response = await client.send(scanCommand);
		const items = response.Items || [];

		console.log(`Found ${items.length} QuickLink items with notes attribute`);

		for (const item of items) {
			const pk = item.PK.S;
			const sk = item.SK.S;

			if (!pk || !sk) {
				console.warn('Skipping item with missing PK or SK');
				continue;
			}

			const updateCommand = new UpdateItemCommand({
				TableName: tableName,
				Key: {
					PK: { S: pk },
					SK: { S: sk }
				},
				UpdateExpression: 'REMOVE #notes',
				ExpressionAttributeNames: {
					'#notes': 'notes'
				},
				ReturnValues: 'NONE'
			});

			await client.send(updateCommand);
			updatedCount++;
			console.log(`Removed notes from ${sk}`);
		}

		console.log(`Migration complete. Updated ${updatedCount} items.`);
	} catch (error) {
		console.error('Error during migration:', error);
		throw error;
	}
}

removeQuickLinkNotes();
