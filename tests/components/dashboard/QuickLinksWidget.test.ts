import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
import { invalidateAll } from '../__mocks__/app-navigation';

describe('QuickLinksWidget', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        invalidateAll.mockReset();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('opens folder creation dialog when Add folder button is clicked', async () => {
        render(QuickLinksWidget, {
            links: [],
            folders: []
        });

        await fireEvent.click(screen.getByRole('button', { name: 'Add folder' }));

        // Check that the dialog opens with correct title (use role to avoid button text conflict)
        expect(screen.getByRole('heading', { name: 'Add folder' })).toBeInTheDocument();

        // Check for the folder name input
        const input = screen.getByPlaceholderText('Folder name');
        expect(input).toBeInTheDocument();
    });
});
