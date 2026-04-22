export const EVIDENCE_CATEGORIES = [
	'Joint lease',
	'Joint bank',
	'Insurance',
	'Photos',
	'Affidavit',
	'Travel',
	'Tax',
	'Utility',
	'Marriage certificate',
	'Translation',
	'Identity',
	'Medical',
	'Correspondence',
	'Other'
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export const DOCUMENT_CATEGORIES = [
	'Form',
	'Supporting evidence',
	'Correspondence',
	'Receipt notice',
	'Translation',
	'Identity',
	'Medical',
	'Financial',
	'Photo',
	'Other'
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const QUESTION_CATEGORIES = [
	'Eligibility',
	'Forms',
	'Evidence',
	'Fees',
	'Interview',
	'Timeline',
	'Travel',
	'Employment',
	'Other'
] as const;

// Minimum "healthy" counts used for the evidence-gaps heuristic.
// These are guidance only, not legal requirements.
export const EVIDENCE_TARGETS: Partial<Record<EvidenceCategory, number>> = {
	'Joint lease': 1,
	'Joint bank': 2,
	Insurance: 1,
	Photos: 5,
	Affidavit: 2,
	Travel: 2,
	Tax: 1,
	Utility: 2,
	'Marriage certificate': 1,
	Identity: 2
};
