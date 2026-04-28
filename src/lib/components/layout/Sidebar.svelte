<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/constants/navigation';
	import { cn } from '$lib/utils/cn';

	const isOwner = $page.data.workspace?.role === 'OWNER';

	let { workspaceName, onNavigate }: { workspaceName: string; onNavigate?: () => void } = $props();
</script>

<aside class="sidebar">
	<a href="/dashboard" class="sidebar-header">
		<img src="/pwa/icon-192.png" alt="" class="sidebar-logo" aria-hidden="true" />
		<div class="min-w-0">
			<p class="sidebar-title">Case Tracker</p>
			<p class="sidebar-subtitle" title={workspaceName}>{workspaceName}</p>
		</div>
	</a>
	<nav class="sidebar-nav" aria-label="Primary">
		<ul class="sidebar-nav-list">
			{#each navigation.filter((i) => !i.ownerOnly || isOwner) as item (item.href)}
				{@const active = $page.url.pathname === item.href || $page.url.pathname.startsWith(`${item.href}/`)}
				<li>
					<a
						href={item.href}
						data-sveltekit-prefetch
						onclick={() => onNavigate?.()}
						aria-current={active ? 'page' : undefined}
						class={cn(
							'sidebar-nav-item',
							active ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
						)}
					>
						<item.icon class="sidebar-nav-icon" aria-hidden="true" />
						<span>{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</aside>
