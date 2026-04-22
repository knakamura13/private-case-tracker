import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const [forms, evidence, translations, photos] = await Promise.all([
		db.formRecord.findMany({
			where: { workspaceId: workspace.id, deletedAt: null },
			include: { supportingItems: true, _count: { select: { documents: true } } },
			orderBy: { code: 'asc' }
		}),
		db.evidenceItem.findMany({
			where: { workspaceId: workspace.id, deletedAt: null, includedInPacket: true },
			orderBy: { type: 'asc' }
		}),
		db.evidenceItem.findMany({
			where: { workspaceId: workspace.id, deletedAt: null, status: 'NEEDS_TRANSLATION' }
		}),
		db.evidenceItem.findMany({
			where: { workspaceId: workspace.id, deletedAt: null, type: 'Photos' }
		})
	]);

	const readyForms = forms.filter((f) =>
		f.filingStatus === 'READY_FOR_REVIEW' || f.filingStatus === 'FILED' || f.filingStatus === 'RECEIVED'
	);

	const supportingUnsatisfied = forms
		.flatMap((f) =>
			f.supportingItems.map((s) => ({ ...s, formCode: f.code, formId: f.id }))
		)
		.filter((s) => s.required && !s.done);

	return {
		totals: {
			forms: forms.length,
			readyForms: readyForms.length,
			evidenceInPacket: evidence.length,
			translationsNeeded: translations.length,
			photos: photos.length,
			supportingOutstanding: supportingUnsatisfied.length
		},
		forms,
		evidence,
		translations,
		photos,
		supportingUnsatisfied
	};
};
