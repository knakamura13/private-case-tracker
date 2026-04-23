import type { AppointmentStatus, AppointmentType } from '$lib/types/enums';
import { logActivity } from '$lib/server/activity';
import type { AppointmentCreate, AppointmentUpdate } from '$lib/schemas/appointment';
import { randomUUID } from 'node:crypto';
import { ddbGet, ddbPut, ddbQuery, ddbUpdate } from '$lib/server/dynamo/ops';
import { entitySk, wsPk } from '$lib/server/dynamo/keys';
import type { AppointmentItem } from '$lib/server/dynamo/types';

export async function listAppointments(
	workspaceId: string,
	filter: { status?: AppointmentStatus; type?: AppointmentType; range?: 'upcoming' | 'past'; limit?: number } = {}
) {
	const now = new Date();
	const rows = await ddbQuery<AppointmentItem>({
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
		ExpressionAttributeValues: { ':pk': wsPk(workspaceId), ':prefix': 'Appointment#' },
		Limit: filter.limit ?? 1000
	});
	const filtered = rows
		.filter((a) => !a.deletedAt)
		.filter((a) => (filter.status ? (a.status as AppointmentStatus) === filter.status : true))
		.filter((a) => (filter.type ? (a.type as AppointmentType) === filter.type : true))
		.filter((a) => {
			const t = a.scheduledAt ? new Date(a.scheduledAt).getTime() : NaN;
			if (!Number.isFinite(t)) return true;
			if (filter.range === 'upcoming') return t >= now.getTime();
			if (filter.range === 'past') return t < now.getTime();
			return true;
		})
		.map((a) => ({ ...a, _count: { tasks: 0 } }));
	filtered.sort((a, b) => {
		const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
		const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
		return filter.range === 'past' ? bt - at : at - bt;
	});
	return filtered;
}

export async function getAppointment(workspaceId: string, id: string) {
	const appt = await ddbGet<AppointmentItem>({ PK: wsPk(workspaceId), SK: entitySk('Appointment', id) });
	if (!appt || appt.deletedAt) return null;
	return { ...appt, tasks: [], documents: [], linkedNotes: [] };
}

export async function createAppointment(
	workspaceId: string,
	actorId: string,
	input: AppointmentCreate
) {
	const now = new Date().toISOString();
	const appointment = {
		id: randomUUID(),
		workspaceId,
		...input,
		deletedAt: null as string | null,
		createdAt: now,
		updatedAt: now
	};
	await ddbPut({
		PK: wsPk(workspaceId),
		SK: entitySk('Appointment', appointment.id),
		...appointment
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
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('Appointment', id) });
	if (!existing) throw new Error('Appointment not found');
	if (existing.deletedAt) throw new Error('Appointment not found');
	const patch: Record<string, unknown> = { ...input, updatedAt: new Date().toISOString() };
	const names: Record<string, string> = {};
	const values: Record<string, unknown> = {};
	const sets: string[] = [];
	for (const [k, v] of Object.entries(patch)) {
		const nk = `#${k}`;
		const vk = `:${k}`;
		names[nk] = k;
		values[vk] = v;
		sets.push(`${nk} = ${vk}`);
	}
	const updated = (await ddbUpdate<any>(
		{ PK: wsPk(workspaceId), SK: entitySk('Appointment', id) },
		`SET ${sets.join(', ')}`,
		values,
		names
	)) ?? { ...existing, ...patch };
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
	const existing = await ddbGet<any>({ PK: wsPk(workspaceId), SK: entitySk('Appointment', id) });
	if (!existing) throw new Error('Appointment not found');
	if (existing.deletedAt) throw new Error('Appointment not found');
	await ddbUpdate(
		{ PK: wsPk(workspaceId), SK: entitySk('Appointment', id) },
		'SET #deletedAt = :d, #updatedAt = :u',
		{ ':d': new Date().toISOString(), ':u': new Date().toISOString() },
		{ '#deletedAt': 'deletedAt', '#updatedAt': 'updatedAt' }
	);
	await logActivity({
		workspaceId,
		userId: actorId,
		action: 'APPOINTMENT_DELETED',
		entityType: 'Appointment',
		entityId: id,
		summary: `Appointment "${existing.title}" deleted`
	});
}
