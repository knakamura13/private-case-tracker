import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listQuestions } from '$lib/server/services/question.service';
import type { QuestionSourceType, QuestionStatus } from '@prisma/client';

const STATUSES: QuestionStatus[] = ['OPEN', 'RESEARCHING', 'ANSWERED', 'WONT_FIX'];
const SOURCES: QuestionSourceType[] = [
	'ATTORNEY',
	'NONPROFIT',
	'USCIS_SITE',
	'COUNTY_SITE',
	'COMMUNITY',
	'OTHER'
];

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const statusParam = event.url.searchParams.get('status');
	const sourceParam = event.url.searchParams.get('source');
	const q = event.url.searchParams.get('q') ?? undefined;
	const items = await listQuestions(workspace.id, {
		status:
			statusParam && STATUSES.includes(statusParam as QuestionStatus)
				? (statusParam as QuestionStatus)
				: undefined,
		sourceType:
			sourceParam && SOURCES.includes(sourceParam as QuestionSourceType)
				? (sourceParam as QuestionSourceType)
				: undefined,
		q
	});

	const official = items.filter((i) =>
		['ATTORNEY', 'NONPROFIT', 'USCIS_SITE', 'COUNTY_SITE'].includes(i.sourceType)
	);
	const community = items.filter((i) => i.sourceType === 'COMMUNITY');
	const other = items.filter((i) => i.sourceType === 'OTHER');

	return { items, official, community, other };
};
