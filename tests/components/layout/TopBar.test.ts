import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import TopBar from '$lib/components/layout/TopBar.svelte';

describe('TopBar', () => {
	it('opens and closes the user menu repeatedly without leaving it stuck open', async () => {
		render(TopBar, {
			onOpenSearch: vi.fn(),
			onToggleSidebar: vi.fn()
		});

		const trigger = screen.getByRole('button', { name: 'Open user menu' });

		await fireEvent.click(trigger);
		expect(screen.getByRole('group', { name: 'User menu' })).toBeInTheDocument();

		await fireEvent.click(trigger);
		await waitFor(() => {
			expect(screen.queryByRole('group', { name: 'User menu' })).not.toBeInTheDocument();
		});

		await fireEvent.click(trigger);
		expect(screen.getByRole('group', { name: 'User menu' })).toBeInTheDocument();

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => {
			expect(screen.queryByRole('group', { name: 'User menu' })).not.toBeInTheDocument();
		});
	});
});
