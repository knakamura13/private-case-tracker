<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopBar from '$lib/components/layout/Topbar.svelte';
	import CommandPalette from '$lib/components/shared/CommandPalette.svelte';
	import { initTruncateTitles } from '$lib/utils/truncate-titles';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let sidebarOpen = $state(false);
	let paletteOpen = $state(false);

	let sidebarDialogEl = $state<HTMLDivElement | null>(null);
	let sidebarOpenerEl = $state<HTMLElement | null>(null);

	function getFocusable(container: HTMLElement): HTMLElement[] {
		const nodes = container.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		return Array.from(nodes).filter((el) => {
			const style = window.getComputedStyle(el);
			return style.display != 'none' && style.visibility != 'hidden';
		});
	}

	function trapTabKey(e: KeyboardEvent, container: HTMLElement) {
		if (e.key !== 'Tab') return;
		const focusable = getFocusable(container);
		if (focusable.length === 0) return;
		const active = document.activeElement as HTMLElement | null;
		const first = focusable[0]!;
		const last = focusable[focusable.length - 1]!;
		if (e.shiftKey) {
			if (!active || active === first || !container.contains(active)) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (!active || active === last || !container.contains(active)) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	onMount(initTruncateTitles);
</script>

<div class="app-layout">
	<!-- Desktop Sidebar -->
	<div class="sidebar-wrapper">
		<Sidebar workspaceName={data.workspace.name} />
	</div>

	<!-- Mobile Sidebar Dialog -->
	{#if sidebarOpen}
		<div
			class="mobile-sidebar-container"
			role="dialog"
			aria-modal="true"
			aria-label="Sidebar"
			tabindex="-1"
			onkeydown={(e) => {
				if (e.key === 'Escape') sidebarOpen = false;
				if (sidebarDialogEl) trapTabKey(e, sidebarDialogEl);
			}}
		>
			<div
				transition:fade={{ duration: 200 }}
				class="mobile-sidebar-overlay"
				aria-hidden="true"
				onclick={() => (sidebarOpen = false)}
			></div>
			<div
				bind:this={sidebarDialogEl}
				tabindex="-1"
				class="mobile-sidebar-panel"
				transition:fly={{ x: -280, duration: 220, opacity: 1 }}
			>
				<Sidebar workspaceName={data.workspace.name} onNavigate={() => (sidebarOpen = false)} />
			</div>
		</div>
	{/if}

	<!-- Main Area -->
	<div class="main-area">
		<TopBar
			onOpenSearch={() => (paletteOpen = true)}
			onToggleSidebar={() => {
				if (!sidebarOpen) sidebarOpenerEl = document.activeElement as HTMLElement | null;
				sidebarOpen = !sidebarOpen;
			}}
		/>
		<main id="main" tabindex="-1" class="main-content">
			{#key $page.url.pathname}
				{@render children()}
			{/key}
		</main>
	</div>
</div>

<style>
	.app-layout {
		display: flex;
		height: 100vh;
		background: var(--bg);
	}
	.sidebar-wrapper {
		display: none;
		position: sticky;
		top: 0;
		height: 100vh;
	}
	@media (min-width: 768px) {
		.sidebar-wrapper {
			display: block;
		}
	}
	.mobile-sidebar-container {
		position: fixed;
		inset: 0;
		z-index: 40;
	}
	@media (min-width: 768px) {
		.mobile-sidebar-container {
			display: none;
		}
	}
	.mobile-sidebar-overlay {
		position: absolute;
		inset: 0;
		background: rgba(26, 26, 24, 0.4);
		backdrop-filter: blur(4px);
	}
	.mobile-sidebar-panel {
		position: relative;
		z-index: 10;
		height: 100%;
		width: 280px;
	}
	.main-area {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		min-height: 0;
	}
	.main-content {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		padding: 32px 32px 48px;
		background: var(--bg);
	}
</style>

<CommandPalette bind:open={paletteOpen} />

{#if sidebarOpen && sidebarDialogEl}
	{@const _focus = (() => {
		queueMicrotask(() => {
			if (!sidebarDialogEl) return;
			const focusable = getFocusable(sidebarDialogEl);
			(focusable[0] ?? sidebarDialogEl)?.focus();
		});
		return null;
	})()}
{/if}

{#if !sidebarOpen && sidebarOpenerEl}
	{@const _restore = (() => {
		queueMicrotask(() => sidebarOpenerEl?.focus());
		sidebarOpenerEl = null;
		return null;
	})()}
{/if}
