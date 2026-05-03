# Phase 1 Execution Prompt: Design Token Swap

## Goal

Replace all existing CSS variables and base HTML metadata with the new "Monarch" design tokens. This phase should only affect the visual palette and typography, leaving the layout and logic untouched.

## Critical Instructions

- **Do NOT** touch any `.svelte` files.
- **Do NOT** change any logic or routing.
- **Follow the exact CSS blocks** provided below.

---

## Step 1: Update `src/app.html`

**File:** `src/app.html`

1.  **Change the Title:** Replace `<title>Private Case Tracker</title>` with `<title>Monarch</title>`.
2.  **Update Theme Color:** Change `<meta name="theme-color" content="#1e3a5f" />` to `<meta name="theme-color" content="#f5f0e8" />`.
3.  **Update Color Scheme:** Change `<meta name="color-scheme" content="light dark" />` to `<meta name="color-scheme" content="light" />` (Monarch is light-only).
4.  **Update Google Fonts:** Replace the existing Google Fonts `<link>` (line 19) with:
    ```html
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
        rel="stylesheet"
    />
    ```
5.  **Update Body Class:** Change the `<body>` tag to:
    ```html
    <body data-sveltekit-preload-data="hover" class="h-full bg-background text-foreground antialiased" style="background: #f5f0e8"></body>
    ```

---

## Step 2: Rewrite `:root` in `src/app.css`

**File:** `src/app.css`

1.  **Delete ALL existing `:root` blocks** and the `@media (prefers-color-scheme: dark)` block at the top of the file (typically lines 1 through ~310).
2.  **Insert the new Monarch `:root` block** at the very top of the file:

```css
:root {
    /* === Core surfaces === */
    --bg: #f5f0e8; /* page + sidebar + topbar background */
    --surface: #ffffff; /* cards, inputs, modals */
    --surface-2: #f2ede4; /* inline bgs inside cards */
    --surface-3: #e8e2d8; /* tracks, disabled wells */
    --hairline: #e0d8cc; /* all borders */

    /* === Ink (text) === */
    --ink: #1a1a18;
    --ink-2: #4a4540;
    --ink-3: #8a8278;
    --ink-4: #b8b0a4;

    /* === Accent tints (oklch) === */
    --sage: oklch(0.92 0.06 150);
    --sage-d: oklch(0.7 0.1 150);
    --sage-fill: oklch(0.55 0.14 150);
    --butter: oklch(0.95 0.06 90);
    --butter-d: oklch(0.8 0.1 90);
    --butter-fill: oklch(0.7 0.14 90);
    --blush: oklch(0.95 0.05 18);
    --blush-d: oklch(0.75 0.12 18);
    --blush-fill: oklch(0.65 0.16 18);
    --peri: oklch(0.92 0.06 265);
    --peri-d: oklch(0.7 0.12 265);
    --lilac: oklch(0.92 0.05 305);
    --lilac-d: oklch(0.7 0.1 305);

    /* === Typography === */
    --font-display: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
    --font-ui: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;

    /* === Shape === */
    --r-sm: 8px;
    --r-md: 16px;
    --r-lg: 24px;

    /* Legacy Mappings (to prevent breakage during transition) */
    --color-background: var(--bg);
    --color-foreground: var(--ink);
    --color-card: var(--surface);
    --color-border: var(--hairline);
    --color-primary: var(--ink);
    --color-primary-foreground: var(--surface);
    --font-sans: var(--font-ui);
}
```

---

## Step 3: Add Monarch Utility Classes

**File:** `src/app.css` (at the bottom or after the base layer)

Add these specific component and utility classes to `src/app.css`:

```css
/* Typography Utilities */
.display {
    font-family: var(--font-display);
}
.mono {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
}
.eyebrow {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 8px;
}

/* Base Pill */
.pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: var(--surface-3);
    color: var(--ink-2);
    white-space: nowrap;
}
.pill.s-done {
    background: var(--sage);
    color: var(--sage-d);
}
.pill.s-active {
    background: var(--peri);
    color: var(--peri-d);
}
.pill.s-waiting {
    background: var(--butter);
    color: var(--butter-d);
}
.pill.s-urgent {
    background: var(--blush);
    color: var(--blush-d);
}

/* Monarch Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    border-radius: var(--r-sm);
    font-size: 13px;
    font-weight: 600;
    background: var(--surface);
    border: 1px solid var(--hairline);
    color: var(--ink);
    transition: all 150ms ease;
}
.btn:hover {
    background: var(--surface-2);
}
.btn.primary {
    background: var(--ink);
    color: var(--surface);
    border-color: var(--ink);
}
.btn.primary:hover {
    opacity: 0.9;
}
.btn.ghost {
    background: transparent;
    border-color: transparent;
    color: var(--ink-2);
}
.btn.ghost:hover {
    background: var(--surface-2);
}
.btn.sm {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
}

/* Monarch Cards */
.card {
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: var(--r-lg);
    padding: 24px;
}
.card.tinted-sage {
    background: var(--sage);
    border-color: var(--sage-d);
}
.card.tinted-butter {
    background: var(--butter);
    border-color: var(--butter-d);
}
.card.tinted-blush {
    background: var(--blush);
    border-color: var(--blush-d);
}
.card.tinted-peri {
    background: var(--peri);
    border-color: var(--peri-d);
}
```

---

## Verification

- Run `npm run dev`.
- The background should be a warm cream/parchment color.
- Headings will not be serif yet (unless they have the `.display` class), but the font should load.
- No console errors.
