import {
	LayoutDashboard,
	GitBranchPlus,
	ListTodo,
	FileText,
	Layers,
	FolderLock,
	CalendarDays,
	HelpCircle,
	NotebookPen,
	Settings as SettingsIcon,
	Wrench
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
	{ href: '/timeline', label: 'Timeline', icon: GitBranchPlus, description: 'Case phases and milestones' },
	{ href: '/tasks', label: 'Tasks', icon: ListTodo, description: 'Board, list, calendar' },
	{ href: '/forms', label: 'Forms', icon: FileText, description: 'Packet tracker' },
	{ href: '/evidence', label: 'Evidence', icon: Layers, description: 'Evidence library' },
	{ href: '/documents', label: 'Documents', icon: FolderLock, description: 'Files and secure links' },
	{ href: '/appointments', label: 'Appointments', icon: CalendarDays },
	{ href: '/questions', label: 'Questions', icon: HelpCircle, description: 'Research tracker' },
	{ href: '/notes', label: 'Notes', icon: NotebookPen },
	{ href: '/dev', label: 'Dev', icon: Wrench, ownerOnly: true },
	{ href: '/settings', label: 'Settings', icon: SettingsIcon }
];

export const privacyCopy = {
	short: 'Private organizational dashboard — not a legal source of truth.',
	long: 'This app is a private organizational tool. Official government and county websites remain the authoritative source. This app does not provide legal advice. Avoid storing unnecessary sensitive identifiers here.'
};
