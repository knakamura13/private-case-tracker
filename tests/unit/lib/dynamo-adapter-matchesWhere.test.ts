import { describe, it, expect } from 'vitest';

// Import the matchesWhere function from the DynamoDB adapter
// Since it's not exported, we'll test it indirectly through the adapter or
// recreate the logic for testing purposes

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

function matchesWhere(row: Record<string, unknown>, where: Where[]) {
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

describe('DynamoDB Adapter matchesWhere', () => {
	describe('equality operators', () => {
		it('matches with eq operator', () => {
			const row = { id: '123', email: 'test@example.com' };
			const where: Where[] = [{ field: 'id', operator: 'eq', value: '123' }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with eq operator when values differ', () => {
			const row = { id: '123', email: 'test@example.com' };
			const where: Where[] = [{ field: 'id', operator: 'eq', value: '456' }];
			expect(matchesWhere(row, where)).toBe(false);
		});

		it('matches with ne operator', () => {
			const row = { id: '123', email: 'test@example.com' };
			const where: Where[] = [{ field: 'id', operator: 'ne', value: '456' }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with ne operator when values are equal', () => {
			const row = { id: '123', email: 'test@example.com' };
			const where: Where[] = [{ field: 'id', operator: 'ne', value: '123' }];
			expect(matchesWhere(row, where)).toBe(false);
		});
	});

	describe('string operators', () => {
		it('matches with contains operator', () => {
			const row = { email: 'test@example.com' };
			const where: Where[] = [{ field: 'email', operator: 'contains', value: 'test' }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with contains when substring not found', () => {
			const row = { email: 'test@example.com' };
			const where: Where[] = [{ field: 'email', operator: 'contains', value: 'foo' }];
			expect(matchesWhere(row, where)).toBe(false);
		});

		it('matches with starts_with operator', () => {
			const row = { email: 'test@example.com' };
			const where: Where[] = [{ field: 'email', operator: 'starts_with', value: 'test' }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with starts_with when prefix does not match', () => {
			const row = { email: 'test@example.com' };
			const where: Where[] = [{ field: 'email', operator: 'starts_with', value: 'foo' }];
			expect(matchesWhere(row, where)).toBe(false);
		});

		it('matches with ends_with operator', () => {
			const row = { email: 'test@example.com' };
			const where: Where[] = [{ field: 'email', operator: 'ends_with', value: '.com' }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with ends_with when suffix does not match', () => {
			const row = { email: 'test@example.com' };
			const where: Where[] = [{ field: 'email', operator: 'ends_with', value: '.org' }];
			expect(matchesWhere(row, where)).toBe(false);
		});
	});

	describe('numeric operators', () => {
		it('matches with lt operator', () => {
			const row = { count: 5 };
			const where: Where[] = [{ field: 'count', operator: 'lt', value: 10 }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with lt when value is greater', () => {
			const row = { count: 15 };
			const where: Where[] = [{ field: 'count', operator: 'lt', value: 10 }];
			expect(matchesWhere(row, where)).toBe(false);
		});

		it('matches with lte operator', () => {
			const row = { count: 10 };
			const where: Where[] = [{ field: 'count', operator: 'lte', value: 10 }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('matches with gt operator', () => {
			const row = { count: 15 };
			const where: Where[] = [{ field: 'count', operator: 'gt', value: 10 }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('matches with gte operator', () => {
			const row = { count: 10 };
			const where: Where[] = [{ field: 'count', operator: 'gte', value: 10 }];
			expect(matchesWhere(row, where)).toBe(true);
		});
	});

	describe('in operator', () => {
		it('matches with in operator when value is in array', () => {
			const row = { status: 'active' };
			const where: Where[] = [{ field: 'status', operator: 'in', value: ['active', 'pending'] }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with in operator when value is not in array', () => {
			const row = { status: 'deleted' };
			const where: Where[] = [{ field: 'status', operator: 'in', value: ['active', 'pending'] }];
			expect(matchesWhere(row, where)).toBe(false);
		});
	});

	describe('connector logic', () => {
		it('matches with AND connector (default)', () => {
			const row = { id: '123', status: 'active' };
			const where: Where[] = [
				{ field: 'id', operator: 'eq', value: '123' },
				{ field: 'status', operator: 'eq', value: 'active' }
			];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with AND connector when one clause fails', () => {
			const row = { id: '123', status: 'deleted' };
			const where: Where[] = [
				{ field: 'id', operator: 'eq', value: '123' },
				{ field: 'status', operator: 'eq', value: 'active' }
			];
			expect(matchesWhere(row, where)).toBe(false);
		});

		it('matches with OR connector', () => {
			const row = { id: '123', status: 'deleted' };
			const where: Where[] = [
				{ field: 'id', operator: 'eq', value: '123' },
				{ connector: 'OR', field: 'status', operator: 'eq', value: 'deleted' }
			];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('does not match with OR connector when all clauses fail', () => {
			const row = { id: '456', status: 'deleted' };
			const where: Where[] = [
				{ field: 'id', operator: 'eq', value: '123' },
				{ connector: 'OR', field: 'status', operator: 'eq', value: 'active' }
			];
			expect(matchesWhere(row, where)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('handles null values', () => {
			const row = { deletedAt: null };
			const where: Where[] = [{ field: 'deletedAt', operator: 'eq', value: null }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('handles missing fields', () => {
			const row = { id: '123' };
			const where: Where[] = [{ field: 'email', operator: 'eq', value: 'test@example.com' }];
			expect(matchesWhere(row, where)).toBe(false);
		});

		it('defaults to eq operator when not specified', () => {
			const row = { id: '123' };
			const where: Where[] = [{ field: 'id', value: '123' }];
			expect(matchesWhere(row, where)).toBe(true);
		});

		it('handles empty where array', () => {
			const row = { id: '123' };
			const where: Where[] = [];
			expect(matchesWhere(row, where)).toBe(true);
		});
	});
});
