<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { Menu, Search, Plus, LogOut } from 'lucide-svelte';
	import { initials } from '$lib/utils/format';
	import { cn } from '$lib/utils/cn';

	let {
		user,
		onOpenSearch,
		onToggleSidebar,
		onOpenQuickAdd
	}: {
		user: { email: string; name: string | null; image: string | null };
		onOpenSearch: () => void;
		onToggleSidebar: () => void;
		onOpenQuickAdd: () => void;
	} = $props();

	let menuOpen = $state(false);
	let menuButtonEl = $state<HTMLButtonElement | null>(null);

	function closeMenu() {
		menuOpen = false;
		queueMicrotask(() => menuButtonEl?.focus());
	}

	$effect(() => {
		if (!menuOpen) return;
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') closeMenu();
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

<header
	class="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/80 px-4 backdrop-blur"
>
	<div class="flex min-w-0 flex-1 items-center gap-2">
		<button
			type="button"
			class="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
			aria-label="Open sidebar"
			onclick={onToggleSidebar}
		>
			<Menu class="h-4 w-4" />
		</button>
		<button
			type="button"
			onclick={onOpenSearch}
			class={cn(
				'flex h-9 w-full min-w-[220px] max-w-xl items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground hover:bg-muted'
			)}
		>
			<Search class="h-4 w-4" />
			<span>Search tasks, forms, evidence…</span>
			<span class="ml-auto hidden text-xs sm:inline">⌘K</span>
		</button>
	</div>

	<div class="flex items-center gap-2">
		<Button variant="outline" size="sm" onclick={onOpenQuickAdd}>
			{#snippet children()}<Plus class="h-4 w-4" />New{/snippet}
		</Button>
		<div class="relative">
			<button
				bind:this={menuButtonEl}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold"
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
					class="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card p-2 text-sm shadow-lg"
					id="user-menu"
					role="group"
					aria-label="User menu"
				>
					<div class="px-2 py-1.5">
						<p class="truncate font-medium">{user.name ?? user.email}</p>
						<p class="truncate text-xs text-muted-foreground">{user.email}</p>
					</div>
					<div class="my-1 border-t border-border"></div>
					<a
						class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
						href="/settings/profile"
						onclick={closeMenu}
					>
						Profile
					</a>
					<a
						class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
						href="/settings/security"
						onclick={closeMenu}
					>
						Security
					</a>
					<a
						class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
						href="/settings/members"
						onclick={closeMenu}
					>
						Members
					</a>
					<div class="my-1 border-t border-border"></div>
					<form method="post" action="/logout">
						<button
							class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-destructive hover:bg-destructive/10"
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
