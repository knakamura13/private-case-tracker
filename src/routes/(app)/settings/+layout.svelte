<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils/cn';
	let { children }: { children: import('svelte').Snippet } = $props();

	const sections = [
		{ href: '/settings/profile', label: 'Profile' },
		{ href: '/settings/security', label: 'Security' },
		{ href: '/settings/members', label: 'Members' },
		{ href: '/settings/data', label: 'Data & privacy' },
		{ href: '/settings/tags', label: 'Tags' },
		{ href: '/settings/dev', label: 'Dev' }
	];
</script>

<div class="settings-layout-flex settings-layout-flex-col settings-layout-gap-6 settings-layout-md-flex-row">
	<aside class="settings-layout-md-w-48">
		<nav aria-label="Settings sections">
			<ul class="settings-layout-space-y-1 settings-layout-text-sm">
				{#each sections as s (s.href)}
					{@const active = $page.url.pathname === s.href}
					<li>
						<a
							href={s.href}
							aria-current={active ? 'page' : undefined}
							class={cn(
								'settings-layout-block settings-layout-rounded-md settings-layout-px-3 settings-layout-py-2',
								active ? 'settings-layout-bg-primary-10 settings-layout-text-primary' : 'settings-layout-text-muted settings-layout-hover-bg-muted'
							)}
						>
							{s.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>
	<div class="settings-layout-min-w-0 settings-layout-flex-1">{@render children()}</div>
</div>
