export type DynamoBaseItem = {
	PK: string;
	SK: string;
	// Optional secondary index for user-centric lookups (membership, sessions, etc.)
	GSI1PK?: string;
	GSI1SK?: string;
	// Soft-delete marker used across entities
	deletedAt?: string | null;
	createdAt?: string;
	updatedAt?: string;
};
