import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
import { invalidateAll } from '../__mocks__/app-navigation';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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

    it('keeps hovered or focused quick link tiles above neighboring tiles so menus can overlay them', () => {
        const appCssPath = path.resolve(process.cwd(), 'src/app.css');
        const appCss = readFileSync(appCssPath, 'utf8');

        expect(appCss).toMatch(
            /\.widget-item:hover,\s*\.widget-item:focus-within\s*\{[^}]*z-index:\s*[1-9]\d*;[^}]*\}/s
        );
    });
});
