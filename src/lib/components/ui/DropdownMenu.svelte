<script lang="ts">
    import type { Component } from 'svelte';
    import Button from './Button.svelte';
    import { MoreHorizontal } from 'lucide-svelte';

    type MenuItem = {
        label: string;
        action?: () => void;
        icon?: Component;
        variant?: 'default' | 'destructive';
        disabled?: boolean;
        href?: string;
    };

    let { 
        items = [],
        triggerLabel = 'Menu',
        triggerIcon = MoreHorizontal,
        position = 'bottom-end',
        size = 'default'
    }: { 
        items?: MenuItem[]; 
        triggerLabel?: string;
        triggerIcon?: Component;
        position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
        size?: 'default' | 'sm' | 'lg';
    } = $props();

    let isOpen = $state(false);
    let menuEl = $state<HTMLDivElement | null>(null);

    function toggle() {
        isOpen = !isOpen;
    }

    function close() {
        isOpen = false;
    }

    function handleItemClick(item: MenuItem) {
        if (item.disabled) return;
        item.action?.();
        close();
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

    // Set size classes
    const sizeClasses = $derived({
        default: 'min-w-[160px]',
        sm: 'min-w-[120px]',
        lg: 'min-w-[200px]'
    }[size] || 'min-w-[160px]');

    // Position classes
    const positionClasses = $derived({
        'top-start': 'bottom-full left-0 mb-1',
        'top-end': 'bottom-full right-0 mb-1',
        'bottom-start': 'top-full left-0 mt-1',
        'bottom-end': 'top-full right-0 mt-1'
    }[position] || 'top-full right-0 mt-1');
</script>

<div data-dropdown class="relative inline-block">
    <Button
        variant="ghost"
        size="sm"
        onclick={toggle}
        aria-label={triggerLabel}
    >
        {#if triggerIcon}
            {@const Icon = triggerIcon}
            <Icon size={16} />
        {/if}
    </Button>

    {#if isOpen}
        <div 
            bind:this={menuEl}
            class="dropdown-menu {sizeClasses} {positionClasses}"
            role="menu"
            aria-orientation="vertical"
        >
            {#each items as menuItem (menuItem.label)}
                {#if menuItem === 'separator'}
                    <div class="dropdown-separator" role="separator"></div>
                {:else}
                    <div 
                        class="dropdown-item"
                        class:destructive={menuItem.variant === 'destructive'}
                        class:disabled={menuItem.disabled}
                        role="menuitem"
                        tabindex="0"
                        onclick={() => handleItemClick(menuItem)}
                        onkeydown={(e) => e.key === 'Enter' && handleItemClick(menuItem)}
                    >
                        {#if menuItem.icon}
                            {@const Icon = menuItem.icon}
                            <span class="dropdown-item-icon">
                                <Icon size={14} />
                            </span>
                        {/if}
                        <span class="dropdown-item-label">{menuItem.label}</span>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    .dropdown-menu {
        position: absolute;
        background: white;
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 6px;
        padding: 4px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        z-index: 9999;
        outline: none;
        min-width: fit-content;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
        transition: all 0.15s ease;
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
        background: #f3f4f6;
        color: #111827;
    }

    .dropdown-item:active {
        background: #e5e7eb;
        transform: scale(0.98);
    }

    .dropdown-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .dropdown-item.destructive {
        color: #dc2626;
    }

    .dropdown-item.destructive:hover,
    .dropdown-item.destructive:focus {
        background: #fef2f2;
        color: #991b1b;
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
        background: var(--border);
        margin: 4px 0;
    }

</style>
