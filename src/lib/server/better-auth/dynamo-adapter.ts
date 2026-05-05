/* eslint-disable security/detect-object-injection */
import { createAdapterFactory, type DBAdapterDebugLogOption } from 'better-auth/adapters';
import { ddbPut, ddbGet, ddbQueryAll, ddbUpdate, ddbDelete } from '$lib/server/dynamo/ops';
import { baPk } from '$lib/server/dynamo/keys';

type Where = {
    operator?: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains' | 'starts_with' | 'ends_with';
    value: string | number | boolean | string[] | number[] | Date | null;
    field: string;
    connector?: 'AND' | 'OR';
};

function matchesWhere(row: Record<string, unknown>, where: Where[]) {
    // Better Auth passes a linear where[] with optional connector. We implement a minimal evaluator.
    let result = true;
    let pendingConnector: 'AND' | 'OR' = 'AND';

    for (const clause of where) {
        const fieldVal = row[clause.field];
        const op = clause.operator ?? 'eq';
        const val = clause.value;

        let ok = false;
        if (op === 'eq') ok = fieldVal === val;
        else if (op === 'ne') ok = fieldVal !== val;
        else if (op === 'contains') ok = typeof fieldVal === 'string' && typeof val === 'string' && fieldVal.includes(val);
        else if (op === 'starts_with') ok = typeof fieldVal === 'string' && typeof val === 'string' && fieldVal.startsWith(val);
        else if (op === 'ends_with') ok = typeof fieldVal === 'string' && typeof val === 'string' && fieldVal.endsWith(val);
        else if (op === 'in') ok = Array.isArray(val) && (val as unknown[]).includes(fieldVal);
        else if (op === 'lt') ok = val != null && (fieldVal as number) < (val as number);
        else if (op === 'lte') ok = val != null && (fieldVal as number) <= (val as number);
        else if (op === 'gt') ok = val != null && (fieldVal as number) > (val as number);
        else if (op === 'gte') ok = val != null && (fieldVal as number) >= (val as number);

        if (pendingConnector === 'AND') result = result && ok;
        else result = result || ok;

        pendingConnector = clause.connector ?? 'AND';
    }

    return result;
}

function decorateAuthIndexes(model: string, row: Record<string, unknown>) {
    const next = { ...row };
    if (model === 'user' && typeof next.email === 'string') {
        next.GSI2PK = `BA#user#email#${next.email.toLowerCase()}`;
        next.GSI2SK = String(next.id);
    }
    if (model === 'session' && typeof next.token === 'string') {
        next.GSI3PK = `BA#session#token#${next.token}`;
        next.GSI3SK = String(next.id);
    }
    if (model === 'verification' && typeof next.identifier === 'string') {
        next.GSI3PK = `BA#verification#identifier#${next.identifier}`;
        next.GSI3SK = `${String(next.createdAt ?? '')}#${String(next.id)}`;
    }
    if (model === 'account' && typeof next.providerId === 'string' && typeof next.accountId === 'string') {
        next.GSI2PK = `BA#account#provider#${next.providerId}#${next.accountId}`;
        next.GSI2SK = String(next.id);
    }
    return next;
}

function exactClause(where: Where[], field: string) {
    return where.find((c) => c.field === field && (c.operator ?? 'eq') === 'eq' && c.value != null);
}

async function indexedCandidates(model: string, where: Where[]) {
    if (model === 'user') {
        const email = exactClause(where, 'email')?.value;
        if (typeof email === 'string') {
            return ddbQueryAll<Record<string, unknown>>({
                IndexName: 'GSI2',
                KeyConditionExpression: 'GSI2PK = :pk',
                ExpressionAttributeValues: { ':pk': `BA#user#email#${email.toLowerCase()}` }
            });
        }
    }
    if (model === 'session') {
        const token = exactClause(where, 'token')?.value;
        if (typeof token === 'string') {
            return ddbQueryAll<Record<string, unknown>>({
                IndexName: 'GSI3',
                KeyConditionExpression: 'GSI3PK = :pk',
                ExpressionAttributeValues: { ':pk': `BA#session#token#${token}` }
            });
        }
    }
    if (model === 'verification') {
        const identifier = exactClause(where, 'identifier')?.value;
        if (typeof identifier === 'string') {
            return ddbQueryAll<Record<string, unknown>>({
                IndexName: 'GSI3',
                KeyConditionExpression: 'GSI3PK = :pk',
                ExpressionAttributeValues: { ':pk': `BA#verification#identifier#${identifier}` }
            });
        }
    }
    if (model === 'account') {
        const providerId = exactClause(where, 'providerId')?.value;
        const accountId = exactClause(where, 'accountId')?.value;
        if (typeof providerId === 'string' && typeof accountId === 'string') {
            return ddbQueryAll<Record<string, unknown>>({
                IndexName: 'GSI2',
                KeyConditionExpression: 'GSI2PK = :pk',
                ExpressionAttributeValues: { ':pk': `BA#account#provider#${providerId}#${accountId}` }
            });
        }
    }
    return null;
}

async function queryAuthPartition(model: string, where: Where[]) {
    const indexed = await indexedCandidates(model, where);
    const rows =
        indexed ??
        (await ddbQueryAll<Record<string, unknown>>({
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': baPk(model) }
        }));
    return rows.filter((r) => matchesWhere(r, where));
}

export interface DynamoBetterAuthAdapterConfig {
    debugLogs?: DBAdapterDebugLogOption;
}

export const dynamoBetterAuthAdapter = (config: DynamoBetterAuthAdapterConfig = {}) =>
    createAdapterFactory({
        config: {
            adapterId: 'dynamodb-single-table',
            adapterName: 'DynamoDB Single Table',
            usePlural: false,
            debugLogs: config.debugLogs ?? false,
            supportsJSON: true,
            // DynamoDB has no native Date type; we store ISO strings at the ops layer.
            // Telling Better Auth the adapter doesn't support dates makes it pass strings
            // in and reconstruct Date on read.
            supportsDates: false,
            supportsBooleans: true,
            supportsNumericIds: false,
            // DynamoDB transactions disabled - Better Auth's transaction API requires
            // adapter-specific implementation that doesn't align with DynamoDB's model.
            // Multi-write operations run sequentially; partial failures should be handled
            // at the service layer with compensation logic if needed.
            transaction: false
        },
        // @ts-expect-error - Better Auth adapter type incompatibility with DynamoDB's dynamic typing
        adapter: ({ transformInput, transformOutput, transformWhereClause }) => {
            return {
                create: async ({ data, model, select }) => {
                    const row = (await transformInput(data, model, 'create')) as Record<string, unknown>;
                    const id = String(row.id);
                    const stored = decorateAuthIndexes(model, {
                        PK: baPk(model),
                        SK: id,
                        ...row
                    });
                    await ddbPut(stored);
                    const out = (await transformOutput(row, model)) as Record<string, unknown>;
                    if (Array.isArray(select) && select.length) {
                        const picked: Record<string, unknown> = {};
                        for (const k of select) picked[k] = out[k];
                        return picked;
                    }
                    return out;
                },
                update: async ({ where, update, model }) => {
                    const w = (await transformWhereClause({ where, model, action: 'update' })) as Where[];
                    const patch = (await transformInput(update as Record<string, unknown>, model, 'update')) as Record<string, unknown>;

                    // Prefer updating by id if present.
                    const idClause = w.find((c) => c.field === 'id' && (c.operator ?? 'eq') === 'eq');
                    if (idClause && idClause.value != null) {
                        const id = String(idClause.value);
                        const existing = await ddbGet<Record<string, unknown>>({ PK: baPk(model), SK: id });
                        if (!existing) return null;
                        const next = decorateAuthIndexes(model, { ...existing, ...patch, PK: baPk(model), SK: id });
                        const names: Record<string, string> = {};
                        const values: Record<string, unknown> = {};
                        const sets: string[] = [];
                        for (const [k, v] of Object.entries(next)) {
                            if (k === 'PK' || k === 'SK') continue;
                            const nk = `#${k}`;
                            const vk = `:${k}`;
                            names[nk] = k;
                            values[vk] = v;
                            sets.push(`${nk} = ${vk}`);
                        }
                        if (!sets.length) return null;
                        const updated = await ddbUpdate<Record<string, unknown>>(
                            { PK: baPk(model), SK: id },
                            `SET ${sets.join(', ')}`,
                            values,
                            names
                        );
                        return updated ? ((await transformOutput(updated, model)) as Record<string, unknown>) : null;
                    }

                    // Fallback: find first match, then update by its id.
                    const hit = (await queryAuthPartition(model, w))[0];
                    if (!hit) return null;
                    // @ts-expect-error - Dynamic adapter method call with unknown return
                    const updated = await (this as Record<string, unknown>).update({
                        where: [{ field: 'id', operator: 'eq', value: (hit as Record<string, unknown>).id as unknown }],
                        update,
                        model
                    });
                    return updated as Record<string, unknown> | null;
                },
                updateMany: async ({ where, update, model }) => {
                    const w = (await transformWhereClause({ where, model, action: 'updateMany' })) as Where[];
                    // transformInput currently distinguishes only create/update transformations.
                    const patch = (await transformInput(update as Record<string, unknown>, model, 'update')) as Record<string, unknown>;
                    const hits = await queryAuthPartition(model, w);
                    for (const h of hits) {
                        // @ts-expect-error - Dynamic adapter method call with unknown return
                        await (this as Record<string, unknown>).update({
                            where: [{ field: 'id', operator: 'eq', value: (h as Record<string, unknown>).id as unknown }],
                            update: patch,
                            model
                        });
                    }
                    return hits.length;
                },
                delete: async ({ where, model }) => {
                    const w = (await transformWhereClause({ where, model, action: 'delete' })) as Where[];
                    const idClause = w.find((c) => c.field === 'id' && (c.operator ?? 'eq') === 'eq');
                    if (idClause && idClause.value != null) {
                        await ddbDelete({ PK: baPk(model), SK: String(idClause.value) });
                        return;
                    }
                    // Fallback: scan small partition and delete first match.
                    const hit = (await queryAuthPartition(model, w))[0];
                    if (hit) await ddbDelete({ PK: baPk(model), SK: String(hit.id) });
                },
                deleteMany: async ({ where, model }) => {
                    const w = (await transformWhereClause({ where, model, action: 'deleteMany' })) as Where[];
                    const hits = await queryAuthPartition(model, w);
                    for (const h of hits) await ddbDelete({ PK: baPk(model), SK: String(h.id) });
                    return hits.length;
                },
                findOne: async ({ where, model, select }) => {
                    const w = (await transformWhereClause({ where, model, action: 'findOne' })) as Where[];
                    const idClause = exactClause(w, 'id');
                    if (idClause?.value != null) {
                        const hit = await ddbGet<Record<string, unknown>>({ PK: baPk(model), SK: String(idClause.value) });
                        if (!hit) return null;
                        const out = (await transformOutput(hit, model)) as Record<string, unknown>;
                        if (Array.isArray(select) && select.length) {
                            const picked: Record<string, unknown> = {};
                            for (const k of select) picked[k] = out[k];
                            return picked;
                        }
                        return out;
                    }

                    const hit = (await queryAuthPartition(model, w))[0];
                    if (!hit) return null;
                    const out = (await transformOutput(hit, model)) as Record<string, unknown>;
                    if (Array.isArray(select) && select.length) {
                        const picked: Record<string, unknown> = {};
                        for (const k of select) picked[k] = out[k];
                        return picked;
                    }
                    return out;
                },
                findMany: async ({ where, model, limit, offset }) => {
                    const w = (await transformWhereClause({ where, model, action: 'findMany' })) as Where[];
                    const hits = await queryAuthPartition(model, w);
                    const sliced = hits.slice(offset ?? 0, (offset ?? 0) + (limit ?? hits.length));
                    return (await Promise.all(sliced.map((r) => transformOutput(r, model)))) as Record<string, unknown>[];
                },
                count: async ({ where, model }) => {
                    const w = (await transformWhereClause({ where, model, action: 'count' })) as Where[];
                    return (await queryAuthPartition(model, w)).length;
                }
            };
        }
    });
