import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
import type { QuickLinkFolder } from '$lib/types/enums';
import { invalidateAll } from '../__mocks__/app-navigation';

describe('QuickLinksWidget', () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		invalidateAll.mockReset();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it('creates a folder inline and focuses its editable name field', async () => {
		const folder: QuickLinkFolder = {
			id: 'folder-1',
			workspaceId: 'ws-1',
			name: null,
			order: 0,
			createdAt: '2026-04-26T00:00:00.000Z',
			updatedAt: '2026-04-26T00:00:00.000Z'
		};

		global.fetch = vi.fn(async () => ({
			ok: true,
			json: async () => folder
		})) as unknown as typeof fetch;

		render(QuickLinksWidget, {
			links: [],
			folders: []
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Add folder' }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'/dashboard/api/quick-link-folders',
				expect.objectContaining({ method: 'POST' })
			);
		});

		const input = await screen.findByPlaceholderText('Name this folder');
		expect(input).toHaveFocus();
		expect(screen.queryByText('Create')).not.toBeInTheDocument();
	});
});
