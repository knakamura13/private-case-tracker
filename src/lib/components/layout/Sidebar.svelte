<script lang="ts">
	import { page } from '$app/stores';
	import { navigation, getPageNumber } from '$lib/constants/navigation';
	import { LogOut, Settings, Clock } from 'lucide-svelte';

	let { workspaceName, onNavigate }: { workspaceName: string; onNavigate?: () => void } = $props();
</script>

<aside class="sidebar" style="width: 240px; padding: 28px 20px; background: var(--bg); border-right: 1px solid var(--hairline); display: flex; flex-direction: column; gap: 28px; flex-shrink: 0; height: 100%;">
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
			<div style="flex: 1; min-width: 0;">
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
