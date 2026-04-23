import type { MilestonePhase } from '$lib/types/enums';

export const PHASE_ORDER: MilestonePhase[] = [
	'PREPARATION',
	'RELATIONSHIP_EVIDENCE',
	'MARRIAGE_LICENSE',
	'PACKET_DRAFTING',
	'FILING',
	'RECEIPT_NOTICES',
	'BIOMETRICS',
	'INTERVIEW_PREP',
	'POST_INTERVIEW',
	'OUTCOME'
];

export const PHASE_LABELS: Record<MilestonePhase, string> = {
	PREPARATION: 'Preparation',
	RELATIONSHIP_EVIDENCE: 'Relationship evidence',
	MARRIAGE_LICENSE: 'Marriage license / ceremony',
	PACKET_DRAFTING: 'Packet drafting',
	FILING: 'Filing',
	RECEIPT_NOTICES: 'Receipt notices',
	BIOMETRICS: 'Biometrics',
	INTERVIEW_PREP: 'Interview preparation',
	POST_INTERVIEW: 'Post-interview / waiting',
	OUTCOME: 'Final outcome'
};

export const PHASE_DESCRIPTIONS: Record<MilestonePhase, string> = {
	PREPARATION: 'Initial orientation, research, attorney consults.',
	RELATIONSHIP_EVIDENCE: 'Gathering joint documents, photos, affidavits, and other relationship evidence.',
	MARRIAGE_LICENSE: 'County license, ceremony, and certified marriage certificate.',
	PACKET_DRAFTING: 'Drafting and reviewing forms and supporting packets.',
	FILING: 'Packaging, mailing or submitting filings.',
	RECEIPT_NOTICES: 'Tracking receipt notices and case numbers.',
	BIOMETRICS: 'Scheduling and attending biometrics.',
	INTERVIEW_PREP: 'Preparing for interview day.',
	POST_INTERVIEW: 'Waiting for outcome, follow-ups.',
	OUTCOME: 'Decision received and next steps.'
};
