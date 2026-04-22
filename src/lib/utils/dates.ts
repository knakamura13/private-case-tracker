import { format, formatDistanceToNowStrict, isPast, differenceInCalendarDays } from 'date-fns';

export function fmtDate(d: Date | string | null | undefined): string {
	if (!d) return '—';
	const date = typeof d === 'string' ? new Date(d) : d;
	if (isNaN(date.getTime())) return '—';
	return format(date, 'MMM d, yyyy');
}

export function fmtDateTime(d: Date | string | null | undefined): string {
	if (!d) return '—';
	const date = typeof d === 'string' ? new Date(d) : d;
	if (isNaN(date.getTime())) return '—';
	return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function fmtRelative(d: Date | string | null | undefined): string {
	if (!d) return '';
	const date = typeof d === 'string' ? new Date(d) : d;
	if (isNaN(date.getTime())) return '';
	return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

export function daysUntil(d: Date | string | null | undefined): number | null {
	if (!d) return null;
	const date = typeof d === 'string' ? new Date(d) : d;
	if (isNaN(date.getTime())) return null;
	return differenceInCalendarDays(date, new Date());
}

export function isOverdue(d: Date | string | null | undefined): boolean {
	if (!d) return false;
	const date = typeof d === 'string' ? new Date(d) : d;
	return isPast(date);
}
