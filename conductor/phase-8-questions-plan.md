# Phase 8 Implementation Plan: Questions Page Redesign

## Objective

Update the Questions page (`src/routes/(app)/questions/+page.svelte`) to match the Monarch design system, featuring a 3-column thread layout (official, community, other/internal).

## Key Files & Context

- **Plan Reference:** `docs/redesign/master-plan.md`
- **Route:** `src/routes/(app)/questions/+page.svelte`
- **CSS Tokens:** `src/app.css` (Monarch palette)

## Implementation Steps

1.  **Modify `src/routes/(app)/questions/+page.svelte`**:
    - Update `PageHeader` with Monarch eyebrow (e.g., "3 threads · 12 questions"), title, sub, and action slot.
    - Redesign the questions page into a 3-column layout (cards).
    - Each column (`.card`) header: status pill (source name) + count + subtitle.
    - Each question card: `.surface-2` bg, display text, tag pills, author avatar, date mono, replies count.
    - Add ghost "+ Ask a question" button at the bottom of each column.
    - Remove legacy filter bar and badge-heavy UI.

## Verification & Testing

- `npm run dev` to verify the page renders with the correct Monarch styling.
- Ensure the layout is a proper 3-column grid.
- Confirm thread colors are correctly applied based on sources.

## Rollback Strategy

- Revert changes to `src/routes/(app)/questions/+page.svelte` via git.
