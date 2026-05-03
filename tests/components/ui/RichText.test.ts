import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RichText from '$lib/components/ui/RichText.svelte';

describe('RichText', () => {
    it('renders repeated text segments without duplicate-key errors', () => {
        render(RichText, {
            text: 'First line\n\nwww.example.com\n\nSecond line\n\n(555) 123-4567\n\nSecond line'
        });

        expect(screen.getByText('www.example.com')).toHaveAttribute('href', 'https://www.example.com');
        expect(screen.getByText('(555) 123-4567')).toHaveAttribute('href', 'tel:5551234567');
        expect(screen.getByText((content) => content.includes('Second line'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('(555) 123-4567'))).toBeInTheDocument();
    });
});
