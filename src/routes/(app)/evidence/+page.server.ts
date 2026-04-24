import type { PageServerLoad, Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listEvidence } from '$lib/server/services/evidence.service';
import type { EvidenceStatus } from '$lib/types/enums';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';
import { fail } from '@sveltejs/kit';
import { ddbGet, ddbPut } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';

const STATUSES: EvidenceStatus[] = [
	'COLLECTED',
	'NEEDS_SCAN',
	'NEEDS_TRANSLATION',
	'NEEDS_BETTER_COPY',
	'READY'
];

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const statusParam = event.url.searchParams.get('status');
	const typeParam = event.url.searchParams.get('type') ?? undefined;
	const q = event.url.searchParams.get('q') ?? undefined;
	const items = await listEvidence(workspace.id, {
		status:
			statusParam && STATUSES.includes(statusParam as EvidenceStatus)
				? (statusParam as EvidenceStatus)
				: undefined,
		type: typeParam,
		q
	});

	// Fetch workspace to get stored evidence target overrides
	const ws = await ddbGet<Record<string, unknown>>({ PK: wsPk(workspace.id), SK: entitySk('Workspace', workspace.id) });
	const storedTargets = (ws?.evidenceTargets as Record<string, number> | null) ?? {};
	const effectiveTargets: Record<string, number> = { ...EVIDENCE_TARGETS, ...storedTargets };

	// compute gap summary from the full set (unfiltered)
	const all = await listEvidence(workspace.id);
	const counts = new Map<string, { total: number; ready: number }>();
	for (const it of all) {
		const c = counts.get(it.type) ?? { total: 0, ready: 0 };
		c.total += 1;
		if (it.status === 'READY') c.ready += 1;
		counts.set(it.type, c);
	}
	const gaps = EVIDENCE_CATEGORIES.filter(
		(cat) => (counts.get(cat)?.total ?? 0) < (effectiveTargets[cat] ?? 0)
	).map((cat) => ({
		category: cat,
		have: counts.get(cat)?.total ?? 0,
		target: effectiveTargets[cat] ?? 0
	}));

	return { items, gaps, categories: EVIDENCE_CATEGORIES, effectiveTargets };
};

export const actions: Actions = {
	updateTarget: async (event) => {
		const { workspace } = requireWorkspace(event);
		const formData = await event.request.formData();
		const category = formData.get('category') as string;
		const raw = formData.get('target') as string;
		const target = parseInt(raw, 10);

		if (!category || isNaN(target) || target < 0) {
			return fail(400, { error: 'Invalid input' });
		}

		const ws = await ddbGet<Record<string, unknown>>({
			PK: wsPk(workspace.id),
			SK: entitySk('Workspace', workspace.id)
		});
		const current = (ws?.evidenceTargets as Record<string, number> | null) ?? {};
		const updated = { ...current, [category]: target };

		// naive overwrite of workspace item (only mutates evidenceTargets)
		await ddbPut({
			...(ws ?? { id: workspace.id, name: workspace.name, ownerId: null }),
			PK: wsPk(workspace.id),
			SK: entitySk('Workspace', workspace.id),
			evidenceTargets: updated,
			updatedAt: new Date().toISOString()
		});

		return {};
	}
};
