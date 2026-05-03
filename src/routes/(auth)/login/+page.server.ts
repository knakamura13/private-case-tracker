import { ENV } from '$lib/server/env';
import type { PageServerLoad } from './$types';
import { ddbQuery } from '$lib/server/dynamo/ops';
import { baPk } from '$lib/server/dynamo/keys';

export const load: PageServerLoad = async () => {
    const users = await ddbQuery<Record<string, unknown>>({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': baPk('user') },
        Limit: 1
    });
    const userCount = users.length;
    return {
        allowSignup: ENV.ALLOW_OPEN_SIGNUP || userCount === 0
    };
};
