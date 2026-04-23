import { db } from '$lib/server/db';
import { addDays, startOfDay } from 'date-fns';
import { PHASE_ORDER, PHASE_LABELS } from '$lib/constants/phases';
import { currentPhase } from './milestone.service';
import { EVIDENCE_CATEGORIES, EVIDENCE_TARGETS } from '$lib/constants/categories';
import type {
	FormFilingStatus,
	MilestonePhase,
	MilestoneStatus,
	QuestionStatus
} from '@prisma/client';
import { recentActivity } from '$lib/server/activity';

export async function dashboardFor(workspaceId: string) {
	const now = new Date();
	const in30 = addDays(now, 30);

	const [
		upcomingTasks,
		overdueTasks,
		upcomingAppointments,
		formsByStatusRaw,
		evidenceAll,
		openQuestionsByPriority,
		milestonesAll,
		activity,
		docsByCategoryRaw,
		quickLinks
	] = await Promise.all([
		db.task.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				status: { notIn: ['DONE', 'ARCHIVED'] },
				dueDate: { gte: startOfDay(now), lte: in30 }
			},
			orderBy: { dueDate: 'asc' },
			take: 8,
			include: { form: { select: { id: true, code: true, name: true } } }
		}),
		db.task.count({
			where: {
				workspaceId,
				deletedAt: null,
				status: { notIn: ['DONE', 'ARCHIVED'] },
				dueDate: { lt: startOfDay(now) }
			}
		}),
		db.appointment.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				status: { notIn: ['CANCELED', 'COMPLETED', 'MISSED'] },
				scheduledAt: { gte: now }
			},
			orderBy: { scheduledAt: 'asc' },
			take: 5
		}),
		db.formRecord.groupBy({
			by: ['filingStatus'],
			where: { workspaceId, deletedAt: null },
			_count: { _all: true }
		}),
		db.evidenceItem.findMany({
			where: { workspaceId, deletedAt: null },
			select: { id: true, type: true, status: true, confidenceScore: true, includedInPacket: true }
		}),
		db.questionItem.groupBy({
			by: ['priority'],
			where: { workspaceId, deletedAt: null, status: { in: ['OPEN', 'RESEARCHING'] } },
			_count: { _all: true }
		}),
		db.timelineMilestone.findMany({
			where: { workspaceId, deletedAt: null },
			select: { phase: true, status: true, dueDate: true, id: true, title: true }
		}),
		recentActivity(workspaceId, 10),
		db.documentFile.groupBy({
			by: ['category'],
			where: { workspaceId, deletedAt: null },
			_count: { _all: true }
		}),
		db.quickLink.findMany({
			where: { workspaceId, deletedAt: null },
			orderBy: { order: 'asc' }
		})
	]);

	const formsByStatus: Record<FormFilingStatus, number> = {
		NOT_STARTED: 0,
		IN_PROGRESS: 0,
		READY_FOR_REVIEW: 0,
		FILED: 0,
		RECEIVED: 0,
		REPLACED: 0,
		NOT_NEEDED: 0
	};
	for (const r of formsByStatusRaw) formsByStatus[r.filingStatus] = r._count._all;

	const evidenceByType = new Map<string, { total: number; ready: number }>();
	for (const it of evidenceAll) {
		const b = evidenceByType.get(it.type) ?? { total: 0, ready: 0 };
		b.total += 1;
		if (it.status === 'READY') b.ready += 1;
		evidenceByType.set(it.type, b);
	}
	const evidenceCoverage = EVIDENCE_CATEGORIES.map((cat) => {
		const b = evidenceByType.get(cat) ?? { total: 0, ready: 0 };
		return {
			category: cat,
			total: b.total,
			ready: b.ready,
			target: EVIDENCE_TARGETS[cat] ?? 0
		};
	});
	const gapsCount = evidenceCoverage.filter((c) => c.total < c.target).length;

	const openQuestionsCount: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
	for (const q of openQuestionsByPriority) openQuestionsCount[q.priority] = q._count._all;

	const phase: MilestonePhase = currentPhase(milestonesAll);
	const phaseProgress = PHASE_ORDER.map((p) => {
		const items = milestonesAll.filter((m) => m.phase === p);
		if (items.length === 0) return { phase: p, label: PHASE_LABELS[p], total: 0, done: 0 };
		const done = items.filter(
			(m) => m.status === 'DONE' || m.status === ('SKIPPED' as MilestoneStatus)
		).length;
		return { phase: p, label: PHASE_LABELS[p], total: items.length, done };
	});

	const docsByCategory = docsByCategoryRaw.map((d) => ({ category: d.category, count: d._count._all }));

	// Missing critical items heuristic:
	const missingCritical: string[] = [];
	if (gapsCount > 0) missingCritical.push(`${gapsCount} evidence category gap${gapsCount === 1 ? '' : 's'}`);
	if (overdueTasks > 0) missingCritical.push(`${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'}`);
	const openHigh = (openQuestionsCount.HIGH ?? 0) + (openQuestionsCount.CRITICAL ?? 0);
	if (openHigh > 0) missingCritical.push(`${openHigh} high-priority question${openHigh === 1 ? '' : 's'}`);
	if (formsByStatus.NOT_STARTED > 0) missingCritical.push(`${formsByStatus.NOT_STARTED} form${formsByStatus.NOT_STARTED === 1 ? '' : 's'} not started`);

	const countdowns = [
		...upcomingAppointments.map((a) => ({
			label: a.title,
			date: a.scheduledAt,
			href: `/appointments/${a.id}`,
			kind: 'appointment' as const
		})),
		...milestonesAll
			.filter((m) => m.dueDate && m.dueDate >= now && m.status !== 'DONE' && m.status !== ('SKIPPED' as MilestoneStatus))
			.sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
			.slice(0, 3)
			.map((m) => ({ label: m.title, date: m.dueDate!, href: `/timeline#${m.id}`, kind: 'milestone' as const }))
	]
		.sort((a, b) => a.date.getTime() - b.date.getTime())
		.slice(0, 5);

	return {
		upcomingTasks,
		overdueTasks,
		upcomingAppointments,
		formsByStatus,
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
		quickLinks
	};
}

export type DashboardData = Awaited<ReturnType<typeof dashboardFor>>;
