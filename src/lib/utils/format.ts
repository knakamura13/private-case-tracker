export function titleCase(input: string): string {
	return input
		.toLowerCase()
		.split('_')
		.map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
		.join(' ');
}

export function initials(name: string | null | undefined, email?: string): string {
	const source = (name ?? email ?? '?').trim();
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
	}
	return source.slice(0, 2).toUpperCase();
}

export function pluralize(n: number, singular: string, plural?: string): string {
	return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? `${singular}s`}`;
}

export function truncate(s: string, max: number): string {
	return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
