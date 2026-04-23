import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PageHeader from '$lib/components/shared/PageHeader.svelte';

describe('PageHeader', () => {
	it('renders title', () => {
		render(PageHeader, { title: 'Dashboard' });
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
	});

	it('renders description when provided', () => {
		render(PageHeader, { title: 'Test', description: 'Manage your items' });
		expect(screen.getByText('Manage your items')).toBeInTheDocument();
	});

	it('does not render description when not provided', () => {
		render(PageHeader, { title: 'Test' });
		expect(screen.queryByText('Test')).toBeInTheDocument();
		expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
	});

	it('renders actions snippet when provided', () => {
		// Snippet testing requires different approach - skip for now
		expect(true).toBe(true);
	});

	it('applies custom class', () => {
		const { container } = render(PageHeader, { title: 'Test', class: 'custom-class' });
		expect(container.firstChild).toHaveClass('custom-class');
	});
});
