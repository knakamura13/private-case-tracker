import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { truncate } from '$lib/utils/format';
import { getEvidenceCategories } from '$lib/server/services/evidence.service';
import { listQuestions } from '$lib/server/services/question.service';
import { listQuickLinks } from '$lib/server/services/quickLink.service';
import { listMilestones } from '$lib/server/services/milestone.service';

const LIMIT_PER_GROUP = 6;

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user || !locals.workspace) return json({}, { status: 401 });
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return json({});

	const workspaceId = locals.workspace.id;

	const [milestones, evidenceCategories, questions, quickLinks] = await Promise.all([
		listMilestones(workspaceId, { limit: LIMIT_PER_GROUP }),
		getEvidenceCategories(workspaceId),
		listQuestions(workspaceId, { q, limit: LIMIT_PER_GROUP }),
		listQuickLinks(workspaceId).then((r) =>
			r
				.filter((l) =>
					[l.title, l.url, l.description].some((x) =>
						String(x ?? '')
							.toLowerCase()
							.includes(q.toLowerCase())
					)
				)
				.slice(0, LIMIT_PER_GROUP)
		)
	]);

	const filteredMilestones = milestones.filter((m) =>
		[m.title, m.description].some((x) => String(x ?? '').toLowerCase().includes(q.toLowerCase()))
	);

	const filteredEvidence = evidenceCategories.filter((e) =>
		e.category.toLowerCase().includes(q.toLowerCase())
	);

	return json({
		Milestones: filteredMilestones.slice(0, LIMIT_PER_GROUP).map((m) => ({
			type: 'milestone',
			id: m.id,
			title: m.title,
			description: m.description ? truncate(m.description, 80) : undefined,
			href: `/timeline/${m.id}`
		})),
		Evidence: filteredEvidence.slice(0, LIMIT_PER_GROUP).map((e) => ({
			type: 'evidence',
			id: e.category,
			title: e.category,
			description: `${e.currentCount}/${e.targetCount}`,
			href: `/evidence`
		})),
		Questions: questions.map((qItem) => ({
			type: 'question',
			id: qItem.id,
			title: qItem.question,
			description: qItem.status,
			href: `/questions/${qItem.id}`
		})),
		'Quick links': quickLinks.map((l) => ({
			type: 'quicklink',
			id: l.id,
			title: l.title ?? l.url,
			description: l.url,
			href: l.url
		}))
	});
};
