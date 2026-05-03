<script lang="ts">
    import type { Component } from 'svelte';
    import { MoreHorizontal } from 'lucide-svelte';
    import DropdownMenu from './DropdownMenu.svelte';

    type MenuItem = {
        label: string;
        action: () => void;
        icon?: Component;
        variant?: 'default' | 'destructive';
        disabled?: boolean;
    };

    let { 
        items, 
        menuId: _menuId,
        position = 'bottom-right'
    }: { 
        items: MenuItem[]; 
        menuId: string;
        position?: 'bottom-right' | 'bottom-left';
    } = $props();

    // Map position prop to DropdownMenu position
    const dropdownPosition = $derived({
        'bottom-right': 'bottom-end',
        'bottom-left': 'bottom-start'
    }[position] || 'bottom-end');
</script>

<DropdownMenu 
    items={items}
    position={dropdownPosition}
    size="sm"
    triggerLabel="More options"
    triggerIcon={MoreHorizontal}
/>
