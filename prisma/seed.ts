import { PrismaClient, MemberRole } from '@prisma/client';
import { addDays, subDays, addMonths, subMonths } from 'date-fns';

const db = new PrismaClient();
const PFX = '[Demo] ';

async function main() {
	const existing = await db.workspace.findFirst({ where: { name: 'Demo Case' } });
	if (existing) {
		console.log('Demo workspace already exists. Skipping seed.');
		return;
	}

	const owner = await db.user.upsert({
		where: { email: 'demo-owner@example.com' },
		create: {
			id: 'demo-owner',
			email: 'demo-owner@example.com',
			emailVerified: true,
			name: 'Avery Demo'
		},
		update: {}
	});
	const collab = await db.user.upsert({
		where: { email: 'demo-partner@example.com' },
		create: {
			id: 'demo-partner',
			email: 'demo-partner@example.com',
			emailVerified: true,
			name: 'Jordan Demo'
		},
		update: {}
	});

	const ws = await db.workspace.create({
		data: { name: 'Demo Case', ownerId: owner.id }
	});

	await db.membership.createMany({
		data: [
			{
				workspaceId: ws.id,
				userId: owner.id,
				role: MemberRole.OWNER,
				acceptedAt: new Date()
			},
			{
				workspaceId: ws.id,
				userId: collab.id,
				role: MemberRole.COLLABORATOR,
				acceptedAt: new Date()
			}
		]
	});

	const now = new Date();

	// Milestones across phases
	await db.timelineMilestone.createMany({
		data: [
			{
				workspaceId: ws.id,
				phase: 'PREPARATION',
				title: `${PFX}Initial attorney consult`,
				dueDate: subDays(now, 30),
				status: 'DONE',
				priority: 'MEDIUM',
				order: 0,
				completedAt: subDays(now, 28)
			},
			{
				workspaceId: ws.id,
				phase: 'RELATIONSHIP_EVIDENCE',
				title: `${PFX}Compile joint financials packet`,
				dueDate: addDays(now, 14),
				status: 'IN_PROGRESS',
				priority: 'HIGH',
				order: 0
			},
			{
				workspaceId: ws.id,
				phase: 'MARRIAGE_LICENSE',
				title: `${PFX}Pick up certified marriage certificate`,
				dueDate: addDays(now, 30),
				status: 'PLANNED',
				priority: 'HIGH',
				order: 0
			},
			{
				workspaceId: ws.id,
				phase: 'PACKET_DRAFTING',
				title: `${PFX}Final packet review with attorney`,
				dueDate: addDays(now, 60),
				status: 'PLANNED',
				priority: 'CRITICAL',
				order: 0
			},
			{
				workspaceId: ws.id,
				phase: 'FILING',
				title: `${PFX}Mail packet`,
				dueDate: addDays(now, 75),
				status: 'PLANNED',
				priority: 'CRITICAL',
				order: 0
			}
		]
	});

	// Forms
	const i130 = await db.formRecord.create({
		data: {
			workspaceId: ws.id,
			name: `${PFX}Petition for Alien Relative`,
			code: 'I-130',
			purpose: 'Establish the relationship between the petitioner and beneficiary.',
			filingStatus: 'IN_PROGRESS',
			plannedFilingDate: addDays(now, 75),
			notes: 'Sample only. Verify current version of the form on the official website.',
			lastUpdatedByUserId: owner.id
		}
	});
	await db.formSupportingItem.createMany({
		data: [
			{ formId: i130.id, label: 'Marriage certificate (certified copy)', required: true, done: false, order: 0 },
			{ formId: i130.id, label: 'Joint lease', required: true, done: true, order: 1 },
			{ formId: i130.id, label: 'Joint bank statements (last 6 months)', required: true, done: false, order: 2 },
			{ formId: i130.id, label: 'Photos together with dates', required: true, done: true, order: 3 },
			{ formId: i130.id, label: 'Affidavits from family/friends (2)', required: true, done: false, order: 4 }
		]
	});

	await db.formRecord.create({
		data: {
			workspaceId: ws.id,
			name: `${PFX}Application to Adjust Status`,
			code: 'I-485',
			purpose: 'Apply for adjustment of status to permanent resident.',
			filingStatus: 'NOT_STARTED',
			plannedFilingDate: addDays(now, 75),
			lastUpdatedByUserId: owner.id
		}
	});

	await db.formRecord.create({
		data: {
			workspaceId: ws.id,
			name: `${PFX}Application for Travel Document`,
			code: 'I-131',
			purpose: 'Request advance parole while I-485 is pending.',
			filingStatus: 'NOT_STARTED',
			lastUpdatedByUserId: owner.id
		}
	});

	// Evidence
	await db.evidenceItem.createMany({
		data: [
			{
				workspaceId: ws.id,
				title: `${PFX}Joint apartment lease`,
				type: 'Joint lease',
				dateStart: subMonths(now, 8),
				dateEnd: addMonths(now, 4),
				peopleInvolved: ['Avery Demo', 'Jordan Demo'],
				description: '12-month lease, both names listed.',
				significance: 'Cohabitation evidence',
				status: 'READY',
				confidenceScore: 5,
				includedInPacket: true
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Joint bank account statements`,
				type: 'Joint bank',
				dateStart: subMonths(now, 6),
				peopleInvolved: ['Avery Demo', 'Jordan Demo'],
				description: 'Last 6 statements from joint checking.',
				significance: 'Commingled finances',
				status: 'COLLECTED',
				confidenceScore: 4,
				includedInPacket: false
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Wedding photos (ceremony day)`,
				type: 'Photos',
				dateStart: subMonths(now, 2),
				peopleInvolved: ['Avery Demo', 'Jordan Demo'],
				description: '~50 photos with timestamps.',
				significance: 'Ceremony evidence',
				status: 'READY',
				confidenceScore: 5,
				includedInPacket: true
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Family event photos`,
				type: 'Photos',
				dateStart: subMonths(now, 12),
				dateEnd: subMonths(now, 1),
				peopleInvolved: ['Avery Demo', 'Jordan Demo', 'Family'],
				status: 'COLLECTED',
				confidenceScore: 4,
				includedInPacket: false
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Health insurance — joint policy`,
				type: 'Insurance',
				dateStart: subMonths(now, 4),
				peopleInvolved: ['Avery Demo', 'Jordan Demo'],
				significance: 'Both listed on plan.',
				status: 'READY',
				confidenceScore: 4,
				includedInPacket: true
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Affidavit from Sam Friend`,
				type: 'Affidavit',
				peopleInvolved: ['Sam Friend'],
				status: 'NEEDS_SCAN',
				confidenceScore: 3
			}
		]
	});

	// Appointments
	await db.appointment.createMany({
		data: [
			{
				workspaceId: ws.id,
				title: `${PFX}County clerk — marriage license`,
				type: 'CIVIL_MARRIAGE',
				scheduledAt: subDays(now, 60),
				durationMin: 30,
				location: 'County Clerk, Room 204',
				attendees: ['Avery Demo', 'Jordan Demo'],
				status: 'COMPLETED'
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Attorney intake call`,
				type: 'ATTORNEY_CONSULT',
				scheduledAt: addDays(now, 7),
				durationMin: 60,
				location: 'Phone',
				attendees: ['Avery Demo', 'Jordan Demo'],
				status: 'CONFIRMED'
			},
			{
				workspaceId: ws.id,
				title: `${PFX}Biometrics appointment`,
				type: 'BIOMETRICS',
				scheduledAt: addDays(now, 90),
				durationMin: 60,
				location: 'USCIS ASC',
				attendees: ['Jordan Demo'],
				status: 'SCHEDULED'
			}
		]
	});

	// Tasks
	const lease = await db.evidenceItem.findFirst({
		where: { workspaceId: ws.id, type: 'Joint lease' }
	});
	await db.task.create({
		data: {
			workspaceId: ws.id,
			title: `${PFX}Get certified marriage certificate copies`,
			description: 'Order 3 copies from county clerk.',
			dueDate: addDays(now, 14),
			priority: 'HIGH',
			status: 'TODO',
			ownerId: owner.id,
			linkedFormId: i130.id
		}
	});
	await db.task.create({
		data: {
			workspaceId: ws.id,
			title: `${PFX}Scan recent bank statements`,
			description: 'Last 6 months, joint account.',
			dueDate: addDays(now, 7),
			priority: 'MEDIUM',
			status: 'IN_PROGRESS',
			ownerId: collab.id,
			linkedFormId: i130.id,
			linkedEvidenceId: lease?.id ?? null
		}
	});
	await db.task.create({
		data: {
			workspaceId: ws.id,
			title: `${PFX}Draft cover letter`,
			dueDate: addDays(now, 45),
			priority: 'MEDIUM',
			status: 'TODO',
			ownerId: owner.id
		}
	});
	await db.task.create({
		data: {
			workspaceId: ws.id,
			title: `${PFX}Schedule medical exam`,
			priority: 'LOW',
			status: 'TODO',
			ownerId: collab.id
		}
	});

	// Questions
	await db.questionItem.createMany({
		data: [
			{
				workspaceId: ws.id,
				question: `${PFX}Which photos count as relationship evidence?`,
				category: 'Evidence',
				priority: 'MEDIUM',
				status: 'OPEN',
				sourceType: 'COMMUNITY'
			},
			{
				workspaceId: ws.id,
				question: `${PFX}Do we need translations for non-English documents?`,
				category: 'Forms',
				priority: 'HIGH',
				status: 'ANSWERED',
				answer:
					'Yes — non-English documents must include a certified English translation per the official guidance.',
				sourceType: 'USCIS_SITE',
				citationUrl: 'https://www.uscis.gov',
				answeredAt: subDays(now, 5)
			},
			{
				workspaceId: ws.id,
				question: `${PFX}How many photos should we include in the packet?`,
				category: 'Evidence',
				priority: 'LOW',
				status: 'RESEARCHING',
				sourceType: 'ATTORNEY'
			}
		]
	});

	// Notes
	await db.note.create({
		data: {
			workspaceId: ws.id,
			title: `${PFX}Attorney call notes — intake`,
			bodyMd:
				'## Intake call summary\n\n- Walk through I-130/I-485 packet\n- Bring proof of cohabitation (lease, utility, joint bank)\n- Affidavits from at least 2 friends\n\n_Sample note — not legal advice._',
			authorId: owner.id
		}
	});
	await db.note.create({
		data: {
			workspaceId: ws.id,
			title: `${PFX}Mailing-day checklist`,
			bodyMd:
				'- Forms signed and dated\n- Cover letter\n- Supporting evidence in tabbed binder\n- Tracked mail receipt\n- Photocopy of full packet',
			authorId: collab.id
		}
	});

	// Activity (lightweight — most rows are normally created by services)
	await db.activityLog.createMany({
		data: [
			{
				workspaceId: ws.id,
				userId: owner.id,
				action: 'WORKSPACE_UPDATED',
				entityType: 'Workspace',
				entityId: ws.id,
				summary: 'Workspace created with demo data'
			},
			{
				workspaceId: ws.id,
				userId: owner.id,
				action: 'FORM_CREATED',
				entityType: 'FormRecord',
				entityId: i130.id,
				summary: 'Form I-130 created'
			}
		]
	});

	console.log('Seed complete.');
	console.log('Demo workspace: "Demo Case"');
	console.log('Demo owner email:    demo-owner@example.com');
	console.log('Demo partner email:  demo-partner@example.com');
	console.log(
		'These users have no password set — sign up with these emails (or update via Better Auth) to log in.'
	);
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
