# Phase 9 Implementation Plan: Settings, Auth & Onboarding Redesign

## Objective

Update the Settings, Auth, and Onboarding pages to match the Monarch design system.

## Key Files

- **Settings:** `src/routes/(app)/settings/`
- **Auth:** `src/routes/(auth)/`
- **Onboarding:** `src/routes/onboarding/`
- **CSS Tokens:** `src/app.css`

## Implementation Steps

1. **Settings Page:**
    - Reorganize into max-width 880px container.
    - Style member list (avatars, role pills).
    - Style case details grid.
    - Add "Privacy" tinted-sage card and "Sign out" tinted-blush card.
2. **Auth (Login/Invite/Signup):**
    - Center panels (420px for login, 480px for invite).
    - Apply Monarch typography (display font for titles) and warm palette.
3. **Onboarding:**
    - Update progress indicators (pill-stretch active dots).
    - Apply Monarch typography and layout cards.
    - Update radio option styling to match Monarch's peri-highlight active state.

## Verification & Testing

- `npm run dev` to verify all routes.
- Visual consistency check for Monarch branding.
- Verify modal/form interactions in settings.

## Rollback Strategy

- Revert changes via git.
