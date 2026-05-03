<script lang="ts">
    import type { Component } from 'svelte';
    import { MoreHorizontal } from 'lucide-svelte';
    import DropdownMenu from './DropdownMenu.svelte';
    import type { DropdownMenuItem } from './menuTypes';

    let {
        items,
        menuId,
        position = 'bottom-right'
    }: {
        items: DropdownMenuItem[];
        menuId: string;
        position?: 'bottom-right' | 'bottom-left';
    } = $props();

    const dropdownPosition = $derived.by((): 'bottom-end' | 'bottom-start' =>
        position === 'bottom-left' ? 'bottom-start' : 'bottom-end'
    );
</script>

<DropdownMenu
    {items}
    {menuId}
    position={dropdownPosition}
    size="sm"
    triggerLabel="More options"
    triggerIcon={MoreHorizontal}
/>
