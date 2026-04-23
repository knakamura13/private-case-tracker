<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import CommandPalette from '$lib/components/shared/CommandPalette.svelte';
	import QuickAddMenu from '$lib/components/shared/QuickAddMenu.svelte';
	import { initTruncateTitles } from '$lib/utils/truncate-titles';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let sidebarOpen = $state(false);
	let paletteOpen = $state(false);
	let quickAddOpen = $state(false);

	onMount(initTruncateTitles);
</script>

<div class="flex min-h-screen bg-background">
	<div class="hidden md:block">
		<Sidebar workspaceName={data.workspace.name} />
	</div>
	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 md:hidden">
			<button
				transition:fade={{ duration: 200 }}
				class="absolute inset-0 bg-background/70 backdrop-blur-sm"
				aria-label="Close sidebar"
				onclick={() => (sidebarOpen = false)}
			></button>
			<div
				in:fly={{ x: -264, duration: 280, opacity: 1 }}
				out:fly={{ x: -264, duration: 200, opacity: 1 }}
				class="relative z-10 h-full w-64"
			>
				<Sidebar workspaceName={data.workspace.name} onNavigate={() => (sidebarOpen = false)} />
			</div>
		</div>
	{/if}

	<div class="flex min-w-0 flex-1 flex-col">
		<TopBar
			user={data.user}
			onOpenSearch={() => (paletteOpen = true)}
			onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
			onOpenQuickAdd={() => (quickAddOpen = true)}
		/>
		<main id="main" class="flex-1 overflow-y-auto p-4 md:p-6">
			{@render children()}
		</main>
	</div>
</div>

<CommandPalette bind:open={paletteOpen} />
<QuickAddMenu bind:open={quickAddOpen} />
