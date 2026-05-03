<script lang="ts">
    import type { Snippet } from 'svelte';
    import Button from './Button.svelte';
    import { MoreHorizontal } from 'lucide-svelte';
    import type { DropdownMenuEntry, DropdownMenuIcon, DropdownMenuItem } from './menuTypes';

    type TriggerArgs = { toggle: (e?: MouseEvent) => void; isOpen: boolean };

    let {
        items = [],
        triggerLabel = 'Menu',
        triggerIcon = MoreHorizontal,
        position = 'bottom-end',
        size = 'default',
        menuId = `dropdown-${Math.random().toString(36).slice(2, 11)}`,
        menuClass = '',
        trigger
    }: {
        items?: DropdownMenuEntry[];
        triggerLabel?: string;
        triggerIcon?: DropdownMenuIcon;
        position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
        size?: 'default' | 'sm' | 'lg';
        menuId?: string;
        menuClass?: string;
        trigger?: Snippet<[TriggerArgs]>;
    } = $props();

    let isOpen = $state(false);
    let menuEl = $state<HTMLDivElement | null>(null);

    const listId = $derived(`${menuId}-menu`);
    const triggerId = $derived(`${menuId}-trigger`);

    function toggle(e?: MouseEvent) {
        e?.stopPropagation();
        isOpen = !isOpen;
    }

    function close() {
        isOpen = false;
    }

    function handleItemClick(item: DropdownMenuItem) {
        if (item.disabled) return;
        item.action?.();
        close();
    }

    function entryKey(entry: DropdownMenuEntry, i: number): string {
        if (entry === 'separator') return `sep-${i}`;
        return entry.id ?? `${entry.label}-${i}`;
    }

    // Close menu when clicking outside
    $effect(() => {
        if (!isOpen) return;

        const onDoc = (e: MouseEvent) => {
            const t = e.target;
            if (!(t instanceof HTMLElement)) return;
            if (t.closest('[data-dropdown]')) return;
            close();
        };

        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    });

    // Close menu on Escape key
    $effect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    });

    const sizeClass = $derived(
        (
            {
                default: 'dropdown-menu--size-default',
                sm: 'dropdown-menu--size-sm',
                lg: 'dropdown-menu--size-lg'
            } as const
        )[size] ?? 'dropdown-menu--size-default'
    );

    const positionClass = $derived(
        (
            {
                'top-start': 'dropdown-menu--pos-top-start',
                'top-end': 'dropdown-menu--pos-top-end',
                'bottom-start': 'dropdown-menu--pos-bottom-start',
                'bottom-end': 'dropdown-menu--pos-bottom-end'
            } as const
        )[position] ?? 'dropdown-menu--pos-bottom-end'
    );
</script>

<div data-dropdown class="dropdown-root">
    {#if trigger}
        {@render trigger({ toggle, isOpen })}
    {:else}
        <Button
            id={triggerId}
            variant="ghost"
            size="icon"
            onclick={toggle}
            aria-label={triggerLabel}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls={listId}
        >
            {#if triggerIcon}
                {@const Icon = triggerIcon}
                <Icon size={16} />
            {/if}
        </Button>
    {/if}

    {#if isOpen}
        <div
            bind:this={menuEl}
            id={listId}
            class="dropdown-menu {sizeClass} {positionClass} {menuClass}"
            role="menu"
            aria-orientation="vertical"
        >
            {#each items as entry, i (entryKey(entry, i))}
                {#if entry === 'separator'}
                    <div class="dropdown-separator" role="separator"></div>
                {:else}
                    <div
                        class="dropdown-item"
                        class:destructive={entry.variant === 'destructive'}
                        class:disabled={entry.disabled}
                        role="menuitem"
                        tabindex="0"
                        onclick={() => handleItemClick(entry)}
                        onkeydown={(e) => e.key === 'Enter' && handleItemClick(entry)}
                    >
                        {#if entry.icon}
                            {@const Icon = entry.icon}
                            <span class="dropdown-item-icon">
                                <Icon size={14} />
                            </span>
                        {/if}
                        <span class="dropdown-item-label">{entry.label}</span>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    .dropdown-root {
        position: relative;
        display: inline-block;
    }

    .dropdown-menu {
        position: absolute;
        background: var(--surface);
        border: 1px solid var(--hairline);
        border-radius: 6px;
        padding: 4px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        z-index: 9999;
        outline: none;
        min-width: fit-content;
    }

    .dropdown-menu--size-sm {
        min-width: 120px;
    }

    .dropdown-menu--size-default {
        min-width: 160px;
    }

    .dropdown-menu--size-lg {
        min-width: 200px;
    }

    /* Passed via menuClass from parents; :global so dynamic class names still match */
    .dropdown-root :global(.dropdown-menu--min-12rem) {
        min-width: 12rem;
    }

    .dropdown-menu--pos-bottom-start {
        top: 100%;
        left: 0;
        margin-top: 4px;
    }

    .dropdown-menu--pos-bottom-end {
        top: 100%;
        right: 0;
        margin-top: 4px;
    }

    .dropdown-menu--pos-top-start {
        bottom: 100%;
        left: 0;
        margin-bottom: 4px;
    }

    .dropdown-menu--pos-top-end {
        bottom: 100%;
        right: 0;
        margin-bottom: 4px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        color: var(--ink-1);
        transition: background-color 0.15s ease, color 0.15s ease;
        outline: none;
        text-decoration: none;
        user-select: none;
        width: 100%;
        text-align: left;
        border: none;
        background: transparent;
    }

    .dropdown-item:hover,
    .dropdown-item:focus {
        background: var(--surface-2);
        color: var(--ink-1);
    }

    .dropdown-item:active {
        background: var(--surface-3);
        transform: scale(0.98);
    }

    .dropdown-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .dropdown-item.destructive {
        color: var(--destructive, #dc2626);
    }

    .dropdown-item.destructive:hover,
    .dropdown-item.destructive:focus {
        background: color-mix(in srgb, var(--destructive, #dc2626) 12%, transparent);
        color: var(--destructive, #991b1b);
    }

    .dropdown-item-icon {
        margin-right: 8px;
        flex-shrink: 0;
    }

    .dropdown-item-label {
        flex: 1;
    }

    .dropdown-separator {
        height: 1px;
        background: var(--hairline);
        margin: 4px 0;
    }
</style>
