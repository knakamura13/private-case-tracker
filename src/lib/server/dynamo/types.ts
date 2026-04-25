export type DynamoBaseItem = {
	PK: string;
	SK: string;
	// Optional secondary index for user-centric lookups (membership, sessions, etc.)
	GSI1PK?: string;
	GSI1SK?: string;
	// GSI2: Email-based lookups for Better Auth (user by email, account by email)
	GSI2PK?: string;
	GSI2SK?: string;
	// GSI3: Token-based lookups for Better Auth (session by token, verification by token)
	GSI3PK?: string;
	GSI3SK?: string;
	// Soft-delete marker used across entities
	deletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
};

// Entity-specific types to replace `any` in service layer
export type TaskItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	title: string;
	description: string | null;
	dueDate: string | null;
	priority: string;
	status: string; // Stored as string, validated as TaskStatus at service layer
	ownerId: string | null;
	linkedFormId: string | null;
	linkedEvidenceId: string | null;
	linkedMilestoneId: string | null;
	order: number;
	checklist?: Array<{ id: string; taskId: string; text: string; done: boolean; order: number }>;
	attachments?: unknown[];
	tags?: unknown[];
};

export type FormItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	name: string;
	code: string;
	purpose: string | null;
	filingStatus: string; // Stored as string, validated as FormFilingStatus at service layer
	plannedFilingDate: string | null;
	actualFilingDate: string | null;
	receiptNumberEncrypted: string | null;
	notes: string | null;
	lastUpdatedByUserId: string | null;
	supportingItems: Array<{
		id: string;
		formId: string;
		label: string;
		required: boolean;
		done: boolean;
		satisfiedByEvidenceId: string | null;
		satisfiedByFileId: string | null;
		order: number;
	}>;
};

export type EvidenceItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	title: string;
	type: string;
	status: string; // Stored as string, validated as EvidenceStatus at service layer
	description: string | null;
	significance: string | null;
	dateStart: string | null;
	dateEnd: string | null;
	dateCollected: string | null;
	source: string | null;
	peopleInvolved: string[];
	confidenceScore: number;
	includedInPacket: boolean;
	notes: string | null;
	files?: Array<{ id: string; file: string | null; title: string }>;
	tasks: Array<{ id: string; title: string }>;
	supportingFor: Array<{ id: string; title: string }>;
	linkedNotes: Array<{ id: string; title: string }>;
};

export type QuestionItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	question: string;
	answer: string | null;
	status: string; // Stored as string, validated as QuestionStatus at service layer
	priority: string;
	sourceType: string; // Stored as string, validated as QuestionSourceType at service layer
	source: string | null;
	category: string | null;
	citationUrl: string | null;
	answeredAt: string | null;
	relatedFormId: string | null;
	relatedEvidenceId: string | null;
	relatedTaskId: string | null;
	relatedForm: { id: string } | null;
	relatedEvidence: { id: string } | null;
};

export type NoteItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	title: string;
	bodyMd: string;
	authorId: string | null;
	author: { id: string; name: string | null; email: string } | null;
	linkedTaskId: string | null;
	linkedFormId: string | null;
	linkedEvidenceId: string | null;
};

export type DocumentFileItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	title: string;
	category: string;
	notes: string | null;
	uploadedByUserId: string | null;
	uploadedBy: { id: string; name: string | null; email: string } | null;
	linkedFormId: string | null;
	linkedEvidenceId: string | null;
	linkedTaskId: string | null;
	form: { id: string; code: string; name: string } | null;
	evidence: { id: string; title: string } | null;
	task: { id: string; title: string } | null;
	file: string | null;
	sizeBytes: number | null;
	mimeType: string | null;
	storageMode: string | null;
	externalUrl: string | null;
	versions: Array<{ id: string; title: string; createdAt: string }>;
};

export type MilestoneItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	title: string;
	description: string | null;
	phase: string; // Stored as string, validated as MilestonePhase at service layer
	status: string; // Stored as string, validated as MilestoneStatus at service layer
	priority: string;
	dueDate: string;
	scheduledAt: string | null;
	order: number;
	ownerId: string | null;
	owner: { id: string; name: string | null; email: string } | null;
	subTasks?: Array<{ id: string; text: string; done: boolean }>;
};

export type QuickLinkItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	url: string;
	title: string | null;
	description: string | null;
	notes: string | null;
	folderId: string | null;
	order: number;
};

export type QuickLinkFolderItem = DynamoBaseItem & {
	id: string;
	workspaceId: string;
	name: string | null;
	order: number;
};
