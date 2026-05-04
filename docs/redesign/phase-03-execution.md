# Phase 3 Execution Prompt: Layout Chrome & Global Typography

## Goal

Update the main application layout structure to match Monarch's spacing and card geometry. Ensure global typography utilities are used correctly.

## Critical Instructions

- **Do NOT** touch any page-specific logic or data loading.
- **Focus** on the outer padding of the app and the `main` content area.
- **Remove** legacy layout utility classes from `(app)/+layout.svelte`.

---

## Step 1: Update `(app)/+layout.svelte`

**File:** `src/routes/(app)/+layout.svelte`

1.  **Simplify Root Layout Wrapper:** Replace the outer `div` (line 52) and the sidebar wrapper (line 53) to remove legacy `app-layout-*` classes.
2.  **Update Backdrop:** Change the mobile sidebar backdrop (line 70) to use `var(--ink)` with low opacity.
3.  **Update Main Content Padding:** Change the `<main>` tag (line 94) to match Monarch's exact padding:
    ```html
    <main id="main" tabindex="-1" style="flex: 1; min-width: 0; overflow-y: auto; padding: 32px 32px 48px; background: var(--bg);">
        {#key page.url.pathname} {@render children()} {/key}
    </main>
    ```

---

## Step 2: Global typography & Card updates in `app.css`

**File:** `src/app.css`

Ensure these rules are present to fix common spacing issues:

```css
/* Fix all cards to use Monarch radius and border */
.card,
.widget,
.stat-card {
    border-radius: var(--r-lg) !important;
    border: 1px solid var(--hairline) !important;
    background: var(--surface) !important;
    box-shadow: none !important;
}

/* Page spacing utility */
.dashboard-grid,
.grid-layout {
    display: grid;
    gap: 28px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Title adjustments */
h1 {
    font-family: var(--font-display);
    font-size: 56px;
    line-height: 1;
    margin-bottom: 24px;
}
h2 {
    font-family: var(--font-display);
    font-size: 36px;
    line-height: 1.1;
    margin-bottom: 20px;
}
h3 {
    font-family: var(--font-display);
    font-size: 24px;
    line-height: 1.2;
    margin-bottom: 16px;
}
```

---

## Step 3: PageHeader Component update

**File:** `src/lib/components/shared/PageHeader.svelte`

Update the `PageHeader` component to match the new Monarch design:

- Large 56px display title.
- Small eyebrow text above the title.
- Description paragraph below.

```svelte
<script lang="ts">
    let { title, sub, eyebrow, number }: { title: string; sub?: string; eyebrow?: string; number?: string } = $props();
</script>

<div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; gap: 24px; flex-wrap: wrap;">
    <div>
        {#if eyebrow || number}
            <div class="eyebrow" style="margin-bottom: 12px;">{eyebrow || `PAGE ${number}`}</div>
        {/if}
        <h1 class="display" style="font-size: 56px; line-height: 1; margin: 0;">{title}</h1>
        {#if sub}
            <p style="color: var(--ink-2); margin-top: 12px; font-size: 15px; max-width: 560px; line-height: 1.5; text-wrap: pretty;">
                {sub}
            </p>
        {/if}
    </div>
    <slot name="actions"></slot>
</div>
```

---

## Verification

- Run `npm run dev`.
- Every page should now have consistent 32px padding on the sides and 48px on the bottom.
- Titles should be large and serif (if using the display font).
- Cards should have very round corners (24px).
