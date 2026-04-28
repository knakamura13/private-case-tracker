<script lang="ts">
	import { Menu, Search, LogOut, Settings } from 'lucide-svelte';
	import { initials } from '$lib/utils/format';

	let {
		user,
		onOpenSearch,
		onToggleSidebar
	}: {
		user: { email: string; name: string | null; image: string | null };
		onOpenSearch: () => void;
		onToggleSidebar: () => void;
	} = $props();

	let menuOpen = $state(false);
	let menuButtonEl = $state<HTMLButtonElement | null>(null);
	let menuEl = $state<HTMLDivElement | null>(null);

	function closeMenu() {
		menuOpen = false;
		queueMicrotask(() => menuButtonEl?.focus());
	}

	$effect(() => {
		if (!menuOpen) return;
		const controller = new AbortController();
		const { signal } = controller;

		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') closeMenu();
		}
		function onClick(e: MouseEvent) {
			if (menuButtonEl?.contains(e.target as Node) || menuEl?.contains(e.target as Node)) return;
			closeMenu();
		}
		window.addEventListener('keydown', onKeydown, { signal });
		window.addEventListener('click', onClick, { capture: true, signal });

		return () => {
			controller.abort();
		};
	});
</script>

<header class="topbar">
	<div class="topbar-left">
		<button
			type="button"
			class="topbar-menu-btn"
			aria-label="Open sidebar"
			onclick={onToggleSidebar}
		>
			<Menu class="h-4 w-4" />
		</button>
		<button
			type="button"
			onclick={onOpenSearch}
			class="topbar-search-btn"
		>
			<Search class="h-4 w-4" />
			<span class="truncate">Search tasks, forms, evidence…</span>
			<span class="ml-auto hidden text-xs sm:inline">⌘K</span>
		</button>
	</div>

	<div class="topbar-right">
		<div class="relative">
			<button
				bind:this={menuButtonEl}
				class="topbar-avatar-btn"
				aria-label="Open user menu"
				type="button"
				aria-haspopup="true"
				aria-expanded={menuOpen}
				aria-controls="user-menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{initials(user.name, user.email)}
			</button>
			{#if menuOpen}
				<div
					bind:this={menuEl}
					class="topbar-dropdown"
					id="user-menu"
					role="group"
					aria-label="User menu"
				>
					<div class="topbar-dropdown-user">
						<p class="topbar-dropdown-name">{user.name ?? user.email}</p>
						<p class="topbar-dropdown-email">{user.email}</p>
					</div>
					<div class="topbar-dropdown-divider"></div>
					<a
						class="topbar-dropdown-item"
						href="/settings/profile"
						onclick={closeMenu}
					>
						Profile
					</a>
					<a
						class="topbar-dropdown-item"
						href="/settings/security"
						onclick={closeMenu}
					>
						Security
					</a>
					<a
						class="topbar-dropdown-item"
						href="/settings/members"
						onclick={closeMenu}
					>
						Members
					</a>
					<a
						class="topbar-dropdown-item"
						href="/settings"
						onclick={closeMenu}
					>
						<Settings class="h-4 w-4" /> Settings
					</a>
					<div class="topbar-dropdown-divider"></div>
					<form method="post" action="/auth/sign-out">
						<button
							class="topbar-dropdown-item topbar-dropdown-item-destructive"
							type="submit"
							onclick={closeMenu}
						>
							<LogOut class="h-4 w-4" /> Sign out
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</header>
