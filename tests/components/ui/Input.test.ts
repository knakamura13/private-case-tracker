import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Input from '$lib/components/ui/Input.svelte';

describe('Input', () => {
    it('renders as input', () => {
        const { container } = render(Input);
        expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('binds value', () => {
        const { container } = render(Input, { value: 'test value' });
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input?.value).toBe('test value');
    });

    it('applies custom class', () => {
        const { container } = render(Input, { class: 'custom-class' });
        const input = container.querySelector('input');
        expect(input).toHaveClass('custom-class');
    });

    it('passes through other attributes', () => {
        const { container } = render(Input, { placeholder: 'Enter text', type: 'email' });
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('placeholder', 'Enter text');
        expect(input).toHaveAttribute('type', 'email');
    });

    it('applies default base classes', () => {
        const { container } = render(Input);
        const input = container.querySelector('input');
        expect(input).toHaveClass('input');
    });
});
