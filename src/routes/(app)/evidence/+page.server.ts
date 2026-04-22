import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listEvidence } from '$lib/server/services/evidence.service';
import type { EvidenceStatus } from '@prisma/client';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';

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

	// compute gap summary from the full set (unfiltered)
	const all = await listEvidence(workspace.id);
	const counts = new Map<string, { total: number; ready: number }>();
	for (const it of all) {
		const c = counts.get(it.type) ?? { total: 0, ready: 0 };
		c.total += 1;
		if (it.status === 'READY') c.ready += 1;
		counts.set(it.type, c);
	}
	const gaps = EVIDENCE_CATEGORIES.filter((cat) => (counts.get(cat)?.total ?? 0) < (EVIDENCE_TARGETS[cat] ?? 0)).map(
		(cat) => ({
			category: cat,
			have: counts.get(cat)?.total ?? 0,
			target: EVIDENCE_TARGETS[cat] ?? 0
		})
	);

	return { items, gaps, categories: EVIDENCE_CATEGORIES };
};
