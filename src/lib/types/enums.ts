// Shared type definitions used throughout the application for type safety
// Using const string unions instead of enums for better string literal compatibility

export type MemberRole = 'OWNER' | 'COLLABORATOR';

export type TagScope = 'TASK' | 'EVIDENCE' | 'NOTE' | 'DOCUMENT' | 'QUESTION';

export type MilestonePhase =
	| 'PREPARATION'
	| 'RELATIONSHIP_EVIDENCE'
	| 'MARRIAGE_LICENSE'
	| 'PACKET_DRAFTING'
	| 'FILING'
	| 'RECEIPT_NOTICES'
	| 'BIOMETRICS'
	| 'INTERVIEW_PREP'
	| 'POST_INTERVIEW'
	| 'OUTCOME';

export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'SKIPPED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'ARCHIVED';

export type FormFilingStatus =
	| 'NOT_STARTED'
	| 'IN_PROGRESS'
	| 'READY_FOR_REVIEW'
	| 'FILED'
	| 'RECEIVED'
	| 'REPLACED'
	| 'NOT_NEEDED';

export type EvidenceStatus =
	| 'COLLECTED'
	| 'NEEDS_SCAN'
	| 'NEEDS_TRANSLATION'
	| 'NEEDS_BETTER_COPY'
	| 'READY';

export type FileStorageMode = 'UPLOADED' | 'EXTERNAL_LINK';

export type FileStatus = 'PENDING' | 'READY' | 'FAILED';

export type AppointmentType =
	| 'CIVIL_MARRIAGE'
	| 'BIOMETRICS'
	| 'ATTORNEY_CONSULT'
	| 'MEDICAL_EXAM'
	| 'INTERVIEW'
	| 'TRANSLATION_OR_NOTARY'
	| 'DOCUMENT_PICKUP'
	| 'OTHER';

export type AppointmentStatus =
	| 'SCHEDULED'
	| 'CONFIRMED'
	| 'COMPLETED'
	| 'CANCELED'
	| 'RESCHEDULED'
	| 'MISSED';

export type QuestionStatus = 'OPEN' | 'RESEARCHING' | 'ANSWERED' | 'WONT_FIX';

export type QuestionSourceType =
	| 'ATTORNEY'
	| 'NONPROFIT'
	| 'USCIS_SITE'
	| 'COUNTY_SITE'
	| 'COMMUNITY'
	| 'OTHER';

export type ActivityAction =
	| 'LOGIN'
	| 'LOGOUT'
	| 'USER_INVITED'
	| 'INVITATION_ACCEPTED'
	| 'WORKSPACE_UPDATED'
	| 'TASK_CREATED'
	| 'TASK_UPDATED'
	| 'TASK_DELETED'
	| 'STATUS_CHANGE'
	| 'FORM_CREATED'
	| 'FORM_UPDATED'
	| 'FORM_DELETED'
	| 'EVIDENCE_CREATED'
	| 'EVIDENCE_UPDATED'
	| 'EVIDENCE_DELETED'
	| 'FILE_UPLOAD'
	| 'FILE_DELETE'
	| 'FILE_LINK_ADDED'
	| 'APPOINTMENT_CREATED'
	| 'APPOINTMENT_UPDATED'
	| 'APPOINTMENT_DELETED'
	| 'QUESTION_CREATED'
	| 'QUESTION_UPDATED'
	| 'QUESTION_DELETED'
	| 'NOTE_CREATED'
	| 'NOTE_EDIT'
	| 'NOTE_DELETED'
	| 'MILESTONE_CREATED'
	| 'MILESTONE_UPDATED'
	| 'MILESTONE_DELETED'
	| 'DEMO_DATA_REMOVED'
	| 'QUICK_LINK_CREATED'
	| 'QUICK_LINK_UPDATED'
	| 'QUICK_LINK_DELETED'
	| 'QUICK_LINK_FOLDER_CREATED'
	| 'QUICK_LINK_FOLDER_UPDATED'
	| 'QUICK_LINK_FOLDER_DELETED'
	| 'QUICK_LINK_MOVED_TO_FOLDER'
	| 'QUICK_LINK_REORDERED'
	| 'QUICK_LINK_FOLDER_REORDERED';

export type ErrorSource = 'SERVER' | 'CLIENT' | 'ACTION' | 'API';

// Type definitions for JSON values
export type InputJsonValue = string | number | boolean | null | { [key: string]: InputJsonValue | undefined } | InputJsonValue[];

// Model type definitions (minimal, for type compatibility)
export type DocumentFile = {
	id: string;
	workspaceId: string;
	title: string;
	category: string;
	storageMode: 'UPLOADED' | 'EXTERNAL_LINK';
	status: FileStatus;
	mimeType?: string | null;
	sizeBytes?: number | null;
	storageKey?: string | null;
	externalUrl?: string | null;
	uploadedByUserId?: string | null;
	versionOfId?: string | null;
	linkedTaskId?: string | null;
	linkedFormId?: string | null;
	linkedEvidenceId?: string | null;
	linkedAppointmentId?: string | null;
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
};

export type QuickLink = {
	id: string;
	workspaceId: string;
	url: string;
	title?: string | null;
	description?: string | null;
	notes?: string | null;
	folderId?: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
};

export type QuickLinkFolder = {
	id: string;
	workspaceId: string;
	name?: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
};
