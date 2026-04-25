import type { PageServerLoad, Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listEvidence, incrementEvidenceCount } from '$lib/server/services/evidence.service';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';
import { fail } from '@sveltejs/kit';
import { ddbGet, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const items = await listEvidence(workspace.id);

	// Fetch workspace to get stored evidence target overrides
	const ws = await ddbGet<Record<string, unknown>>({ PK: wsPk(workspace.id), SK: entitySk('Workspace', workspace.id) });
	const storedTargets = (ws?.evidenceTargets as Record<string, number> | null) ?? {};
	const effectiveTargets: Record<string, number> = { ...EVIDENCE_TARGETS, ...storedTargets };

	// Build category counts from evidence items
	const counts = new Map<string, number>();
	for (const it of items) {
		counts.set(it.category, (counts.get(it.category) ?? 0) + it.currentCount);
	}

	// Ensure all categories have an entry
	const categories = EVIDENCE_CATEGORIES.map((cat) => ({
		category: cat,
		currentCount: counts.get(cat) ?? 0,
		targetCount: effectiveTargets[cat] ?? 0
	}));

	return { categories, effectiveTargets };
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

		// Validate category
		if (!EVIDENCE_CATEGORIES.includes(category as any)) {
			return fail(400, { error: 'Invalid category' });
		}

		// Use ddbUpdate to only modify evidenceTargets and updatedAt
		await ddbUpdate(
			{ PK: wsPk(workspace.id), SK: entitySk('Workspace', workspace.id) },
			'SET #evidenceTargets.#category = :t, #updatedAt = :u',
			{ ':t': target, ':u': new Date().toISOString() },
			{ '#evidenceTargets': 'evidenceTargets', '#category': category, '#updatedAt': 'updatedAt' }
		);

		return {};
	},
	adjustCount: async (event) => {
		const { workspace, user } = requireWorkspace(event);
		const formData = await event.request.formData();
		const category = formData.get('category') as string;
		const delta = parseInt(formData.get('delta') as string);

		if (!category || isNaN(delta) || delta === 0) {
			return fail(400, { error: 'Invalid input' });
		}

		// Validate category is a known evidence category
		if (!EVIDENCE_CATEGORIES.includes(category as any)) {
			return fail(400, { error: 'Invalid category' });
		}

		// Limit delta to prevent abuse
		if (Math.abs(delta) > 100) {
			return fail(400, { error: 'Delta too large' });
		}

		await incrementEvidenceCount(workspace.id, user.id, category, delta);

		return {};
	}
};
