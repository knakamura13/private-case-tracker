import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listAppointments } from '$lib/server/services/appointment.service';
import type { AppointmentStatus, AppointmentType } from '@prisma/client';

const STATUSES: AppointmentStatus[] = [
	'SCHEDULED',
	'CONFIRMED',
	'COMPLETED',
	'CANCELED',
	'RESCHEDULED',
	'MISSED'
];
const TYPES: AppointmentType[] = [
	'CIVIL_MARRIAGE',
	'BIOMETRICS',
	'ATTORNEY_CONSULT',
	'MEDICAL_EXAM',
	'INTERVIEW',
	'TRANSLATION_OR_NOTARY',
	'DOCUMENT_PICKUP',
	'OTHER'
];

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const rangeParam = event.url.searchParams.get('range') ?? 'upcoming';
	const statusParam = event.url.searchParams.get('status');
	const typeParam = event.url.searchParams.get('type');
	const appointments = await listAppointments(workspace.id, {
		range: rangeParam === 'past' ? 'past' : 'upcoming',
		status:
			statusParam && STATUSES.includes(statusParam as AppointmentStatus)
				? (statusParam as AppointmentStatus)
				: undefined,
		type:
			typeParam && TYPES.includes(typeParam as AppointmentType)
				? (typeParam as AppointmentType)
				: undefined
	});
	return { appointments, range: rangeParam };
};
