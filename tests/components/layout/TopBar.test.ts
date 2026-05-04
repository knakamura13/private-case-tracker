import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TopBar from '$lib/components/layout/TopBar.svelte';

describe('TopBar', () => {
    it('calls onToggleSidebar when menu button is clicked', async () => {
        const onToggleSidebar = vi.fn();
        render(TopBar, {
            onOpenSearch: vi.fn(),
            onToggleSidebar
        });

        const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
        await fireEvent.click(trigger);
        expect(onToggleSidebar).toHaveBeenCalled();
    });

    it('calls onOpenSearch when search button is clicked', async () => {
        const onOpenSearch = vi.fn();
        render(TopBar, {
            onOpenSearch,
            onToggleSidebar: vi.fn()
        });

        const trigger = screen.getByRole('button', { name: 'Open search' });
        await fireEvent.click(trigger);
        expect(onOpenSearch).toHaveBeenCalled();
    });
});
