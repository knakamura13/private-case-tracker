/** Lucide Svelte icons are class-based components; typing them as `Component` breaks assignment. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DropdownMenuIcon = any;

export type DropdownMenuItem = {
    /** Stable key for `{#each}`; falls back to label + index */
    id?: string;
    label: string;
    action?: () => void;
    icon?: DropdownMenuIcon;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    href?: string;
};

export type DropdownMenuEntry = DropdownMenuItem | 'separator';
