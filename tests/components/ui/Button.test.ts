import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from '$lib/components/ui/Button.svelte';

describe('Button', () => {
    it('renders as button by default', () => {
        const { container } = render(Button);
        expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('renders as link when href is provided', () => {
        const { container } = render(Button, { href: '/test' });
        expect(container.querySelector('a')).toBeInTheDocument();
        expect(container.querySelector('a')).toHaveAttribute('href', '/test');
    });

    it('applies variant classes', () => {
        const { container } = render(Button, { variant: 'destructive' });
        const button = container.querySelector('button');
        expect(button).toHaveClass('destructive');
    });

    it('applies size classes', () => {
        const { container } = render(Button, { size: 'lg' });
        const button = container.querySelector('button');
        expect(button).toHaveClass('lg');
    });

    it('applies custom class', () => {
        const { container } = render(Button, { class: 'custom-class' });
        const button = container.querySelector('button');
        expect(button).toHaveClass('custom-class');
    });

    it('passes through other attributes', () => {
        const { container } = render(Button, { disabled: true });
        const button = container.querySelector('button');
        expect(button).toBeDisabled();
    });
});
