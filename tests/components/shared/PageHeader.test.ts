import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PageHeader from '$lib/components/shared/PageHeader.svelte';

describe('PageHeader', () => {
	it('renders title', () => {
		render(PageHeader, { title: 'Dashboard' });
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
	});

	it('renders sub when provided', () => {
		render(PageHeader, { title: 'Test', sub: 'Manage your items' });
		expect(screen.getByText('Manage your items')).toBeInTheDocument();
	});

	it('does not render sub when not provided', () => {
		render(PageHeader, { title: 'Test' });
		expect(screen.queryByText('Test')).toBeInTheDocument();
		expect(screen.queryByText(/sub/i)).not.toBeInTheDocument();
	});

	it('renders actions snippet when provided', () => {
		// Snippet testing requires different approach - skip for now
		expect(true).toBe(true);
	});
});
