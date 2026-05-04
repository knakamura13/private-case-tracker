import { describe, it, expect } from 'vitest';
import { currentPhase } from '$lib/server/services/milestone.service';

describe('currentPhase', () => {
    it('returns OUTCOME when no milestones exist', () => {
        expect(currentPhase([])).toBe('OUTCOME');
    });

    it('returns the earliest phase that still has open work', () => {
        expect(
            currentPhase([
                { phase: 'PREPARATION', status: 'DONE' },
                { phase: 'PREPARATION', status: 'DONE' },
                { phase: 'RELATIONSHIP_EVIDENCE', status: 'IN_PROGRESS' },
                { phase: 'PACKET_DRAFTING', status: 'PLANNED' }
            ])
        ).toBe('RELATIONSHIP_EVIDENCE');
    });

    it('skips phases with all DONE/SKIPPED milestones', () => {
        expect(
            currentPhase([
                { phase: 'PREPARATION', status: 'DONE' },
                { phase: 'RELATIONSHIP_EVIDENCE', status: 'SKIPPED' },
                { phase: 'FILING', status: 'PLANNED' }
            ])
        ).toBe('FILING');
    });

    it('returns OUTCOME when everything is done', () => {
        expect(
            currentPhase([
                { phase: 'PREPARATION', status: 'DONE' },
                { phase: 'OUTCOME', status: 'DONE' }
            ])
        ).toBe('OUTCOME');
    });
});
