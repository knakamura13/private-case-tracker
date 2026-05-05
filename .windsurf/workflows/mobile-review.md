---
description: SvelteKit Mobile Optimization Audit
auto_execution_mode: 3
---

## Quick Audit Commands

```bash
# Lighthouse mobile audit
npx lighthouse http://localhost:5173 --preset=desktop --emulated-form-factor=mobile

# PWA validation
npx @vite-pwa/sveltekit-check

# Bundle analysis
pnpm build && npx vite-bundle-visualizer
```

## Critical Fixes (Priority Order)

1. **Viewport Scaling** - Remove `user-scalable=0` from meta viewport tag
2. **Tap Targets** - Increase `.btn.icon` from 28px to 44px minimum
3. **Server Performance** - Use `Promise.all` for parallel data loading
4. **Hover Menus** - Make dropdowns accessible without hover state
5. **Keyed Lists** - Add keys to `{#each}` blocks in QuickLinksWidget and RichText
6. **iOS Meta Tags** - Add `apple-mobile-web-app-status-bar-style` meta tag
7. **Active Feedback** - Implement `:active` states for buttons
8. **Lazy Loading** - Add `loading="lazy"` to non-critical images
9. **Input Hints** - Use `inputmode="numeric"` for form fields
10. **Manifest Sync** - Consolidate PWA manifest to vite.config.ts only

## Files to Check

- `src/app.html` - Viewport meta tag, iOS status bar
- `src/app.css` - Button sizes, active states, min-width issues
- `src/routes/(app)/+page.server.ts` - Sequential data loading
- `src/lib/components/dashboard/QuickLinksWidget.svelte` - Unkeyed lists, hover menus, lazy images
- `src/lib/components/ui/RichText.svelte` - Unkeyed lists
- `vite.config.ts` - PWA manifest configuration
- `static/manifest.webmanifest` - Remove if duplicate

## Verification Steps

1. Run Lighthouse before and after fixes
2. Test on actual devices (iPhone SE 320px viewport)
3. Check PWA installation behavior
4. Validate bundle size changes
