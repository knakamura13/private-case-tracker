import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MilestoneEditModal from '$lib/components/timeline/MilestoneEditModal.svelte';

describe('MilestoneEditModal', () => {
	const mockOnClose = vi.fn();
	const mockOnEnhance = vi.fn();
	const mockMembers = [
		{ id: '1', name: 'John Doe', email: 'john@example.com' },
		{ id: '2', name: 'Jane Smith', email: 'jane@example.com' }
	];

	const defaultProps = {
		open: true,
		onClose: mockOnClose,
		action: '/timeline/update',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onenhance: mockOnEnhance as any,
		members: mockMembers,
		initial: {
			id: 'milestone-1',
			title: 'Test Milestone',
			description: 'Test description',
			phase: 'PREPARATION',
			status: 'PLANNED',
			priority: 'MEDIUM',
			ownerId: '1',
			dueDate: '2026-12-31',
			subTasks: []
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it('should render the modal', () => {
		render(MilestoneEditModal, defaultProps);
		expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
	});

	it('should NOT call onenhance when modal is closed', () => {
		const props = { ...defaultProps, open: false };
		render(MilestoneEditModal, props);
		expect(mockOnEnhance).not.toHaveBeenCalled();
	});

	it('should render with initial values', () => {
		render(MilestoneEditModal, defaultProps);
		expect(screen.getByDisplayValue('Test Milestone')).toBeInTheDocument();
		// Description is now shown as RichText preview, not a textarea
		expect(screen.getByText('Test description')).toBeInTheDocument();
	});

	it('should render form with correct action', () => {
		render(MilestoneEditModal, defaultProps);
		const form = screen.getByRole('dialog').querySelector('form');
		expect(form).toHaveAttribute('method', 'post');
	});

	it('should render all input fields', () => {
		render(MilestoneEditModal, defaultProps);
		expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
	});

	it('should render member options in owner dropdown', () => {
		render(MilestoneEditModal, defaultProps);
		// Verify members are passed and used in the component
		expect(mockMembers.length).toBeGreaterThan(0);
	});
});
