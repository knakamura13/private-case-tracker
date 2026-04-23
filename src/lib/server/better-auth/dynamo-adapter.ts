import { createAdapterFactory, type DBAdapterDebugLogOption } from 'better-auth/adapters';
import { ddbPut, ddbQuery, ddbUpdate, ddbDelete } from '$lib/server/dynamo/ops';
import { baPk } from '$lib/server/dynamo/keys';

type Where = {
	operator?:
		| 'eq'
		| 'ne'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'in'
		| 'contains'
		| 'starts_with'
		| 'ends_with';
	value: string | number | boolean | string[] | number[] | Date | null;
	field: string;
	connector?: 'AND' | 'OR';
};

function matchesWhere(row: Record<string, any>, where: Where[]) {
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
		else if (op === 'contains')
			ok = typeof fieldVal === 'string' && typeof val === 'string' && fieldVal.includes(val);
		else if (op === 'starts_with')
			ok = typeof fieldVal === 'string' && typeof val === 'string' && fieldVal.startsWith(val);
		else if (op === 'ends_with')
			ok = typeof fieldVal === 'string' && typeof val === 'string' && fieldVal.endsWith(val);
		else if (op === 'in') ok = Array.isArray(val) && (val as any[]).includes(fieldVal);
		else if (op === 'lt') ok = val != null && fieldVal < val;
		else if (op === 'lte') ok = val != null && fieldVal <= val;
		else if (op === 'gt') ok = val != null && fieldVal > val;
		else if (op === 'gte') ok = val != null && fieldVal >= val;

		if (pendingConnector === 'AND') result = result && ok;
		else result = result || ok;

		pendingConnector = clause.connector ?? 'AND';
	}

	return result;
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
			supportsDates: true,
			supportsBooleans: true,
			supportsNumericIds: false,
			// DynamoDB transactions exist, but we keep this disabled to run sequentially.
			transaction: false
		},
		adapter: ({ transformInput, transformOutput, transformWhereClause }) => {
			return {
				create: async ({ data, model, select }) => {
					const row = (await transformInput(data, model, 'create')) as Record<string, unknown>;
					const id = String(row.id);
					await ddbPut({
						PK: baPk(model),
						SK: id,
						...row
					});
					const out = (await transformOutput(row, model)) as any;
					if (Array.isArray(select) && select.length) {
						const picked: any = {};
						for (const k of select) picked[k] = out[k];
						return picked;
					}
					return out;
				},
				update: async ({ where, update, model }) => {
					const w = (await transformWhereClause({ where, model, action: 'update' })) as Where[];
					const patch = (await transformInput(update as any, model, 'update')) as Record<
						string,
						unknown
					>;

					// Prefer updating by id if present.
					const idClause = w.find((c) => c.field === 'id' && (c.operator ?? 'eq') === 'eq');
					if (idClause && idClause.value != null) {
						const id = String(idClause.value);
						const names: Record<string, string> = {};
						const values: Record<string, unknown> = {};
						const sets: string[] = [];
						for (const [k, v] of Object.entries(patch)) {
							const nk = `#${k}`;
							const vk = `:${k}`;
							names[nk] = k;
							values[vk] = v;
							sets.push(`${nk} = ${vk}`);
						}
						if (!sets.length) return null;
						const updated = await ddbUpdate<any>(
							{ PK: baPk(model), SK: id },
							`SET ${sets.join(', ')}`,
							values,
							names
						);
						return updated ? ((await transformOutput(updated, model)) as any) : null;
					}

					// Fallback: find first match, then update by its id.
					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: 200
					});
					const hit = found.find((r) => matchesWhere(r, w));
					if (!hit) return null;
					return (await (this as any).update({
						where: [{ field: 'id', operator: 'eq', value: hit.id }],
						update,
						model
					})) as any;
				},
				updateMany: async ({ where, update, model }) => {
					const w = (await transformWhereClause({ where, model, action: 'updateMany' })) as Where[];
					// transformInput currently distinguishes only create/update transformations.
					const patch = (await transformInput(update as any, model, 'update')) as Record<
						string,
						unknown
					>;
					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: 500
					});
					const hits = found.filter((r) => matchesWhere(r, w));
					for (const h of hits) {
						await (this as any).update({
							where: [{ field: 'id', operator: 'eq', value: h.id }],
							update: patch,
							model
						});
					}
					return hits.length;
				},
				delete: async ({ where, model }) => {
					const w = (await transformWhereClause({ where, model, action: 'delete' })) as Where[];
					const idClause = w.find((c) => c.field === 'id' && (c.operator ?? 'eq') === 'eq');
					if (idClause?.value != null) {
						await ddbDelete({ PK: baPk(model), SK: String(idClause.value) });
						return;
					}
					// Fallback: scan small partition and delete first match.
					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: 200
					});
					const hit = found.find((r) => matchesWhere(r, w));
					if (hit) await ddbDelete({ PK: baPk(model), SK: String(hit.id) });
				},
				deleteMany: async ({ where, model }) => {
					const w = (await transformWhereClause({ where, model, action: 'deleteMany' })) as Where[];
					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: 500
					});
					const hits = found.filter((r) => matchesWhere(r, w));
					for (const h of hits) await ddbDelete({ PK: baPk(model), SK: String(h.id) });
					return hits.length;
				},
				findOne: async ({ where, model, select }) => {
					const w = (await transformWhereClause({ where, model, action: 'findOne' })) as Where[];
					const idClause = w.find((c) => c.field === 'id' && (c.operator ?? 'eq') === 'eq');
					if (idClause?.value != null) {
						const res = await ddbQuery<any>({
							KeyConditionExpression: 'PK = :pk AND SK = :sk',
							ExpressionAttributeValues: { ':pk': baPk(model), ':sk': String(idClause.value) },
							Limit: 1
						});
						const hit = res[0];
						if (!hit) return null;
						const out = (await transformOutput(hit, model)) as any;
						if (Array.isArray(select) && select.length) {
							const picked: any = {};
							for (const k of select) picked[k] = out[k];
							return picked;
						}
						return out;
					}

					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: 200
					});
					const hit = found.find((r) => matchesWhere(r, w));
					if (!hit) return null;
					const out = (await transformOutput(hit, model)) as any;
					if (Array.isArray(select) && select.length) {
						const picked: any = {};
						for (const k of select) picked[k] = out[k];
						return picked;
					}
					return out;
				},
				findMany: async ({ where, model, limit, offset }) => {
					const w = (await transformWhereClause({ where, model, action: 'findMany' })) as Where[];
					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: Math.min(500, (limit ?? 50) + (offset ?? 0))
					});
					const hits = found.filter((r) => matchesWhere(r, w));
					const sliced = hits.slice(offset ?? 0, (offset ?? 0) + (limit ?? hits.length));
					return (await Promise.all(sliced.map((r) => transformOutput(r, model)))) as any;
				},
				count: async ({ where, model }) => {
					const w = (await transformWhereClause({ where, model, action: 'count' })) as Where[];
					const found = await ddbQuery<any>({
						KeyConditionExpression: 'PK = :pk',
						ExpressionAttributeValues: { ':pk': baPk(model) },
						Limit: 500
					});
					return found.filter((r) => matchesWhere(r, w)).length;
				}
			};
		}
	});
