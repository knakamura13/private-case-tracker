import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { listForms, maskReceipt } from '$lib/server/services/form.service';
import type { FormFilingStatus } from '$lib/types/enums';

const STATUSES: FormFilingStatus[] = [
	'NOT_STARTED',
	'IN_PROGRESS',
	'READY_FOR_REVIEW',
	'FILED',
	'RECEIVED',
	'REPLACED',
	'NOT_NEEDED'
];

export const load: PageServerLoad = async (event) => {
	const { workspace } = requireWorkspace(event);
	const statusParam = event.url.searchParams.get('status');
	const q = event.url.searchParams.get('q') ?? undefined;
	const status = statusParam && STATUSES.includes(statusParam as FormFilingStatus) ? (statusParam as FormFilingStatus) : undefined;
	const forms = await listForms(workspace.id, { status, q });
	return {
		forms: forms.map((f) => ({
			...f,
			receiptNumberEncrypted: undefined,
			receiptMask: maskReceipt(f.receiptNumberEncrypted)
		}))
	};
};
