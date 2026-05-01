# Monarch Redesign — Phased Frontend Rewrite

> **Source audit complete.** All 7 Monarch component files have been read and parsed. Every page layout, widget, and CSS token below comes directly from the source code — not from interpretation of the screenshot.

---

## Background

The app is SvelteKit 5 (Svelte Runes API) with a custom vanilla CSS design system. All business logic and routing stay untouched. The goal is to replace the visual layer — design tokens, layout shell, and per-page components — with the **Monarch** aesthetic without ever leaving the app in a broken state between phases.

**Key constraints:**
- Every phase commit must be independently deployable / runnable with `npm run dev`
- No changes to route files (`+page.server.ts`, `+layout.server.ts`), stores, schemas, or API routes
- New name: **Monarch** (drop "Case Tracker" / "Case Compass" everywhere in UI)
- New logo: `static/personal-case-tracker--monarch-redesign/monarch-logo.png`

---

## Monarch Design System — Complete Token Reference

Sourced directly from the Monarch CSS (`monarch_01.js`):

### Color Palette

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#f5f0e8` | Page background, sidebar bg, topbar bg |
| `--surface` | `#fff` | Cards, inputs, modal bg |
| `--surface-2` | `#f2ede4` | Inline bg within cards (subtasks, descriptions) |
| `--surface-3` | `#e8e2d8` | Muted well (progress bar tracks, disabled chips) |
| `--hairline` | `#e0d8cc` | All border/divider lines |
| `--ink` | `#1a1a18` | Primary text |
| `--ink-2` | `#4a4540` | Secondary text (descriptions, subtitles) |
| `--ink-3` | `#8a8278` | Tertiary text (dates, counts, placeholders) |
| `--ink-4` | `#b8b0a4` | Disabled / estimated text |
| **Accent tints (tinted cards & pills):** | | |
| `--sage` | `oklch(0.92 0.06 150)` | Done / success bg (tinted cards) |
| `--sage-d` | `oklch(0.70 0.10 150)` | Done border |
| `--sage-fill` | `oklch(0.55 0.14 150)` | Progress bars, done dot |
| `--butter` | `oklch(0.95 0.06 90)` | Calendar / upcoming bg |
| `--butter-d` | `oklch(0.80 0.10 90)` | Butter border |
| `--butter-fill` | `oklch(0.70 0.14 90)` | Active indicator dot (inside dark circle) |
| `--blush` | `oklch(0.95 0.05 18)` | Urgent / overdue bg |
| `--blush-d` | `oklch(0.75 0.12 18)` | Urgent border, overdue text |
| `--blush-fill` | `oklch(0.65 0.16 18)` | Urgent fill |
| `--peri` | `oklch(0.92 0.06 265)` | Active/in-progress bg (topbar, active phase) |
| `--peri-d` | `oklch(0.70 0.12 265)` | Active border |
| `--lilac` | `oklch(0.92 0.05 305)` | Quick links bg |
| `--lilac-d` | `oklch(0.70 0.10 305)` | Lilac border |

### Typography

| Variable | Value |
|---|---|
| `--font-display` | `"Canela", "Georgia", "Times New Roman", serif` |
| `--font-ui` | `"Inter", system-ui, sans-serif` |
| `--font-mono" | `"JetBrains Mono", ui-monospace, monospace` |

**Key rules:**
- Page title (`PageHeader`): `font-display`, `font-size: 56px`, `line-height: 1` — this is the dominant heading
- Section headings within cards: `font-display`, `font-size: 22–36px`
- Eyebrow labels: `font-ui`, `font-size: 11px`, `font-weight: 600`, `letter-spacing: 0.08em`, `text-transform: uppercase`, `color: var(--ink-3)`
- Body: `font-ui`, 13–15px
- Mono data (dates, counts, receipt #s): `font-mono`, 10–12px

### Status Pills (`.pill` + modifier)

| Class | Background | Text color | Usage |
|---|---|---|---|
| `.s-done` | `--sage` | sage-d text | Completed items |
| `.s-active` | `--peri` | peri-d text | In progress / "This week" |
| `.s-waiting` | `--butter` | butter-d text | Waiting on external party |
| `.s-note` | `--surface-3` | `--ink-2` | Neutral / between us |
| `.s-urgent" | `--blush` | blush-d text | Overdue |

### Layout / Shape

| Variable | Value |
|---|---|
| `--r-sm` | `8px` |
| `--r-md` | `16px` |
| `--r-lg` | `24px` |
| Sidebar width | `240px` |
| Topbar height | `~80px` (20px top/bottom padding + input) |
| Page content padding | `32px 32px 48px` |

---

## Open Questions

> [!IMPORTANT]
> Please confirm before execution begins:
>
> 1. **Favicon / PWA icons:** The Monarch reference uses a butterfly logo PNG from `static/personal-case-tracker--monarch-redesign/monarch-logo.png`. Should we replace the existing PWA icons (`pwa/icon-192.png`, `favicon.svg`) with a butterfly version, or only update the sidebar logo while keeping the current PWA icons?
> 2. **Dark mode:** The Monarch design is light-only (warm parchment palette). Should we remove the dark-mode `:root` block entirely, or maintain a dark-mode variant (mapping Monarch tones into a dark version)?
> 3. **Canela font:** The display font in Monarch is `"Canela"` (a premium paid typeface) with Georgia as fallback. We don't have a Canela license. Should we use a free Google Font serif (e.g., **Playfair Display** or **Lora**) in place of Canela, or is system Georgia acceptable?
> 4. **"Quick links" page:** The Monarch sidebar shows a `Quick links` nav item (icon: link, no count). The current app has no `/quick-links` route. Should we add this route + page as part of this redesign, or defer it (just add the nav item with a disabled/coming-soon state)?

---

## Proposed Changes — Phase by Phase

---

### Phase 1 — Design Token Swap [COMPLETED]
**Blast radius:** `src/app.css`, `src/app.html`
**Risk:** 🟢 Low — pure CSS variable changes; no component edits.

#### [MODIFY] [app.css](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/app.css)

Replace both existing `:root` token blocks with a single Monarch canonical set:

```css
:root {
  /* === Core surfaces === */
  --bg:          #f5f0e8;   /* page + sidebar + topbar background */
  --surface:     #ffffff;   /* cards, inputs, modals */
  --surface-2:   #f2ede4;   /* inline bgs inside cards */
  --surface-3:   #e8e2d8;   /* tracks, disabled wells */
  --hairline:    #e0d8cc;   /* all borders */

  /* === Ink (text) === */
  --ink:    #1a1a18;
  --ink-2:  #4a4540;
  --ink-3:  #8a8278;
  --ink-4:  #b8b0a4;

  /* === Accent tints (oklch) === */
  --sage:       oklch(0.92 0.06 150);
  --sage-d:     oklch(0.70 0.10 150);
  --sage-fill:  oklch(0.55 0.14 150);
  --butter:     oklch(0.95 0.06 90);
  --butter-d:   oklch(0.80 0.10 90);
  --butter-fill:oklch(0.70 0.14 90);
  --blush:      oklch(0.95 0.05 18);
  --blush-d:    oklch(0.75 0.12 18);
  --blush-fill: oklch(0.65 0.16 18);
  --peri:       oklch(0.92 0.06 265);
  --peri-d:     oklch(0.70 0.12 265);
  --lilac:      oklch(0.92 0.05 305);
  --lilac-d:    oklch(0.70 0.10 305);

  /* === Typography === */
  --font-display: "Playfair Display", "Georgia", "Times New Roman", serif;
  --font-ui:      "Inter", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  /* === Shape === */
  --r-sm:  8px;
  --r-md: 16px;
  --r-lg: 24px;
}
```

Also update:
- `.pill` base + all `.s-*` modifiers  
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm` to match Monarch's slim `height:36px`, `border-radius: var(--r-sm)`, black primary button  
- `.card` to `background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-lg)`  
- `.input` to match Monarch's search pill style  
- `.eyebrow` utility: `font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3)`  
- `.display` utility: `font-family: var(--font-display)`  
- `.mono` utility: `font-family: var(--font-mono)`  
- `.nav-item` + `.nav-item.active` base classes
- Remove dark-mode overrides (pending Q2 answer)

#### [MODIFY] [app.html](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/app.html)
- `<title>`: "Monarch"
- `theme-color`: `#f5f0e8` (warm parchment)
- Replace Google Fonts link: add Playfair Display + Inter + JetBrains Mono
- Update `<body>` base class to `style="background: #f5f0e8"`
- Remove `color-scheme: light dark` (pending Q2 answer)

**Exit state:** App renders with Monarch warm palette but retains existing layout and component shapes.

---

### Phase 2 — Shell Rebrand (Sidebar + TopBar) [COMPLETED]
**Blast radius:** `src/lib/components/layout/`, `static/`, `src/lib/constants/navigation.ts`
**Risk:** 🟡 Low-Medium

#### [MODIFY] [Sidebar.svelte](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/lib/components/layout/Sidebar.svelte)

Exact Monarch sidebar structure:
- **Logo area:** `<img src="/monarch-logo.png">` (40×32px) + `<span class="display" style="font-size:24px">monarch</span>` (lowercase)
- **Section label:** `OUR CASE` eyebrow label above the nav list
- **Nav items** (in order): Dashboard, Timeline, Tasks (badge), Evidence (badge), Questions (badge), Quick links
- **Active state:** full-width pill, `background: var(--ink)`, text `var(--surface)`, badge bg `oklch(0.30 0.02 270)` with `var(--butter-fill)` text
- **Inactive state:** transparent bg, hover `var(--surface-2)`, transition 120ms
- **ACCOUNT section:** `ACCOUNT` eyebrow, then Settings item below (no badge)
- **Bottom footer block (sticky):** 
  - "Next step" card: tinted `var(--peri)`, shows current milestone title + estimated date
  - Avatar stack: K (sage) + A (blush/rose), stacked with `-8px` offset, names "Kyle & Sally", "private · 2 members" mono, logout icon

> [!NOTE]
> The "Next step" widget is the most unique new element — it lives at the bottom of the sidebar and is essentially a mini status card pulling from the active milestone. This will need to read from the `workspace` store or a server-side prop.

#### [MODIFY] [TopBar.svelte](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/lib/components/layout/TopBar.svelte)

Exact Monarch topbar structure:
- **Search input:** full pill, `padding-left: 44px` for icon, max-width 420px, `⌘K` kbd badge on right
- **Bell icon button:** ghost button, 44×44px
- **"+ Add" button:** primary (black fill), `height: 36px`, shows global create modal

Remove: hamburger menu toggle (sidebar is always-visible at ≥768px), user avatar, any "Case Tracker" aria labels.

#### Static + manifest
- Copy `monarch-logo.png` from redesign folder → `static/monarch-logo.png`
- Update `manifest.webmanifest`: `"name": "Monarch"`, `"short_name": "Monarch"`
- Update favicon (pending Q1 answer)

#### [MODIFY] [navigation.ts](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/lib/constants/navigation.ts)
- Add `{ href: '/quick-links', label: 'Quick links', icon: Link }` (pending Q4 answer on whether to build the page)
- Add `{ href: '/settings', label: 'Settings', icon: Settings }` (move to ACCOUNT group separately)

**Exit state:** Monarch branding fully applied to the shell visible on every page.

---

### Phase 3 — Layout Chrome & Global Typography [COMPLETED]
**Blast radius:** `src/routes/(app)/+layout.svelte`, `src/app.css` (layout utility classes)
**Risk:** 🟢 Low

#### [MODIFY] [(app)/+layout.svelte](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/routes/(app)/+layout.svelte)
- Update `<main>` padding to `32px 32px 48px` (matches Monarch's `padding: "32px 32px 48px"`)
- Remove `app-layout-p-4 app-layout-md-p-12` responsive utility classes
- Keep mobile drawer logic but update backdrop colors to `var(--ink) / 0.4`

#### [MODIFY] [app.css](file:///Users/kylenakamura/documents-local/development-local/side-projects/private-case-tracker/src/app.css)
- Add `.page-header` component class (eyebrow + large display title + subtext + action slot)
- Add `.bento` grid helper (responsive 12-col grid used on Dashboard)
- Add `.tinted-sage`, `.tinted-butter`, `.tinted-blush`, `.tinted-peri`, `.tinted-lilac` card modifier classes
- Add `.card-tight` (smaller border-radius variant: `--r-sm`)
- Add `.avatar` and `.avatar.sm` with color variants (`sage`, `blush`, `butter`, `peri`)
- Update `.dialog-*` classes to match new border/radius/surface tokens

**Exit state:** Page chrome (padding, page header, card geometry) matches Monarch. Feels right even if page content still uses old component names.

---

### Phase 4 — Dashboard [COMPLETED]
**Blast radius:** `src/lib/components/dashboard/`, `src/routes/(app)/dashboard/+page.svelte`
**Risk:** 🟡 Medium

The dashboard has **two variants** in the Monarch reference (DashboardCalm / DashboardStructured). The `DashboardStructured` variant (shown as the default screenshot) is the one to implement, as it's the 3-up card layout matching the existing data structures.

Key components to build/update:

**`PageHeader`** — new reusable component:
- `eyebrow` text (e.g., "TUESDAY · APRIL 30, 2026 · DAY 47")
- `title` using `display` font at 56px, can include `<em>` italic child
- `sub` paragraph
- status pill slot (e.g., "Awaiting USCIS adjudication")
- CTA button slot (right-aligned)

**Top row: 3-column grid**
- **Tasks card**: checkbox icon + "Tasks" display heading + "4 of 7" count; list of task rows (circle checkbox, task name, `ByAvatar` chip, due date mono); "+ Add task" ghost button at bottom
- **Milestones card**: calendar icon + "Milestones" display heading + "3/9" count; timeline dot list (sage fill = done, ink = active, surface-3 = future)
- **Open questions card**: question icon + "Open questions" + count; question cards with pill tags

**Bottom row: 2-column grid (1.4fr / 1fr)**
- **Evidence collection card**: doc icon + "Evidence collection" + "24/38" count; 3 tinted sub-cards (sage=bona fide, butter=forms, blush=vital records) each with big number, category label, progress bar
- **Quick links card**: link icon + "Quick links"; 4×2 icon grid with letter-glyphs in tinted round squares, folder variants with 2×2 mini grid, dashed "+ Add" slot; label text below each icon

**Exit state:** Dashboard page matches Monarch fully.

---

### Phase 5 — Tasks Page
**Blast radius:** `src/lib/components/tasks/`, `src/routes/(app)/tasks/+page.svelte`
**Risk:** 🟡 Medium (drag-and-drop exists)

**Kanban layout: 4-column grid**

Columns (in order):
1. **This week** — `.s-active` pill header
2. **Soon** — `.s-note` pill header
3. **Waiting** — `.s-waiting` pill header
4. **Done** — `.s-done` pill header

Each column header:
- Status pill + item count (mono, `var(--ink-3)`) + `⋯` icon button

Each task card (`.card`, `padding: 16px`):
- Optional `● overdue` eyebrow in `var(--blush-d)`
- Task title: `font-size: 13px, font-weight: 500, line-height: 1.4`
- Tags row: `.pill` chips, `height: 20px, font-size: 10px`
- Footer row: calendar icon + due date mono + subtask count (if any) + `ByAvatar`
- Strikethrough + 0.7 opacity for done cards

"+ Add a card" ghost button at bottom of each column.

**Detail modal** (shared with Timeline, Questions):
- Header: status pill (list name) + toolbar icons (image/preview/more/close)
- Title: circle checkbox (for task) / icon (for milestone/question) + display-font heading `32px`
- Action chips: `+ Add`, `Labels`, `Sub-tasks`, `Attachment`, `Link`, `Evidence`
- Metadata 2-col grid: "Assigned to" (avatar stack + dashed + button), "Due date" (calendar button + optional Overdue pill)
- Labels: pills + dashed "+ add" button
- Description: padded `var(--surface-2)` block
- Sub-tasks: progress bar + checklist rows
- Activity: comment input + avatar thread
- Footer: Delete (ghost, blush) / Cancel / Save changes (primary)

**Exit state:** Tasks page fully Monarch-styled with drag-and-drop preserved.

---

### Phase 6 — Timeline Page
**Blast radius:** `src/lib/components/timeline/`, `src/routes/(app)/timeline/+page.svelte`
**Risk:** 🟡 Medium

**Two-column layout: `1fr 320px`**

**Left: phase rail**

Each phase:
- Phase header pill-band: sage bg (done) / peri bg (active) / surface-2 (future), `border-radius: var(--r-md)`
  - `01` mono phase number, phase title (display font 22px), subtitle (12px), milestone count `n/m`, status pill
- Milestone rail (indented 28px from left):
  - Vertical line: `width: 2px`, `background: var(--surface-3)`
  - Each milestone node: 24×24 circle (sage-fill=done, ink=active, surface-3=future), check/clock icon inside
  - Milestone card: peri tinted if active, else white; contains date mono + optional "est." note + status pill, display title (18px), body text, tags + attachment count pill + `ByAvatar`
- "➕ Add milestone to [phase]" ghost button below each phase

**Right: sticky sidebar rail**
- "Phases complete" tinted-sage card: big `n/total` display number, milestone count text
- "Phase progress" card: list of all phases with dot + name + milestone count; active phase has peri bg row
- "Now" tinted-peri card: current phase title + subtitle

**Exit state:** Timeline page fully Monarch-styled.

---

### Phase 7 — Evidence Page
**Blast radius:** `src/lib/components/evidence/`, `src/routes/(app)/evidence/+page.svelte`
**Risk:** 🟡 Low-Medium

**Page header:**
- Eyebrow: "24 of 38 items collected"
- Title: "Evidence" (56px display)
- Sub: description text
- Actions: Filter button + "Add evidence" primary button

**Top: category card grid (3-col)**

Each category card (`.tinted-{color}`):
- Icon + eyebrow title
- Big count display (44px) + "/ n items" mono
- Progress bar
- Hover-reveal action buttons (rename, change color, delete) in top-right corner

"+ New category" ghost text button below grid.

**Bottom: per-category item list**

Each category section (`.card`, no padding, `overflow: hidden`):
- Header row: colored dot + category name (editable) + count + rename/delete actions + "Add item" button
- 3-column grid of evidence item cards:
  - 44×44 tinted icon square (image icon or doc icon)
  - Item title (13px, truncated), file type + date mono + `ByAvatar`

**Exit state:** Evidence page fully Monarch-styled.

---

### Phase 8 — Questions Page
**Blast radius:** `src/lib/components/questions/`, `src/routes/(app)/questions/+page.svelte`
**Risk:** 🟢 Low-Medium

**Page header:**
- Eyebrow: "3 threads · 12 questions"
- Title: "Questions"
- Sub: description
- Action: "Add question" primary button

**3-column thread layout**

Each thread column (`.card`, no padding):
- Header: status pill (thread name) + count + subtitle (who can answer, next meeting)
- Body: list of question cards (`.surface-2` bg, 12px padding, border-radius 12px):
  - Question text (13px, `text-wrap: pretty`)
  - Tag pills + spacer + avatar + date mono + replies count
- "+ Ask a question" ghost button at bottom

Thread colors:
- "For the lawyer" → `.s-waiting`
- "Interview prep" → `.s-active`
- "Between us" → `.s-note`

**Exit state:** Questions page fully Monarch-styled.

---

### Phase 9 — Settings, Auth & Onboarding
**Blast radius:** `src/routes/(app)/settings/`, `src/routes/(auth)/`, `src/routes/onboarding/`
**Risk:** 🟢 Low

#### Settings page (max-width 880px):
- **Members card:** member rows with `ByAvatar` + name/email + role pill; privacy note with shield icon
- **Case details card:** label/value/edit-button 3-col grid rows (case type, filed on, receipt #, service center, lawyer)
- **Privacy card:** tinted-sage, description + "Download backup" + "Export to PDF" buttons
- **Sign out card:** "Sign out" blush-colored display heading + logout button

#### Auth — Login:
- Centered 420px panel
- Logo image + "monarch" display text + italic tagline
- Card: "Welcome back." display heading, email/password inputs + Sign in primary button + "Forgot password?" ghost button
- Footer: "This case is private. Only invited members can sign in."

#### Auth — Invite:
- Centered 480px panel
- Tinted-blush card: avatar + "Kyle invited you" → display heading "You're invited to *our* case." → description → password input + Accept button + invite metadata mono

#### Onboarding:
- Progress dots (4 steps, pill-stretch on active)
- Card with eyebrow ("Step 2 of 4 · Your case"), display heading, description
- Radio-style option list with peri highlight for active option
- Back / Continue navigation

---

### Phase 10 — Quick Links Page *(pending Q4)*
**Blast radius:** `src/routes/(app)/quick-links/` (new route, if approved)
**Risk:** 🟢 Low

If Q4 answer is to build it: Create a new `/quick-links` route displaying the Quick links page from the Dashboard widget expanded to full width, with the icon-grid + folder support.

---

### Phase 11 — Shared Components & Cleanup Sweep
**Blast radius:** `src/lib/components/shared/`, `src/lib/components/forms/`, `src/lib/components/ui/`
**Risk:** 🟢 Low

- `CommandPalette`: Monarch warm palette (surface, hairline, ink tokens)
- All form components: ensure `.input`, `.label`, `.btn-*`, `.select` use new tokens
- Remove dead CSS from old design system
- Brand string audit: `rg -i "case tracker|case compass|case-tracker|personal case" src/`
- Confirm page `<title>` tags on all routes reference "Monarch"

---

## Verification Plan

### After Each Phase
- `npm run dev` — verify affected routes render without broken styles
- Visual check: desktop sidebar visible + mobile drawer mode
- No TypeScript or Svelte compile errors

### Final Verification (Post Phase 11)
- `npm run build` must succeed with zero errors
- Grep: `rg -i "case tracker|case compass" src/` → zero matches
- Visual review of all 7 main routes
- Check auth pages (login, invite) for Monarch branding
- Check onboarding for correct step-indicator and option styling
