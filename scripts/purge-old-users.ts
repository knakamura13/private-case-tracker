import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ADMIN_EMAIL = 'kylenakamura12@gmail.com';

// Load .env file manually
function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env');
        const envContent = readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach((line) => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    } catch {
        console.warn('Could not load .env file, using defaults');
    }
}

loadEnv();

// Load environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'case-tracker-dev';
const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;

// Create DynamoDB client
const client = new DynamoDBClient({
    region: AWS_REGION,
    ...(DYNAMO_ENDPOINT
        ? {
              endpoint: DYNAMO_ENDPOINT,
              credentials: {
                  accessKeyId: 'local',
                  secretAccessKey: 'local'
              }
          }
        : {})
});

const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true
    }
});

// Helper functions
function baPk(model: string) {
    return `BA#${model}`;
}

async function queryGSI1(gsi1pk: string) {
    const res = await doc.send(
        new QueryCommand({
            TableName: DYNAMO_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: { ':pk': gsi1pk }
        })
    );
    return res.Items || [];
}

async function queryByPK(pk: string) {
    const res = await doc.send(
        new QueryCommand({
            TableName: DYNAMO_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': pk }
        })
    );
    return res.Items || [];
}

async function deleteItem(pk: string, sk: string) {
    await doc.send(
        new DeleteCommand({
            TableName: DYNAMO_TABLE,
            Key: { PK: pk, SK: sk }
        })
    );
}

async function purgeOldUsers() {
    console.log('Starting database purge...');
    console.log(`Keeping admin user: ${ADMIN_EMAIL}`);
    console.log(`Using table: ${DYNAMO_TABLE}`);

    // Get all Better Auth users
    const users = await queryByPK(baPk('user'));

    console.log(`Found ${users.length} users in database`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const user of users) {
        const email = user.email?.toLowerCase().trim();
        const userId = user.id;

        if (email === ADMIN_EMAIL.toLowerCase()) {
            console.log(`Keeping admin user: ${email} (ID: ${userId})`);
            keptCount++;
            continue;
        }

        console.log(`Deleting user: ${email} (ID: ${userId})`);

        // Delete the user record
        await deleteItem(baPk('user'), userId);

        // Delete associated sessions (BA#session)
        const sessions = await queryByPK(baPk('session'));

        for (const session of sessions) {
            if (session.userId === userId) {
                await deleteItem(baPk('session'), session.id);
                console.log(`  Deleted session: ${session.id}`);
            }
        }

        // Delete associated accounts (BA#account)
        const accounts = await queryByPK(baPk('account'));

        for (const account of accounts) {
            if (account.userId === userId) {
                await deleteItem(baPk('account'), account.id);
                console.log(`  Deleted account: ${account.id}`);
            }
        }

        // Delete associated memberships using GSI1
        const memberships = await queryGSI1(`USER#${userId}`);
        for (const membership of memberships) {
            if (membership.SK?.startsWith('Membership#')) {
                await deleteItem(membership.PK, membership.SK);
                console.log(`  Deleted membership: ${membership.SK}`);
            }
        }

        deletedCount++;
    }

    // Note: Invitation cleanup skipped due to Scan permission requirement.
    // Invitations will expire naturally or can be cleaned up via the app UI.

    console.log('\nPurge complete:');
    console.log(`- Kept users: ${keptCount}`);
    console.log(`- Deleted users: ${deletedCount}`);
    console.log(`- Note: Invitations not purged (requires Scan permission - clean up via app UI)`);
}

// Run the purge
purgeOldUsers().catch((err) => {
    console.error('Purge failed:', err);
    process.exit(1);
});
