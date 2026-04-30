	<script lang="ts">
		import { onMount } from 'svelte';
		import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
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

<div class="app-layout-flex app-layout-h-screen app-layout-bg-background">
	<div class="app-layout-hidden app-layout-md-block app-layout-sticky app-layout-top-0 app-layout-h-screen">
		<Sidebar workspaceName={data.workspace.name} />
	</div>
	{#if sidebarOpen}
		<div
			class="app-layout-fixed app-layout-inset-0 app-layout-z-40 app-layout-md-hidden"
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
				class="app-layout-absolute app-layout-inset-0 app-layout-bg-background-70 app-layout-backdrop-blur-sm"
				aria-hidden="true"
				onclick={() => (sidebarOpen = false)}
			></div>
			<div
				bind:this={sidebarDialogEl}
				tabindex="-1"
				class="app-layout-relative app-layout-z-10 app-layout-h-full app-layout-w-60"
				transition:fly={{ x: -280, duration: 220, opacity: 1 }}
			>
				<Sidebar workspaceName={data.workspace.name} onNavigate={() => (sidebarOpen = false)} />
			</div>
		</div>
	{/if}

	<div class="app-layout-flex app-layout-min-w-0 app-layout-flex-1 app-layout-min-h-0 app-layout-flex-col">
		<TopBar
			user={data.user}
			onOpenSearch={() => (paletteOpen = true)}
			onToggleSidebar={() => {
				if (!sidebarOpen) sidebarOpenerEl = document.activeElement as HTMLElement | null;
				sidebarOpen = !sidebarOpen;
			}}
		/>
		<main id="main" tabindex="-1" class="app-layout-flex-1 app-layout-overflow-y-auto app-layout-overflow-x-hidden app-layout-p-4 app-layout-pb-24 app-layout-md-p-12 app-layout-md-pb-32">
			{#key $page.url.pathname}
				{@render children()}
			{/key}
		</main>
	</div>
</div>

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
