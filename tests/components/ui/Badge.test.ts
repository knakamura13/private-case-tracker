import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Badge from '$lib/components/ui/Badge.svelte';

describe('Badge', () => {
	it('renders as span', () => {
		const { container } = render(Badge);
		expect(container.querySelector('span')).toBeInTheDocument();
	});

	it('applies variant classes', () => {
		const { container } = render(Badge, { variant: 'success' });
		const span = container.querySelector('span');
		expect(span).toHaveClass('bg-success/15');
	});

	it('applies custom class', () => {
		const { container } = render(Badge, { class: 'custom-class' });
		const span = container.querySelector('span');
		expect(span).toHaveClass('custom-class');
	});

	it('passes through other attributes', () => {
		const { container } = render(Badge, { 'data-testid': 'badge' });
		const span = container.querySelector('span');
		expect(span).toHaveAttribute('data-testid', 'badge');
	});
});
