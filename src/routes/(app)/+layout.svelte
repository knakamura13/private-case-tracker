<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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

<div class="flex h-screen bg-background">
	<div class="hidden md:block sticky top-0 h-screen">
		<Sidebar workspaceName={data.workspace.name} />
	</div>
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-40 md:hidden"
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
				class="absolute inset-0 bg-background/70 backdrop-blur-sm"
				aria-hidden="true"
				onclick={() => (sidebarOpen = false)}
			></div>
			<div
				bind:this={sidebarDialogEl}
				tabindex="-1"
				in:fly={{ x: -264, duration: 280, opacity: 1 }}
				out:fly={{ x: -264, duration: 200, opacity: 1 }}
				class="relative z-10 h-full w-60"
			>
				<Sidebar workspaceName={data.workspace.name} onNavigate={() => (sidebarOpen = false)} />
			</div>
		</div>
	{/if}

	<div class="flex min-w-0 flex-1 min-h-0 flex-col">
		<TopBar
			user={data.user}
			onOpenSearch={() => (paletteOpen = true)}
			onToggleSidebar={() => {
				if (!sidebarOpen) sidebarOpenerEl = document.activeElement as HTMLElement | null;
				sidebarOpen = !sidebarOpen;
			}}
		/>
		<main id="main" tabindex="-1" class="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-12 md:pb-32">
			{#key $page.url.pathname}
				<div in:fly={{ y: 30, duration: 400, easing: cubicOut }}>
					{@render children()}
				</div>
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
