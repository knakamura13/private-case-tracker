import { PHASE_ORDER, PHASE_LABELS } from '$lib/constants/phases';
import { currentPhase } from './milestone.service';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';
import type {
	MilestonePhase,
	MilestoneStatus,
	QuestionStatus
} from '$lib/types/enums';
import { recentActivity } from '$lib/server/activity';
import { listEvidence } from './evidence.service';
import { listQuestions } from './question.service';
import { listMilestones } from './milestone.service';
import { listDocuments } from './document.service';
import { listQuickLinks } from './quickLink.service';
import { listQuickLinkFolders } from './quickLinkFolder.service';

export async function dashboardFor(workspaceId: string) {
	const now = new Date();

	const [
		evidenceAll,
		openQuestionsAll,
		milestonesAll,
		activity,
		docsAll,
		quickLinks,
		quickLinkFolders
	] = await Promise.all([
		listEvidence(workspaceId),
		listQuestions(workspaceId, { status: 'OPEN' as QuestionStatus }).then(async (rows) =>
			rows.concat(await listQuestions(workspaceId, { status: 'RESEARCHING' as QuestionStatus }))
		),
		listMilestones(workspaceId),
		recentActivity(workspaceId, 10),
		listDocuments(workspaceId),
		listQuickLinks(workspaceId),
		listQuickLinkFolders(workspaceId)
	]);

	const upcomingMeetings = milestonesAll
		.filter((m) => m.scheduledAt && new Date(m.scheduledAt) >= now)
		.sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
		.slice(0, 5);

	const evidenceByCategory = new Map<string, { total: number }>();
	for (const it of evidenceAll) {
		const b = evidenceByCategory.get(it.category) ?? { total: 0 };
		b.total += it.currentCount;
		evidenceByCategory.set(it.category, b);
	}
	const evidenceCoverage = EVIDENCE_CATEGORIES.map((cat) => {
		const b = evidenceByCategory.get(cat) ?? { total: 0 };
		return {
			category: cat,
			total: b.total,
			ready: b.total,
			target: EVIDENCE_TARGETS[cat] ?? 0
		};
	});
	const gapsCount = evidenceCoverage.filter((c) => c.total < c.target).length;

	const openQuestionsCount: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
	for (const q of await openQuestionsAll) {
		openQuestionsCount[q.priority] = (openQuestionsCount[q.priority] ?? 0) + 1;
	}

	const phase: MilestonePhase = currentPhase(
		milestonesAll.map((m) => ({
			phase: m.phase as MilestonePhase,
			status: m.status as MilestoneStatus
		}))
	);
	const phaseProgress = PHASE_ORDER.map((p) => {
		const items = milestonesAll.filter((m) => m.phase === p);
		if (items.length === 0) return { phase: p, label: PHASE_LABELS[p], total: 0, done: 0 };
		const done = items.filter(
			(m) => m.status === 'DONE' || m.status === ('SKIPPED' as MilestoneStatus)
		).length;
		return { phase: p, label: PHASE_LABELS[p], total: items.length, done };
	});

	const docsByCategory = Object.entries(
		docsAll.reduce((acc: Record<string, number>, d: { category: string }) => {
			acc[d.category] = (acc[d.category] ?? 0) + 1;
			return acc;
		}, {})
	).map(([category, count]) => ({ category, count }));

	// Missing critical items heuristic:
	const missingCritical: string[] = [];
	if (gapsCount > 0)
		missingCritical.push(`${gapsCount} evidence category gap${gapsCount === 1 ? '' : 's'}`);
	const openHigh = (openQuestionsCount.HIGH ?? 0) + (openQuestionsCount.CRITICAL ?? 0);
	if (openHigh > 0)
		missingCritical.push(`${openHigh} high-priority question${openHigh === 1 ? '' : 's'}`);

	const countdowns = [
		...upcomingMeetings.map((m) => ({
			label: m.title,
			date: m.scheduledAt!,
			href: `/timeline#${m.id}`,
			kind: 'meeting' as const
		})),
		...milestonesAll
			.filter(
				(m) =>
					m.dueDate &&
					new Date(m.dueDate) >= now &&
					m.status !== 'DONE' &&
					m.status !== ('SKIPPED' as MilestoneStatus)
			)
			.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
			.slice(0, 3)
			.map((m) => ({
				label: m.title,
				date: m.dueDate!,
				href: `/timeline#${m.id}`,
				kind: 'milestone' as const
			}))
	]
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		.slice(0, 5);

	return {
		upcomingMeetings,
		evidenceCoverage,
		gapsCount,
		openQuestionsCount,
		phase,
		phaseLabel: PHASE_LABELS[phase],
		phaseProgress,
		activity,
		docsByCategory,
		missingCritical,
		countdowns,
		quickLinks: quickLinks,
		quickLinkFolders: quickLinkFolders
	};
}

export type DashboardData = Awaited<ReturnType<typeof dashboardFor>>;
