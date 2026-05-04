# Mobile Optimization Audit Report: Private Case Tracker (Monarch)

## Repository Profile

- **Framework:** SvelteKit 2.x (Svelte 5 Runes mode).
- **Adapter:** `@sveltejs/adapter-node` (Node.js 22+).
- **CSS Strategy:** Vanilla scoped Svelte styles + global `src/app.css` (No Tailwind/UnoCSS).
- **Image Strategy:** Standard `<img>` tags (No `@sveltejs/enhanced-img`).
- **PWA Integration:** `@vite-pwa/sveltekit` (Vite PWA Plugin path).
  - **Strategy:** `generateSW` (Workbox-managed).
  - **Update Flow:** `autoUpdate`.
- **Manifest:** Dual-source (defined in `vite.config.ts` and `static/manifest.webmanifest`).
- **Rendering:** SSR (default), no explicit prerendering detected.

---

## Top 10 fixes, ranked

1. **[C1] Restore Viewport Scalability:** Remove `user-scalable=0` to meet WCAG 2.2 accessibility requirements.
2. **[D1] Increase Tap Target Sizes:** Update `.btn.icon` from 28px to at least 44px for primary actions.
3. **[A1] Parallelize Server Load:** Use `Promise.all` in `+page.server.ts` for Tasks, Questions, and Timeline routes.
4. **[D3] Fix Hover-Gated Menus:** Ensure `QuickLinksWidget` and `ThreeDotsMenu` actions are accessible via tap, not just hover.
5. **[B1] Key all `{#each}` blocks:** Add unique keys to loops in `QuickLinksWidget.svelte` and `RichText.svelte` to prevent DOM thrashing.
6. **[F3/F23] Add iOS Meta Tags:** Configure `apple-mobile-web-app-status-bar-style` for better standalone UX on iPhone.
7. **[D7] Add Active Tap Feedback:** Implement `:active` states for all `.btn` and `.nav-item` elements.
8. **[A4] Implement Lazy Loading:** Add `loading="lazy"` to non-critical images in `QuickLinksWidget` and Sidebar.
9. **[D6] Add Input Hints:** Use `inputmode="numeric"` for quantity and score fields in `EvidenceForm`.
10. **[F9] Harmonize Manifest Sources:** Consolidate PWA manifest into `vite.config.ts` and remove `static/manifest.webmanifest` to prevent sync bugs.

---

## Findings by dimension

### A. Mobile loading performance

#### [A-001] Sequential data dependencies in server load functions
- **Dimension:** A1
- **Severity:** High
- **Confidence:** High
- **Evidence:** `src/routes/(app)/tasks/+page.server.ts:13-14`, `src/routes/(app)/questions/+page.server.ts:15-20`
- **What's wrong:** Data fetches for `tasks` and `members` (or `questions` and `members`) are awaited sequentially.
- **Why it hurts mobile:** On high-latency mobile networks, the TTFB is the sum of all serial DB queries.
- **Recommended remediation:** Use `Promise.all`.
  ```ts
  const [tasks, members] = await Promise.all([
      listTasks(workspace.id),
      getMembers(workspace.id)
  ]);
  ```
- **Verification:** Compare "Server Response Time" in Chrome DevTools Network tab before and after.

#### [A-004] Missing image optimization hints
- **Dimension:** A4
- **Severity:** Medium
- **Confidence:** High
- **Evidence:** `src/lib/components/dashboard/QuickLinksWidget.svelte:531`, `src/lib/components/layout/Sidebar.svelte:11`
- **What's wrong:** Favicons and logos lack `loading="lazy"` and explicit dimensions where applicable.
- **Why it hurts mobile:** Increases main-thread contention and data usage for below-the-fold content.
- **Recommended remediation:** Add `loading="lazy"` to `QuickLinksWidget` images. Use `@sveltejs/enhanced-img` for the sidebar logo.

---

### B. Svelte/SvelteKit runtime efficiency

#### [B-001] Unkeyed `{#each}` blocks on mutable lists
- **Dimension:** B1
- **Severity:** High
- **Confidence:** High
- **Evidence:** `src/lib/components/dashboard/QuickLinksWidget.svelte:449`, `src/lib/components/ui/RichText.svelte:20`
- **What's wrong:** Lists of links and rich text segments are iterated without keys.
- **Why it hurts mobile:** Causes full DOM teardown/re-insertion on reorders (common in Quick Links), leading to "jank" on throttled CPUs.
- **Recommended remediation:**
  ```svelte
  {#each visibleFolders as folder (folder.id)}
  ```
- **Verification:** Use Svelte DevTools to observe minimal DOM updates during drag-and-drop.

---

### C. Screen-size adaptiveness

#### [C-001] Viewport zoom restricted
- **Dimension:** C1
- **Severity:** Critical
- **Confidence:** High
- **Evidence:** `src/app.html:12`
- **What's wrong:** `<meta name="viewport" content="..., maximum-scale=1, user-scalable=0">`
- **Why it hurts mobile:** Breaks WCAG 1.4.4 (Resize Text) and 2.2. Prevents low-vision users from zooming.
- **Recommended remediation:** Change to `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **Verification:** Lighthouse "Accessibility" audit: "Has a `<meta name="viewport">` tag with `width` or `initial-scale`".

#### [C-002] Fixed `min-width` on UI components
- **Dimension:** C2 / C3
- **Severity:** Medium
- **Confidence:** High
- **Evidence:** `src/app.css:872`
- **What's wrong:** `.error-toast-body` has `min-width: 320px`.
- **Why it hurts mobile:** On 320px viewports (iPhone SE), any padding or border will cause horizontal overflow.
- **Recommended remediation:** Use `max-width: 100%` or `min-width: min(320px, 100vw)`.

---

### D. Touch-input compatibility

#### [D-001] Sub-minimal tap targets for icon buttons
- **Dimension:** D1
- **Severity:** High
- **Confidence:** High
- **Evidence:** `src/app.css:252`
- **What's wrong:** `.btn.icon` is hardcoded to `28px x 28px`.
- **Why it hurts mobile:** Fails WCAG 2.2 AAA (44px) and is difficult to hit reliably.
- **Recommended remediation:** Increase `min-width` and `height` to `44px` for mobile viewports using media queries.

#### [D-003] Hover-gated functionality
- **Dimension:** D3
- **Severity:** High
- **Confidence:** High
- **Evidence:** `src/app.css:764-770`, `src/lib/components/dashboard/QuickLinksWidget.svelte:459`
- **What's wrong:** Quick Link menu (⋮) visibility is gated behind `.widget-item:hover`.
- **Why it hurts mobile:** Touch devices have no hover; users must tap once to "hover" and again to trigger, or the menu never appears.
- **Recommended remediation:** Ensure menus are always visible or use a tap-to-reveal pattern with `aria-expanded`.

#### [D-007] Lack of visual tap feedback
- **Dimension:** D7
- **Severity:** Medium
- **Confidence:** High
- **Evidence:** `src/app.css:211` (`.btn`), `src/lib/components/layout/Sidebar.svelte:style`
- **What's wrong:** Buttons lack `:active` styles.
- **Why it hurts mobile:** Users often "double tap" because they aren't sure if the first tap registered.
- **Recommended remediation:** Add `.btn:active { transform: scale(0.98); opacity: 0.8; }`.

---

### F. PWA-specific concerns

#### [F-003] Missing iOS Status Bar configuration
- **Dimension:** F3 / F23
- **Severity:** Medium
- **Confidence:** High
- **Evidence:** `src/app.html` (absence of tag)
- **What's wrong:** Missing `apple-mobile-web-app-status-bar-style`.
- **Why it hurts mobile:** Defaults to a white bar which might clash with the app's dark theme color (`#0f172a`).
- **Recommended remediation:** Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`.

#### [F-009] Conflicting Manifest Sources
- **Dimension:** F9
- **Severity:** Low
- **Confidence:** High
- **Evidence:** `vite.config.ts:33`, `static/manifest.webmanifest`
- **What's wrong:** PWA manifest is defined in two places with slightly different fields (e.g., `orientation`).
- **Why it hurts mobile:** Leads to inconsistent install behavior depending on which manifest the browser prioritizes.
- **Recommended remediation:** Delete `static/manifest.webmanifest` and rely entirely on the Vite PWA plugin config.

---

## Out of scope / unverified
- **Runtime Bundle Size:** Static analysis suggests root layout imports are lightweight, but a `vite-bundle-visualizer` run is recommended.
- **Offline Fallback Page:** The Workbox config is `generateSW`, but a custom `/offline` route is not explicitly precached in `vite.config.ts`.

## Verification commands

- **Baseline Audit:** `npx lighthouse http://localhost:5173 --preset=desktop --emulated-form-factor=mobile`
- **PWA Validation:** `npx @vite-pwa/sveltekit-check`
- **Bundle Analysis:** `pnpm build && npx vite-bundle-visualizer`
