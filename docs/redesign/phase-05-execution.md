# Phase 5: Tasks Page Redesign

This plan implements the Monarch design for the Tasks page, including a 4-column Kanban layout, new task status schema, ByAvatar component, and updated detail modals for Tasks, Milestones, and Questions.

## Database Schema Changes

**File: `src/lib/types/enums.ts`**
- Update `TaskStatus` type from 3 to 4 statuses: `'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE'`

**File: `src/lib/schemas/task.ts`**
- Update `taskStatusEnum` to include `'WAITING'`

**File: `src/lib/server/services/task.service.ts`**
- Update reorder logic to handle 4 statuses
- Ensure new `WAITING` status is properly handled in all operations

## New Component: ByAvatar

**File: `src/lib/components/shared/ByAvatar.svelte`** (new)
- Props: `owner` object with `id`, `name`, `email`
- Display: circular avatar with initial, color variants (sage, blush, butter, peri)
- Size variants: default (32px) and small (24px)
- Fallback to first letter of name/email

## Tasks Page Layout

**File: `src/routes/(app)/tasks/+page.svelte`**
- Update `COLUMNS` constant to 4 columns:
  - `THIS_WEEK` → `.s-active` pill
  - `SOON` → `.s-note` pill
  - `WAITING` → `.s-waiting` pill
  - `DONE` → `.s-done` pill
- Update column headers to use Monarch pill styling with count in mono
- Add `⋯` icon button to each column header
- Preserve all existing drag-and-drop logic

## TaskCard Component Redesign

**File: `src/lib/components/tasks/TaskCard.svelte`**
- Add overdue eyebrow calculation (dueDate < today && status !== DONE)
- Update card styling to Monarch: `padding: 16px`, card geometry
- Task title: `font-size: 13px, font-weight: 500, line-height: 1.4`
- Tags row: `.pill` chips, `height: 20px, font-size: 10px`
- Footer row: calendar icon + due date mono + subtask count + ByAvatar
- Done cards: strikethrough + 0.7 opacity
- Remove grip handle (Monarch design doesn't show drag handles visually)

## Task Modals Redesign

**File: `src/lib/components/tasks/TaskEditModal.svelte`**
- Header: status pill (list name) + toolbar icons (image/preview/more/close)
- Title: circle checkbox + display-font heading `32px`
- Action chips: `+ Add`, `Labels`, `Sub-tasks`, `Attachment`, `Link`, `Evidence`
- Metadata 2-col grid: "Assigned to" (avatar stack + dashed + button), "Due date" (calendar button + optional Overdue pill)
- Labels: pills + dashed "+ add" button
- Description: padded `var(--surface-2)` block
- Sub-tasks: progress bar + checklist rows
- Activity: comment input + avatar thread
- Footer: Delete (ghost, blush) / Cancel / Save changes (primary)

**File: `src/lib/components/tasks/TaskCreateModal.svelte`**
- Apply same Monarch styling as edit modal
- Simplified header (no status pill since new task)

## Milestone Modal Redesign

**File: `src/lib/components/timeline/MilestoneEditModal.svelte`**
- Header: status pill (phase name) + toolbar icons
- Title: icon (milestone) + display-font heading `32px`
- Apply same Monarch layout pattern as Task modal
- Preserve milestone-specific fields (phase, location, appointment date)

## Question Modal Redesign

**File: `src/lib/components/questions/QuestionEditModal.svelte`**
- Header: status pill (thread name) + toolbar icons
- Title: icon (question) + display-font heading `32px`
- Apply Monarch styling to all form fields
- Preserve question-specific fields (source type, citation URL, answer)

## CSS Updates

**File: `src/app.css`**
- Add `.s-active`, `.s-waiting` pill modifiers (`.s-note` and `.s-done` already exist)
- Add `.kanban-board` grid helper for 4-column layout
- Add `.task-card` Monarch-specific styles
- Add `.modal-header`, `.modal-content`, `.modal-footer` Monarch styling
- Add `.avatar` and `.avatar.sm` with color variants

## Verification Steps

1. Run database migration to add WAITING status (if needed)
2. Test drag-and-drop across all 4 columns
3. Verify overdue calculation displays correctly
4. Test all three modal types (Task, Milestone, Question)
5. Run `npm run build` to ensure no regressions
6. Visual check of Tasks page at responsive breakpoints

## Risk Assessment

- **Database schema change**: Low risk - adding a new enum value is backward compatible
- **Drag-and-drop**: Medium risk - need to test new column logic thoroughly
- **Modal refactoring**: Medium risk - extensive UI changes, preserve all functionality
