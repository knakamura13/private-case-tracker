import type { Component } from 'svelte';

export type DropdownMenuIcon = Component;

type DropdownMenuItemBase = {
    /** Stable key for `{#each}`; falls back to label + index */
    id?: string;
    label: string;
    icon?: DropdownMenuIcon;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
};

type DropdownMenuActionItem = DropdownMenuItemBase & { action: () => void; href?: never };
type DropdownMenuLinkItem = DropdownMenuItemBase & { href: string; action?: never };

export type DropdownMenuItem = DropdownMenuActionItem | DropdownMenuLinkItem;

export type DropdownMenuEntry = DropdownMenuItem | 'separator';
