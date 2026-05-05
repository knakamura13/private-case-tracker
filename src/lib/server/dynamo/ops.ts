/* eslint-disable security/detect-object-injection */
import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    TransactWriteCommand,
    UpdateCommand,
    type QueryCommandInput,
    type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { ENV } from '$lib/server/env';

const isTest = Boolean(process.env.VITEST) || process.env.NODE_ENV === 'test';
const useMem = isTest;

type Key = { PK: string; SK: string };
type AnyItem = Record<string, unknown> & Key;
type WriteOptions = {
    ConditionExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
};
export type TransactWriteItem =
    | { Put: { Item: Record<string, unknown>; ConditionExpression?: string } }
    | { Update: { Key: Key; UpdateExpression: string; ExpressionAttributeValues: Record<string, unknown>; ExpressionAttributeNames?: Record<string, string>; ConditionExpression?: string } }
    | { Delete: { Key: Key; ConditionExpression?: string } };

const globalForMem = globalThis as unknown as { __ddbMem?: Map<string, AnyItem> };
function memStore() {
    if (!globalForMem.__ddbMem) globalForMem.__ddbMem = new Map();
    return globalForMem.__ddbMem;
}

function keyStr(k: Key) {
    return `${k.PK}||${k.SK}`;
}

function conditionalError() {
    const err = new Error('ConditionalCheckFailed');
    err.name = 'ConditionalCheckFailedException';
    return err;
}

function resolveName(token: string, names?: Record<string, string>) {
    return names?.[token] ?? (token.startsWith('#') ? token.slice(1) : token);
}

function matchesCondition(item: AnyItem | undefined, key: Key, options?: WriteOptions) {
    const expr = options?.ConditionExpression;
    if (!expr) return true;
    const virtual = item ?? ({ ...key } as AnyItem);
    return expr.split(/\s+AND\s+/i).every((part) => {
        const trimmed = part.trim();
        const exists = trimmed.match(/^attribute_exists\(([^)]+)\)$/);
        if (exists) {
            const field = resolveName(exists[1]!, options?.ExpressionAttributeNames);
            return item !== undefined && virtual[field] !== undefined;
        }
        const notExists = trimmed.match(/^attribute_not_exists\(([^)]+)\)$/);
        if (notExists) {
            const field = resolveName(notExists[1]!, options?.ExpressionAttributeNames);
            return item === undefined || virtual[field] === undefined;
        }
        const equality = trimmed.match(/^(.+?)\s*=\s*(:[A-Za-z0-9_]+)$/);
        if (equality) {
            const field = resolveName(equality[1]!.trim(), options?.ExpressionAttributeNames);
            return item !== undefined && virtual[field] === options?.ExpressionAttributeValues?.[equality[2]!];
        }
        throw new Error(`Unsupported ConditionExpression in test mode: ${expr}`);
    });
}

// DynamoDB has no native Date type and the DocumentClient marshaller rejects
// class instances by default. Normalize any Date we see into an ISO string so
// callers (domain services, Better Auth adapter, future code) never have to
// think about it. Plain Date values round-trip back as ISO strings; adapters
// that expect Date objects are responsible for parsing them on read.
function normalize<T>(value: T): T {
    if (value instanceof Date) return value.toISOString() as unknown as T;
    if (Array.isArray(value)) return value.map(normalize) as unknown as T;
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (v === undefined) continue;
            out[k] = normalize(v);
        }
        return out as T;
    }
    return value;
}

async function getLive() {
    const mod = await import('./client');
    return { ddb: mod.ddb, tableName: ENV.DYNAMO_TABLE };
}

export async function ddbPut(item: Record<string, unknown>, options?: WriteOptions) {
    const normalized = normalize(item) as Record<string, unknown>;
    if (useMem) {
        const it = normalized as AnyItem;
        const key = { PK: it.PK, SK: it.SK };
        const store = memStore();
        const cur = store.get(keyStr(key));
        if (!matchesCondition(cur, key, options)) throw conditionalError();
        store.set(keyStr(key), it);
        return;
    }
    const { ddb, tableName } = await getLive();
    return ddb.send(new PutCommand({ TableName: tableName, Item: normalized, ...options }));
}

export async function ddbGet<T>(key: { PK: string; SK: string }) {
    if (useMem) {
        return memStore().get(keyStr(key)) as T | undefined;
    }
    const { ddb, tableName } = await getLive();
    const res = await ddb.send(new GetCommand({ TableName: tableName, Key: key }));
    return (res.Item as T | undefined) ?? undefined;
}

export async function ddbUpdate<T>(
    key: { PK: string; SK: string },
    updateExpression: string,
    expressionAttributeValues: Record<string, unknown>,
    expressionAttributeNames?: Record<string, string>,
    options?: WriteOptions
) {
    expressionAttributeValues = normalize(expressionAttributeValues) as Record<string, unknown>;
    if (useMem) {
        const store = memStore();
        const cur = store.get(keyStr(key));
        if (!matchesCondition(cur, key, { ...options, ExpressionAttributeNames: expressionAttributeNames, ExpressionAttributeValues: expressionAttributeValues })) {
            throw conditionalError();
        }
        if (!cur) return undefined;
        // Minimal parser for `SET a = :x, b = :y` style updates.
        const setPrefix = updateExpression.trim().startsWith('SET') ? updateExpression.trim().slice(3) : '';
        const assignments = setPrefix
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        for (const a of assignments) {
            const [lhsRaw, rhsRaw] = a.split('=').map((s) => s.trim());
            if (!lhsRaw || !rhsRaw) continue;
            const field = expressionAttributeNames?.[lhsRaw] ?? (lhsRaw.startsWith('#') ? lhsRaw.slice(1) : lhsRaw);
            const val = expressionAttributeValues[rhsRaw];
            (cur as Record<string, unknown>)[field] = val;
        }
        store.set(keyStr(key), cur);
        return cur as unknown as T;
    }
    const { ddb, tableName } = await getLive();
    const res = await ddb.send(
        new UpdateCommand({
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ConditionExpression: options?.ConditionExpression,
            ReturnValues: 'ALL_NEW'
        })
    );
    return res.Attributes as T | undefined;
}

export async function ddbDelete(key: { PK: string; SK: string }, options?: WriteOptions) {
    if (useMem) {
        const store = memStore();
        const cur = store.get(keyStr(key));
        if (!matchesCondition(cur, key, options)) throw conditionalError();
        store.delete(keyStr(key));
        return;
    }
    const { ddb, tableName } = await getLive();
    return ddb.send(new DeleteCommand({ TableName: tableName, Key: key, ...options }));
}

function queryMem<T>(input: Omit<QueryCommandInput, 'TableName'>, applyLimit: boolean) {
    const items = Array.from(memStore().values());
    const vals = (input.ExpressionAttributeValues ?? {}) as Record<string, unknown>;
    const pk = vals[':pk'];
    const prefix = vals[':prefix'];
    const skEq = vals[':sk'];
    let out: AnyItem[];
    if (input.IndexName === 'GSI1' || input.IndexName === 'GSI2' || input.IndexName === 'GSI3') {
        const pkField = `${input.IndexName}PK`;
        const skField = `${input.IndexName}SK`;
        out = items.filter((it) => it[pkField] === pk);
        if (typeof skEq === 'string') out = out.filter((it) => it[skField] === skEq);
        else if (typeof prefix === 'string') out = out.filter((it) => String(it[skField]).startsWith(prefix));
    } else {
        out = items.filter((it) => it.PK === pk);
        if (typeof skEq === 'string') out = out.filter((it) => it.SK === skEq);
        else if (typeof prefix === 'string') out = out.filter((it) => String(it.SK).startsWith(prefix));
    }
    if (input.ScanIndexForward === false) out = out.slice().sort((a, b) => String(b.SK).localeCompare(String(a.SK)));
    if (applyLimit && typeof input.Limit === 'number') out = out.slice(0, input.Limit);
    return out as unknown as T[];
}

export async function ddbQuery<T>(input: Omit<QueryCommandInput, 'TableName'>) {
    if (useMem) {
        return queryMem<T>(input, true);
    }
    const { ddb, tableName } = await getLive();
    const res = await ddb.send(new QueryCommand({ ...input, TableName: tableName }));
    return (res.Items as T[]) ?? [];
}

export async function ddbQueryAll<T>(input: Omit<QueryCommandInput, 'TableName'>) {
    if (useMem) return queryMem<T>(input, false);
    const { ddb, tableName } = await getLive();
    const items: T[] = [];
    let ExclusiveStartKey = input.ExclusiveStartKey;
    do {
        const res = await ddb.send(new QueryCommand({ ...input, TableName: tableName, ExclusiveStartKey }));
        items.push(...(((res.Items as T[]) ?? []) as T[]));
        ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
}

function applyMemUpdate(item: AnyItem, updateExpression: string, expressionAttributeValues: Record<string, unknown>, expressionAttributeNames?: Record<string, string>) {
    const setPrefix = updateExpression.trim().startsWith('SET') ? updateExpression.trim().slice(3) : '';
    const assignments = setPrefix
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    for (const a of assignments) {
        const [lhsRaw, rhsRaw] = a.split('=').map((s) => s.trim());
        if (!lhsRaw || !rhsRaw) continue;
        const field = expressionAttributeNames?.[lhsRaw] ?? (lhsRaw.startsWith('#') ? lhsRaw.slice(1) : lhsRaw);
        item[field] = expressionAttributeValues[rhsRaw];
    }
}

export async function ddbTransactWrite(items: TransactWriteItem[]) {
    if (useMem) {
        const store = memStore();
        for (const item of items) {
            if ('Put' in item) {
                const normalized = normalize(item.Put.Item) as AnyItem;
                const key = { PK: normalized.PK, SK: normalized.SK };
                if (!matchesCondition(store.get(keyStr(key)), key, { ConditionExpression: item.Put.ConditionExpression })) throw conditionalError();
            } else if ('Update' in item) {
                const cur = store.get(keyStr(item.Update.Key));
                if (
                    !matchesCondition(cur, item.Update.Key, {
                        ConditionExpression: item.Update.ConditionExpression,
                        ExpressionAttributeNames: item.Update.ExpressionAttributeNames,
                        ExpressionAttributeValues: item.Update.ExpressionAttributeValues
                    })
                ) {
                    throw conditionalError();
                }
            } else {
                const cur = store.get(keyStr(item.Delete.Key));
                if (!matchesCondition(cur, item.Delete.Key, { ConditionExpression: item.Delete.ConditionExpression })) throw conditionalError();
            }
        }
        for (const item of items) {
            if ('Put' in item) {
                const normalized = normalize(item.Put.Item) as AnyItem;
                store.set(keyStr({ PK: normalized.PK, SK: normalized.SK }), normalized);
            } else if ('Update' in item) {
                const cur = store.get(keyStr(item.Update.Key));
                if (!cur) continue;
                applyMemUpdate(cur, item.Update.UpdateExpression, normalize(item.Update.ExpressionAttributeValues) as Record<string, unknown>, item.Update.ExpressionAttributeNames);
                store.set(keyStr(item.Update.Key), cur);
            } else {
                store.delete(keyStr(item.Delete.Key));
            }
        }
        return;
    }
    const { ddb, tableName } = await getLive();
    return ddb.send(
        new TransactWriteCommand({
            TransactItems: items.map((item) => {
                if ('Put' in item) return { Put: { TableName: tableName, ...item.Put, Item: normalize(item.Put.Item) as Record<string, unknown> } };
                if ('Update' in item) {
                    return {
                        Update: {
                            TableName: tableName,
                            ...item.Update,
                            ExpressionAttributeValues: normalize(item.Update.ExpressionAttributeValues) as Record<string, unknown>
                        }
                    };
                }
                return { Delete: { TableName: tableName, ...item.Delete } };
            })
        })
    );
}

export async function ddbScan<T>(input: Omit<ScanCommandInput, 'TableName'>) {
    if (useMem) {
        return Array.from(memStore().values()) as unknown as T[];
    }
    const { ddb, tableName } = await getLive();
    const res = await ddb.send(new ScanCommand({ ...input, TableName: tableName }));
    return (res.Items as T[]) ?? [];
}
