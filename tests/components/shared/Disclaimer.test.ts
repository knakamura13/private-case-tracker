import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Disclaimer from '$lib/components/shared/Disclaimer.svelte';

describe('Disclaimer', () => {
    it('renders short privacy copy by default', () => {
        render(Disclaimer);
        expect(screen.getByText(/not a legal source of truth/i)).toBeInTheDocument();
    });

    it('renders detailed privacy copy when detailed prop is true', () => {
        render(Disclaimer, { detailed: true });
        expect(screen.getByText(/does not provide legal advice/i)).toBeInTheDocument();
    });

    it('applies custom class', () => {
        const { container } = render(Disclaimer, { class: 'custom-class' });
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders shield icon', () => {
        const { container } = render(Disclaimer);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
