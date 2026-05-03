# Phase 6: Timeline Page Redesign

This phase implements the Monarch design for the Timeline page, featuring a two-column layout with a phase rail and a sticky sidebar progress tracker.

## Phase Rail (Left Column)

**File: `src/routes/(app)/timeline/+page.svelte`**

- Phase headers updated with Monarch pill-band styling (sage for done, peri for active, surface-2 for future).
- Vertical rail line implemented with 2px width and `var(--surface-3)` background.
- Milestone nodes updated with 24x24 circles and dynamic icons (Check for done, Clock for active).
- Milestone cards updated with peri tinting for active state and Monarch typography.
- "Add milestone" ghost buttons added below each phase.

## Sticky Sidebar (Right Column)

**File: `src/routes/(app)/timeline/+page.svelte`**

- "Phases complete" card added with large progress fraction.
- "Phase progress" list implemented with status dots and counts.
- "Now" card added showing the currently active phase and description.

## Components

**File: `src/lib/components/timeline/MilestoneEditModal.svelte`**

- Header updated with status pills and Monarch toolbar icons.
- Title updated to 32px display font.
- Layout refactored to match the Monarch "Detail Modal" pattern (shared with Tasks).
- Metadata grid and action chips implemented.

## Verification

- `npm run dev` to verify vertical rail alignment.
- Check responsive behavior (sidebar moves to bottom or hides on mobile).
- Verify milestone cards reflect current status colors correctly.
