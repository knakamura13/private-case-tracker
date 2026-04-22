import type { AppointmentStatus, AppointmentType, Prisma } from '@prisma/client';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity';
import type { AppointmentCreate, AppointmentUpdate } from '$lib/schemas/appointment';

export async function listAppointments(
	workspaceId: string,
	filter: { status?: AppointmentStatus; type?: AppointmentType; range?: 'upcoming' | 'past' } = {}
) {
	const where: Prisma.AppointmentWhereInput = { workspaceId, deletedAt: null };
	if (filter.status) where.status = filter.status;
	if (filter.type) where.type = filter.type;
	const now = new Date();
	if (filter.range === 'upcoming') where.scheduledAt = { gte: now };
	if (filter.range === 'past') where.scheduledAt = { lt: now };
	return db.appointment.findMany({
		where,
		include: { _count: { select: { tasks: true } } },
		orderBy: { scheduledAt: filter.range === 'past' ? 'desc' : 'asc' }
	});
}

export async function getAppointment(workspaceId: string, id: string) {
	return db.appointment.findFirst({
		where: { id, workspaceId, deletedAt: null },
		include: {
			tasks: { where: { deletedAt: null } },
			documents: { where: { deletedAt: null } },
			linkedNotes: { where: { deletedAt: null } }
		}
	});
}

export async function createAppointment(
	workspaceId: string,
	actorId: string,
	input: AppointmentCreate
) {
	const appointment = await db.appointment.create({
		data: { workspaceId, ...input }
	});
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'APPOINTMENT_CREATED',
		entityType: 'Appointment',
		entityId: appointment.id,
		summary: `Appointment "${appointment.title}" created`
	});
	return appointment;
}

export async function updateAppointment(
	workspaceId: string,
	actorId: string,
	id: string,
	input: AppointmentUpdate
) {
	const existing = await db.appointment.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Appointment not found');
	const updated = await db.appointment.update({ where: { id }, data: input });
	const statusChanged = input.status && input.status !== existing.status;
	await logActivity({
		workspaceId,
		userId: actorId,
		action: statusChanged ? 'STATUS_CHANGE' : 'APPOINTMENT_UPDATED',
		entityType: 'Appointment',
		entityId: updated.id,
		summary: statusChanged
			? `Appointment "${updated.title}" marked ${updated.status}`
			: `Appointment "${updated.title}" updated`
	});
	return updated;
}

export async function softDeleteAppointment(workspaceId: string, actorId: string, id: string) {
	const existing = await db.appointment.findFirst({
		where: { id, workspaceId, deletedAt: null }
	});
	if (!existing) throw new Error('Appointment not found');
	await db.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'APPOINTMENT_DELETED',
		entityType: 'Appointment',
		entityId: id,
		summary: `Appointment "${existing.title}" deleted`
	});
}
