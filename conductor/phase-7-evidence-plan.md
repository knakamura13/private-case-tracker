# Phase 7 Implementation Plan: Evidence Page Redesign

## Objective
Update the Evidence page (`src/routes/(app)/evidence/+page.svelte`) to match the Monarch design system, featuring a structured category grid and item tracking cards.

## Key Files & Context
- **Plan Reference:** `docs/redesign/master-plan.md`
- **Route:** `src/routes/(app)/evidence/+page.svelte`
- **CSS Tokens:** `src/app.css` (Monarch palette)

## Implementation Steps
1.  **Modify `src/routes/(app)/evidence/+page.svelte`**:
    -   Update `PageHeader` with Monarch eyebrow, display title, sub, and action slot.
    -   Redesign the evidence category grid into Monarch's bento-style card grid.
    -   Implement the category cards with icon, eyebrow title, big count display, and progress bar.
    -   Implement the "per-category item list" (if the current structure allows, or refine to match Monarch's category-header-with-item-grid-below structure).
    -   Apply `.tinted-{color}` modifiers for different category types.
    -   Replace existing buttons/UI with Monarch-styled components.

## Verification & Testing
- `npm run dev` to verify the page renders with the correct Monarch styling.
- Verify that category operations (add, rename, delete) still work via `use:enhance`.
- Ensure category grid responsiveness.

## Rollback Strategy
- Revert changes to `src/routes/(app)/evidence/+page.svelte` via git.
