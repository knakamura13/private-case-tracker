import {
	LayoutDashboard,
	List,
	Layers,
	HelpCircle
} from 'lucide-svelte';

export interface NavItem {
	href: string;
	label: string;
	icon: typeof LayoutDashboard;
	description?: string;
	ownerOnly?: boolean;
}

export const navigation: NavItem[] = [
	{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/timeline', label: 'Timeline', icon: List, description: 'Case phases and milestones' },
	{ href: '/evidence', label: 'Evidence', icon: Layers, description: 'Evidence library' },
	{ href: '/questions', label: 'Questions', icon: HelpCircle, description: 'Research tracker' }
];

export const privacyCopy = {
	short: 'Private organizational dashboard — not a legal source of truth.',
	long: 'This app is a private organizational tool. Official government and county websites remain the authoritative source. This app does not provide legal advice. Avoid storing unnecessary sensitive identifiers here.'
};
