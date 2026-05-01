# Phase 2 Execution Prompt: Shell Rebrand (Sidebar + TopBar)

## Goal
Update the main application shell (Sidebar and TopBar) to use the "Monarch" branding, layout, and new design components.

## Critical Instructions
- **Do NOT** change the logic of how `navigation` works or how `user` data is fetched.
- **Maintain** the mobile sidebar toggle functionality.
- **Follow the exact markup** for the sidebar footer and "Next step" widget.

---

## Step 1: Assets Preparation

1.  **Copy Logo:** Copy `static/personal-case-tracker--monarch-redesign/monarch-logo.png` to `static/monarch-logo.png`.

---

## Step 2: Update Navigation Constants

**File:** `src/lib/constants/navigation.ts`

1.  **Update Navigation Items:** Ensure the `navigation` array matches this exactly:
    ```typescript
    export const navigation: NavItem[] = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/timeline', label: 'Timeline', icon: List, description: 'Case phases and milestones' },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare, description: 'Personal todos and errands' },
      { href: '/evidence', label: 'Evidence', icon: Layers, description: 'Evidence library' },
      { href: '/questions', label: 'Questions', icon: HelpCircle, description: 'Research tracker' },
      { href: '/quick-links', label: 'Quick links', icon: Link } // Add Link icon from lucide-svelte
    ];
    ```
    *Note: You may need to import `Link` from `lucide-svelte`.*

---

## Step 3: Rewrite `Sidebar.svelte`

**File:** `src/lib/components/layout/Sidebar.svelte`

Replace the entire contents with this simplified, Monarch-compliant structure:

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { navigation, getPageNumber } from '$lib/constants/navigation';
	import { LogOut, Settings, Clock } from 'lucide-svelte';

	let { workspaceName, onNavigate }: { workspaceName: string; onNavigate?: () => void } = $props();
</script>

<aside class="sidebar" style="width: 240px; padding: 28px 20px; background: var(--bg); border-right: 1px solid var(--hairline); display: flex; flexDirection: column; gap: 28px; flex-shrink: 0;">
	<!-- Header -->
	<div style="display: flex; align-items: center; gap: 12px; padding: 0 8px;">
		<img src="/monarch-logo.png" alt="Monarch" width="40" height="32" style="flex-shrink: 0; display: block; object-fit: contain;" />
		<div class="display" style="font-size: 24px; line-height: 1; letter-spacing: -0.01em;">monarch</div>
	</div>

	<!-- Navigation Section -->
	<div>
		<div class="eyebrow" style="padding: 0 16px 10px;">Our case</div>
		<div style="display: flex; flex-direction: column; gap: 2px;">
			{#each navigation as item (item.href)}
				{@const active = $page.url.pathname === item.href || $page.url.pathname.startsWith(`${item.href}/`)}
				<a
					href={item.href}
					onclick={() => onNavigate?.()}
					class="nav-item {active ? 'active' : ''}"
					style="display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; text-decoration: none; transition: all 120ms; color: {active ? 'var(--surface)' : 'var(--ink-2)'}; background: {active ? 'var(--ink)' : 'transparent'};"
				>
					<item.icon size={18} />
					<span style="flex: 1;">{item.label}</span>
					{#if getPageNumber(item.href)}
						<span class="mono" style="font-size: 11px; background: {active ? 'oklch(0.30 0.02 270)' : 'var(--surface-3)'}; padding: 2px 7px; border-radius: 999px; color: {active ? 'var(--butter-fill)' : 'var(--ink-2)'};">
							{getPageNumber(item.href)}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	</div>

	<!-- Account Section -->
	<div>
		<div class="eyebrow" style="padding: 0 16px 10px;">Account</div>
		<div style="display: flex; flex-direction: column; gap: 2px;">
			<a href="/settings" class="nav-item" style="display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; text-decoration: none; color: var(--ink-2);">
				<Settings size={18} />
				<span>Settings</span>
			</a>
		</div>
	</div>

	<!-- Footer -->
	<div style="margin-top: auto;">
		<!-- Next Step Widget (Hardcoded for now, or use real data if available) -->
		<div class="card-tight" style="background: var(--peri); border: 1px solid transparent; padding: 14px; border-radius: var(--r-sm); margin-bottom: 12px;">
			<div class="eyebrow" style="margin-bottom: 6px;">Next step</div>
			<div style="font-size: 13px; font-weight: 600; margin-bottom: 4px; line-height: 1.3;">
				USCIS biometrics
			</div>
			<div class="mono" style="font-size: 11px; color: oklch(0.32 0.13 265);">
				<Clock size={11} style="vertical-align: -2px; margin-right: 4px;" />
				Pending schedule
			</div>
		</div>

		<div style="display: flex; align-items: center; gap: 10px; padding: 16px 8px 0; border-top: 1px solid var(--hairline);">
			<div style="display: flex;">
				<div class="avatar sm sage" style="width: 22px; height: 22px; border-radius: 999px; background: var(--sage-fill); color: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; border: 2px solid var(--bg);">K</div>
				<div class="avatar sm blush" style="width: 22px; height: 22px; border-radius: 999px; background: var(--blush-fill); color: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; border: 2px solid var(--bg); margin-left: -8px;">S</div>
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style="font-size: 12px; font-weight: 600;">Kyle & Sally</div>
				<div class="mono" style="font-size: 10px; color: var(--ink-3);">private · 2 members</div>
			</div>
			<form method="post" action="/auth/sign-out">
				<button type="submit" style="background: none; border: none; padding: 0; color: var(--ink-3); cursor: pointer;">
					<LogOut size={14} />
				</button>
			</form>
		</div>
	</div>
</aside>
```

---

## Step 4: Rewrite `Topbar.svelte`

**File:** `src/lib/components/layout/Topbar.svelte`

Replace the entire contents with the Monarch search-focused bar:

```svelte
<script lang="ts">
	import { Search, Bell, Plus, Menu } from 'lucide-svelte';

	let { onOpenSearch, onToggleSidebar }: { onOpenSearch: () => void; onToggleSidebar: () => void } = $props();
</script>

<header class="topbar" style="display: flex; align-items: center; gap: 16px; padding: 20px 32px; border-bottom: 1px solid var(--hairline); background: var(--bg);">
	<!-- Mobile Menu Toggle -->
	<button class="topbar-menu-btn" style="display: none; @media (max-width: 768px) { display: flex; }" onclick={onToggleSidebar}>
		<Menu size={20} />
	</button>

	<!-- Search Pill -->
	<div style="position: relative; flex: 1; max-width: 420px;">
		<Search size={16} style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--ink-3);" />
		<button
			onclick={onOpenSearch}
			class="input"
			style="width: 100%; text-align: left; padding: 0 44px; height: 44px; border-radius: 999px; background: var(--surface); border: 1px solid var(--hairline); color: var(--ink-3); font-size: 14px; cursor: text;"
		>
			Search tasks, evidence, questions…
		</button>
		<span class="mono" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--ink-3); background: var(--surface-3); padding: 2px 6px; border-radius: 6px;">⌘K</span>
	</div>

	<div style="flex: 1;"></div>

	<!-- Notifications -->
	<button class="btn ghost" style="width: 44px; padding: 0; justify-content: center; border-radius: 999px;">
		<Bell size={18} />
	</button>

	<!-- Global Add -->
	<button class="btn primary">
		<Plus size={16} />
		<span style="margin-left: 4px;">Add</span>
	</button>
</header>
```

---

## Verification
- Run `npm run dev`.
- Sidebar should show the butterfly logo and the new "Next step" widget.
- Navigation links should work correctly.
- Search bar in topbar should be a pill and trigger the search modal (if implemented).
- App should look like "Monarch" at the top and left edges.
